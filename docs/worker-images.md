# Worker images

Workers can have an optional image stored in the configured Cloudflare R2
bucket. The database stores its public URL in `worker.image_url`; image files
are stored under `workers/<worker-id>/`.

Set `R2_PUBLIC_URL` to the public base URL for the bucket. Worker create and
update accept an optional multipart file field named `image`. JPEG, PNG, and
WebP images are allowed, up to 2 MB.

```bash
curl -X POST "http://localhost:3000/api/worker" \
  -H "Authorization: Bearer <token>" \
  -F "userId=<user-uuid>" \
  -F "managerId=<manager-uuid>" \
  -F "yearId=<year-uuid>" \
  -F "companyId=<company-uuid>" \
  -F "gender=MALE" \
  -F "image=@./worker.jpg;type=image/jpeg"
```

To replace a worker image, send the same `image` file field with
`PATCH /api/worker/<worker-uuid>`. The new image URL is returned with the worker
record. The replaced R2 image is deleted after the database update succeeds.
Deleting a worker also deletes its R2 image.

The image is optional. Create or update requests without an image do not change
the existing image. Worker responses include `imageUrl`; `GET /api/worker` and
`GET /api/worker/<worker-uuid>` can be used to retrieve it.
