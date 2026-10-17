import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'node:crypto';
import { extname } from 'node:path';
import { eq, and } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import * as schema from '../../../db/schema/index.js';
import { document } from '../../../db/schema/documentation.js';
import type { DocumentType } from '../../../db/schema/documentation.js';
import { worker } from '../../../db/schema/worker.js';

// Worker တစ်ယောက်မှာ upload လုပ်နိုင်တဲ့ file အများဆုံး
const MAX_FILES_PER_WORKER = 10;

@Injectable()
export class DocumentService {
  private readonly s3: S3Client;
  private readonly bucket: string;

  constructor(
    @Inject('DB')
    private readonly db: PostgresJsDatabase<typeof schema>,
    private readonly config: ConfigService,
  ) {
    this.bucket = this.config.getOrThrow<string>('R2_BUCKET_NAME');
    this.s3 = new S3Client({
      region: 'auto',
      endpoint: this.config.getOrThrow<string>('R2_ENDPOINT'),
      credentials: {
        accessKeyId: this.config.getOrThrow<string>('R2_ACCESS_KEY_ID'),
        secretAccessKey: this.config.getOrThrow<string>('R2_SECRET_ACCESS_KEY'),
      },
    });
  }

  // ── Upload: multiple files တစ်ကြိမ်တည်း ──────────────────────────────────
  async uploadDocuments(
    files: Express.Multer.File[],
    documentTypes: DocumentType[],
    workerId: string,
    userId: string,
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files provided');
    }
    if (documentTypes.length !== files.length) {
      throw new BadRequestException(
        'Provide exactly one documentType for each uploaded file',
      );
    }

    // Worker ရှိ/မရှိ စစ်
    const [workerRecord] = await this.db
      .select()
      .from(schema.worker)
      .where(eq(schema.worker.id, workerId))
      .limit(1);
    if (!workerRecord) {
      throw new NotFoundException(`Worker ${workerId} not found`);
    }

    // ယခု worker မှာ document ဘယ်နှစ်ခုရှိပြီလဲ စစ်
    const existingDocs = await this.db
      .select({ id: schema.document.id })
      .from(schema.document)
      .where(eq(schema.document.workerId, workerId));

    const totalAfterUpload = existingDocs.length + files.length;
    if (totalAfterUpload > MAX_FILES_PER_WORKER) {
      throw new BadRequestException(
        `Worker already has ${existingDocs.length} document(s). ` +
          `Cannot add ${files.length} more (max ${MAX_FILES_PER_WORKER}).`,
      );
    }

    // R2 ကို တပြိုင်နက် upload (Promise.all loop)
    const uploaded = (await Promise.all(
      files.map(async (file, index) => {
        const ext = extname(file.originalname).toLowerCase();
        const key = `documents/${workerId}/${randomUUID()}${ext}`;

        await this.s3.send(
          new PutObjectCommand({
            Bucket: this.bucket,
            Key: key,
            Body: file.buffer,
            ContentType: file.mimetype,
          }),
        );

        return {
          id: randomUUID(),
          userId,
          workerId,
          objectKey: key,
          originalName: file.originalname,
          documentType: documentTypes[
            index
          ] as (typeof document.$inferInsert)['documentType'],
          mimeType: file.mimetype,
          size: file.size,
        } satisfies typeof document.$inferInsert;
      }),
    )) as Array<typeof document.$inferInsert>;

    // DB မှာ တစ်ကြိမ်တည်း insert (batch)
    const inserted = await this.db
      .insert(document)
      .values(uploaded)
      .returning();

    const ids = inserted.map((d) => d.id);
    const docsWithUser = await this.db.query.document.findMany({
      where: (doc, { inArray }) => inArray(doc.id, ids),
      with: {
        user: true,
      },
    });

    return {
      message: `${inserted.length} document(s) uploaded successfully`,
      data: docsWithUser,
    };
  }

  // ── Worker ရဲ့ document list ───────────────────────────────────────────────
  async getWorkerDocuments(workerId: string) {
    const [workerRecord] = await this.db
      .select()
      .from(worker)
      .where(eq(worker.id, workerId))
      .limit(1);
    if (!workerRecord) {
      throw new NotFoundException(`Worker ${workerId} not found`);
    }

    const docs = await this.db.query.document.findMany({
      where: eq(document.workerId, workerId),
      with: {
        user: true,
      },
    });

    return { total: docs.length, data: docs };
  }

  async findOne(id: string) {
    const found = await this.db.query.document.findFirst({
      where: eq(document.id, id),
      with: {
        user: true,
      },
    });
    if (!found) throw new NotFoundException(`Document ${id} not found`);
    return found;
  }

  // ── Download: Presigned URL ထုတ်ပေး (15 min သက်တမ်း) ─────────────────────
  async getDownloadUrl(documentId: string) {
    const [doc] = await this.db
      .select()
      .from(document)
      .where(eq(document.id, documentId))
      .limit(1);

    if (!doc) {
      throw new NotFoundException(`Document ${documentId} not found`);
    }

    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: doc.objectKey,
    });

    // Presigned URL — 15 min သာ သက်တမ်းရှိ၊ ပြီးရင် expire
    const url = await getSignedUrl(this.s3, command, { expiresIn: 900 });

    return {
      documentId: doc.id,
      originalName: doc.originalName,
      mimeType: doc.mimeType,
      size: doc.size,
      downloadUrl: url,
      expiresInSeconds: 900,
    };
  }

  // ── Delete: R2 + DB တပြိုင်နက် ────────────────────────────────────────────
  async deleteDocument(documentId: string, userId: string) {
    const [doc] = await this.db
      .select()
      .from(document)
      .where(and(eq(document.id, documentId), eq(document.userId, userId)))
      .limit(1);

    if (!doc) {
      throw new NotFoundException(`Document ${documentId} not found`);
    }

    // R2 ကနေ ဖျက်
    await this.s3.send(
      new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: doc.objectKey,
      }),
    );

    // DB ကနေ ဖျက်
    await this.db.delete(document).where(eq(document.id, documentId));

    return { id: documentId, deleted: true };
  }
}
