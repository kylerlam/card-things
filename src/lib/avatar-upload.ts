import path from "node:path";

import sharp from "sharp";

export const maximumAvatarBytes = 2 * 1024 * 1024;
const maximumRequestBytes = maximumAvatarBytes + 64 * 1024;

export function avatarDirectory() {
  return path.resolve(process.env.UPLOAD_DIR || "uploads", "avatars");
}

export function isAvatarFilename(value: string) {
  return /^ct[a-z0-9]{12}-[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}\.png$/.test(value);
}

export async function readAvatarForm(request: Request) {
  if (!request.body || !request.headers.get("content-type")?.startsWith("multipart/form-data;")) {
    throw new Error("Invalid avatar request.");
  }
  const reader = request.body.getReader();
  const bytes = new Uint8Array(maximumRequestBytes);
  let length = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    length += value.byteLength;
    if (length > maximumRequestBytes) {
      await reader.cancel();
      throw new Error("Avatar upload is too large.");
    }
    bytes.set(value, length - value.byteLength);
  }
  return new Response(bytes.subarray(0, length), {
    headers: { "content-type": request.headers.get("content-type")! },
  }).formData();
}

export async function normalizeAvatar(file: File) {
  if (!file.size || file.size > maximumAvatarBytes || !["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
    throw new Error("Invalid avatar image.");
  }
  const input = Buffer.from(await file.arrayBuffer());
  const image = sharp(input, { limitInputPixels: 16_777_216, failOn: "warning" });
  const metadata = await image.metadata();
  if (!metadata.width || !metadata.height || metadata.width > 8192 || metadata.height > 8192 || !["png", "jpeg", "webp"].includes(metadata.format || "")) {
    throw new Error("Invalid avatar image.");
  }
  return image.rotate().resize(512, 512, { fit: "cover" }).png().toBuffer();
}
