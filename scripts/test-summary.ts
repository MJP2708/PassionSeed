// Test the AI summary on your own photos — no app/DB needed.
//   npm run test:summary -- path/to/photo1.jpg [photo2.jpg ...] [--subject ฟิสิกส์] [--emphasis "ครูเน้น..."]
import fs from "node:fs";
import path from "node:path";
import { config } from "dotenv";

config({ path: ".env.local", quiet: true });

const MIME: Record<string, string> = { ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp", ".gif": "image/gif" };
const MAX_BYTES = 5 * 1024 * 1024; // API limit per image

async function main() {
  const args = process.argv.slice(2);
  const flag = (name: string) => {
    const i = args.indexOf(name);
    if (i === -1) return undefined;
    const [, value] = args.splice(i, 2);
    return value;
  };
  const subjectName = flag("--subject");
  const emphasis = flag("--emphasis");
  const files = args;

  if (!files.length) {
    console.error('Usage: npm run test:summary -- photo.jpg [more.jpg] [--subject ฟิสิกส์] [--emphasis "..."]');
    process.exit(1);
  }

  const images = files.map((f) => {
    const mediaType = MIME[path.extname(f).toLowerCase()];
    if (!mediaType) throw new Error(`Unsupported file type: ${f} (use JPG/PNG/WEBP/GIF; convert HEIC first)`);
    const data = fs.readFileSync(f);
    if (data.length > MAX_BYTES) throw new Error(`${f} is ${(data.length / 1e6).toFixed(1)}MB — over the 5MB API limit. Resize it, or test through the app (it resizes automatically).`);
    return { data, mediaType };
  });

  const { summarizeNotes, SUMMARY_MODEL } = await import("../src/lib/summarize");
  console.log(`Sending ${images.length} photo(s) to ${SUMMARY_MODEL}…`);
  const started = Date.now();
  const result = await summarizeNotes({ images, subjectName, emphasis });
  console.log(`Done in ${((Date.now() - started) / 1000).toFixed(1)}s\n`);
  if (result.ok) console.log(JSON.stringify(result.summary, null, 2));
  else {
    console.error("ERROR:", result.error);
    process.exit(1);
  }
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
