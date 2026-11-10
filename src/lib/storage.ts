import "server-only";
import { randomUUID } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { put } from "@vercel/blob";

export const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"] as const;
export type ImageType = (typeof IMAGE_TYPES)[number];

const EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "application/pdf": "pdf",
};

/** Saves a file to Vercel Blob (if configured) or public/uploads (local dev). Returns a URL. */
export async function saveUpload(file: File, folder: string): Promise<string> {
  const ext = EXT[file.type] ?? "bin";
  const name = `${folder}/${randomUUID()}.${ext}`;

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const blob = await put(name, file, { access: "public", contentType: file.type });
    return blob.url;
  }
  if (process.env.VERCEL) {
    throw new Error("ยังไม่ได้ตั้งค่า BLOB_READ_WRITE_TOKEN บน Vercel จึงอัปโหลดไฟล์ไม่ได้");
  }
  const dest = path.join(process.cwd(), "public", "uploads", name);
  await fs.mkdir(path.dirname(dest), { recursive: true });
  await fs.writeFile(dest, Buffer.from(await file.arrayBuffer()));
  return `/uploads/${name}`;
}

/** Loads an image back (for AI summary retries). Local paths are read from /public. */
export async function loadImage(url: string): Promise<{ data: Buffer; mediaType: string }> {
  if (url.startsWith("/")) {
    const file = path.join(process.cwd(), "public", path.normalize(url).replace(/^([/\\])+/, ""));
    const ext = path.extname(file).slice(1).toLowerCase();
    const mediaType = Object.entries(EXT).find(([, e]) => e === ext)?.[0] ?? (ext === "svg" ? "image/svg+xml" : "application/octet-stream");
    return { data: await fs.readFile(file), mediaType };
  }
  const res = await fetch(url);
  if (!res.ok) throw new Error(`โหลดรูปไม่ได้ (${res.status})`);
  return {
    data: Buffer.from(await res.arrayBuffer()),
    mediaType: res.headers.get("content-type")?.split(";")[0] ?? "application/octet-stream",
  };
}
