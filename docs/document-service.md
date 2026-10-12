# Document Service လမ်းညွှန်

ဒီလမ်းညွှန်မှာ worker စာရွက်စာတမ်းတွေကို Cloudflare R2 မှာသိမ်းပြီး database နဲ့ချိတ်ဆက်အသုံးပြုပုံကို ရှင်းပြထားပါတယ်။

## `UploadService` ကို ဘာကြောင့် တိုက်ရိုက်မသုံးတာလဲ

`UploadService` က ဖိုင်ကို R2 သို့တင်ခြင်း၊ user image အတွက် public URL ပြုလုပ်ခြင်းတို့လို အထွေထွေ upload အလုပ်များအတွက်ဖြစ်ပါတယ်။ သို့သော် document တစ်ခုကို worker တစ်ယောက်နဲ့ချိတ်ဆက်မှတ်တမ်းတင်ခြင်း၊ database ထဲက metadata ထည့်ခြင်း၊ worker တစ်ယောက်အတွက် အများဆုံး document ၁၀ ခုကို စစ်ဆေးခြင်းနဲ့ လုံခြုံတဲ့ download URL ထုတ်ပေးခြင်းတွေကို အဲဒီ service တစ်ခုတည်းက မလုပ်ပေးပါ။

ဒါကြောင့် `DocumentService` က document အတွက်လိုအပ်တဲ့ အလုပ်စဉ်တစ်ခုလုံးကို ကိုင်တွယ်ပါတယ်။

1. Worker ရှိ/မရှိ စစ်ဆေးပါတယ်။
2. Worker အတွက် document အရေအတွက်ကို စစ်ဆေးပါတယ်။
3. ဖိုင်ကို R2 သို့တင်ပြီး object key နဲ့ metadata ကို database မှာသိမ်းပါတယ်။
4. Download လုပ်ဖို့ သက်တမ်း ၁၅ မိနစ်ရှိတဲ့ presigned URL ထုတ်ပေးပါတယ်။
5. ဖျက်ရာမှာ R2 object နဲ့ database record ကိုဖျက်ပါတယ်။

လက်ရှိ code မှာ `DocumentService` က R2 client ကို ကိုယ်တိုင်ဖန်တီးထားပါတယ်။ ထို့ကြောင့် `UploadService` နဲ့ R2 configuration အပိုင်း ထပ်နေပါတယ်။ နောက်ပိုင်းမှာ အများသုံး R2 helper တစ်ခုသို့ ပြောင်းလဲနိုင်ပေမယ့် document အတွက် worker/database စစ်ဆေးမှုနဲ့ access behavior တွေကိုတော့ `DocumentService` မှာ ဆက်ထားရပါမယ်။

## R2 environment configuration

Project ရဲ့ `.env` ဖိုင်မှာ အောက်ပါ variable များကို ကိုယ့် Cloudflare R2 အချက်အလက်နဲ့ သတ်မှတ်ပါ။ Secret တန်ဖိုးများကို source code သို့မဟုတ် Git ထဲ မထည့်ပါနှင့်။

```dotenv
R2_ACCOUNT_ID=<cloudflare-account-id>
R2_ENDPOINT=https://<cloudflare-account-id>.r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=<r2-access-key-id>
R2_SECRET_ACCESS_KEY=<r2-secret-access-key>
R2_BUCKET_NAME=<r2-bucket-name>
```

`DocumentService` က `R2_ENDPOINT`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY` နဲ့ `R2_BUCKET_NAME` ကို ဖတ်ပါတယ်။ `R2_ACCOUNT_ID` က endpoint တည်ဆောက်ရာမှာ အသုံးဝင်ပါတယ်။ Document download အတွက် public bucket မလိုပါ၊ အချိန်ကန့်သတ်ထားတဲ့ presigned URL ကို အသုံးပြုပါတယ်။

## Upload လုပ်ခြင်း

Upload API သည် Admin role လိုအပ်ပြီး `multipart/form-data` ဖြင့် `files`, ဖိုင်တစ်ခုစီအတွက် `documentTypes` တန်ဖိုးတစ်ခုစီ၊ `workerId` တို့ကို လက်ခံပါတယ်။ `documentTypes` များ၏အစီအစဉ်သည် `files` များ၏အစီအစဉ်နှင့် ကိုက်ညီရပါမယ်။ တစ်ကြိမ်တည်းမှာ ၂ ဖိုင်တင်ရင် ၂ ခုသော type ပို့ရုံပါ။ PDF, JPEG, PNG, WEBP ကိုသာ လက်ခံပြီး ဖိုင်တစ်ဖိုင်လျှင် 20 MB အများဆုံးဖြစ်ပါတယ်။ Worker တစ်ယောက်တွင် document စုစုပေါင်း ၁၀ ခုထက် မကျော်ရပါ။

ခွင့်ပြုထားသော `documentTypes` နဲ့ Frontend မှာပြမည့်အမည်များမှာ `PAYMENT_SLIP_100` (ငွေချေစာရွက် 100), `PAYMENT_SLIP_900` (ငွေချေစာရွက် 900), `PAW_TAW_50` (ပေါတော 50), `BLOOD_TEST_CERTIFICATE` (သွေးစစ်လက်မှတ်), `PA_KAN_DOCUMENT` (ပကန်းစာရွက်), `BINU_MAT_DOCUMENT` (ဘိုင်နုမတ်စာရွက်), `WORK_PERMIT_DOCUMENT` (ဝေါ့ပါမစ်စာရွက်), `NEW_WORKER_QR_APPOINTMENT` (QR ရက်ချိန်းစာရွက် လူသစ်) တို့ဖြစ်ပါတယ်။ API က ဒီရှစ်မျိုးကိုသာ အသစ်တင်ခွင့်ပြုပါတယ်။ အမျိုးအစားအဟောင်းကို မသိနိုင်တဲ့ စာရွက်စာတမ်းများ၏ အချက်အလက်မပျောက်စေရန် database enum ထဲမှာ `OTHER` ကိုလည်း ထိန်းထားပါတယ်။ အသစ်တင်ရာမှာ `OTHER` ကို ရွေးခွင့်မရှိပါ။ Frontend project က ဒီ repository ထဲမှာ မပါဝင်တဲ့အတွက် dropdown ကို frontend မှာ enum key နဲ့ မြန်မာအမည်ကို တွဲပြပါ။

```bash
curl -X POST "http://localhost:3000/api/documents/upload" \
  -H "Authorization: Bearer <admin-jwt>" \
  -F "workerId=<worker-uuid>" \
  -F "documentTypes=PAYMENT_SLIP_100" \
  -F "files=@./passport.pdf;type=application/pdf" \
  -F "documentTypes=NEW_WORKER_QR_APPOINTMENT" \
  -F "files=@./photo.jpg;type=image/jpeg"
```

တင်ထားသောဖိုင်၏ မူရင်းနာမည်ကို `originalName`၊ ရွေးထားသောအမျိုးအစားကို `documentType` အဖြစ် သီးခြားသိမ်းပါတယ်။ တစ်ဖိုင်ချင်းစီအတွက် type တစ်ခု မဖြစ်မနေပို့ရပြီး သတ်မှတ်ထားသော enum ရှစ်မျိုးထဲမှ တစ်မျိုးဖြစ်ရပါမယ်။

## Service ထဲတွင် R2 client ဖန်တီးပုံ

Environment variable တစ်ခုခု မရှိပါက `getOrThrow` က error ပေးပြီး စတင်မှု/အသုံးပြုမှုကို အောင်မြင်သကဲ့သို့ တိတ်တဆိတ် ဆက်မလုပ်ပါ။ `region: 'auto'` နှင့် R2 endpoint ကို သုံးပြီး AWS S3-compatible API မှတစ်ဆင့် ဆက်သွယ်ပါတယ်။

```ts
this.bucket = this.config.getOrThrow<string>('R2_BUCKET_NAME');
this.s3 = new S3Client({
  region: 'auto',
  endpoint: this.config.getOrThrow<string>('R2_ENDPOINT'),
  credentials: {
    accessKeyId: this.config.getOrThrow<string>('R2_ACCESS_KEY_ID'),
    secretAccessKey: this.config.getOrThrow<string>('R2_SECRET_ACCESS_KEY'),
  },
});
```

## `DocumentService` ရဲ့ upload အလုပ်စဉ်

Controller က file type, file size နဲ့ Admin role ကို စစ်ပြီးနောက် `uploadDocuments` ကို ခေါ်ပါတယ်။ Service က worker နဲ့ limit ကိုစစ်ကာ UUID ပါတဲ့ object key တစ်ခုစီဖြင့် ဖိုင်များကို R2 သို့တင်ပါတယ်။ ထို့နောက် object key၊ document type၊ မူရင်းဖိုင်အမည်၊ MIME type၊ size စတာတွေကို database ထဲ batch insert လုပ်ပါတယ်။

```ts
const key = `documents/${workerId}/${randomUUID()}${ext}`;

await this.s3.send(
  new PutObjectCommand({
    Bucket: this.bucket,
    Key: key,
    Body: file.buffer,
    ContentType: file.mimetype,
  }),
);
```

## စာရင်းကြည့်ခြင်း၊ download URL ရယူခြင်း၊ ဖျက်ခြင်း

အောက်ပါ ဥပမာမှာ worker ရဲ့ document စာရင်းကြည့်ခြင်း၊ download URL ရယူခြင်းနဲ့ Admin အဖြစ် document ဖျက်ခြင်းတို့ ပါဝင်ပါတယ်။ `GET` လုပ်ဆောင်ချက်တွေမှာ authentication နှင့် သတ်မှတ်ထားတဲ့ role လိုအပ်ပါတယ်။ Download URL သက်တမ်း ၉၀၀ စက္ကန့် (၁၅ မိနစ်) ဖြစ်ပါတယ်။

```bash
curl -H "Authorization: Bearer <jwt>" \
  "http://localhost:3000/api/documents/worker/<worker-uuid>"

curl -H "Authorization: Bearer <jwt>" \
  "http://localhost:3000/api/documents/<document-uuid>/download"

curl -X DELETE -H "Authorization: Bearer <admin-jwt>" \
  "http://localhost:3000/api/documents/<document-uuid>"
```

## အဓိက code ဖိုင်များ

- [DocumentController](../src/modules/document/document.controller.ts) — route, role, file type နဲ့ file size ကန့်သတ်ချက်များ။
- [DocumentService](../src/modules/document/providers/document.service.ts) — worker စစ်ဆေးမှု၊ R2 upload/download/delete နဲ့ database metadata။
- [UploadDocumentsDto](../src/modules/document/dto/upload-documents.dto.ts) — `workerId` ကို UUID ဖြစ်ကြောင်း စစ်ဆေးခြင်း။
- [DocumentModule](../src/modules/document/document.module.ts) — controller နဲ့ service ကို NestJS module အဖြစ် ချိတ်ဆက်ခြင်း။
