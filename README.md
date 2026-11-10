# PassionSeed 🌱

A catch-up website for Thai high-school students who miss class for competitions.

1. **Plan an absence.** The student tells each subject teacher in advance and can ask for a +3 day extension.
2. **Get notes from a buddy.** A classmate uploads photos of the board while the student is away and earns volunteer hours for it.
3. **Catch up.** Claude summarizes the photos, and every subject's work goes into one checklist sorted by due date.

This is an MVP for a student-challenge demo, not production. There's no real auth: you pick a demo user on `/login`.

**Stack:** Next.js 16 (App Router) · TypeScript · Tailwind v4 · Prisma 7 (SQLite locally, Postgres/Neon in prod) · Vercel Blob · Anthropic API (`claude-sonnet-5-5`, vision).

---

## Run locally

Requires Node 22+.

```bash
npm install                 # also generates the Prisma client
cp .env.example .env.local  # then paste your ANTHROPIC_API_KEY
npm run db:push             # creates prisma/dev.db (SQLite)
npm run db:seed             # demo users, absence, tasks, one ready-made summary
npm run dev                 # http://localhost:3000
```

With `DATABASE_URL` left empty, the app uses a local SQLite file (`prisma/dev.db`). Uploaded photos go to `public/uploads/`.

Use `npm run db:reset` to wipe everything and re-seed. Seed dates are relative to today, so the demo always looks current.

### Environment variables (`.env.local`)

| Variable | Needed for | Notes |
|---|---|---|
| `ANTHROPIC_API_KEY` | AI summary | Without it, uploads still work: the note page shows the photos and a "not configured" message. |
| `DATABASE_URL` | Production | A `postgres://` / `postgresql://` URL (Neon). Leave empty for SQLite. |
| `BLOB_READ_WRITE_TOKEN` | Production | Vercel Blob token. Leave empty locally to use `public/uploads`. |

---

## Demo script (about 3 minutes)

| Who (switch at top right) | Do | Shows |
|---|---|---|
| **มายด์** (student) | หน้าหลัก | Current absence, teachers replied 3/4, status for each subject |
| มายด์ | ตามงาน | One combined checklist: ด่วน · พรุ่งนี้ / สัปดาห์นี้ / เสร็จแล้ว, plus "เลื่อนแล้ว +3 วัน" tags. Tick a task, or add one yourself. |
| มายด์ | บัดดี้ → คณิตศาสตร์ | A ready AI summary with a banner and a link to the original photo |
| **ต้นกล้า** (buddy) | Upload a photo of notes | AI summary appears in about 10–40 s; volunteer hours +0.5 |
| **ครูสมชาย** (teacher) | Reply to ภาษาอังกฤษ: worksheet, approve the extension | The student's checklist gets the task with the due date already moved +3 days |
| มายด์ | วางแผน | Plan a new absence. One request goes to each teacher. |

---

## Testing the AI summary with your own photo

The AI summary is the riskiest part, so you can test it on its own in two ways.

**1. From the command line (no app or database needed):**

```bash
npm run test:summary -- ~/Pictures/notes.jpg
npm run test:summary -- page1.jpg page2.jpg --subject ฟิสิกส์ --emphasis "ครูบอกว่าข้อนี้ออกสอบ"
```

This prints the validated JSON (`covered`, `keyTerms`, `questionsToAsk`, `confidence`) and how long the call took. It accepts JPG, PNG, WEBP and GIF up to 5 MB each. iPhone HEIC photos must be converted first, or uploaded through the app, which converts them in the browser.

**2. Through the app (same path as the demo):** switch to **ต้นกล้า**, go to บัดดี้, and upload 1–5 photos. The browser resizes them to about 1600 px JPEG before upload. The note page then runs the summary. You can re-run it with "สรุปใหม่อีกครั้ง".

Things worth trying: a clear whiteboard, messy handwriting, Thai mixed with English, a physics formula page, and one deliberately blurry photo. The blurry one should come back with `confidence: "low"` and questions instead of invented content.

The prompt lives in [src/lib/summarize.ts](src/lib/summarize.ts). Its main rule: only summarize what's visible, mark unsure readings with "(?)", and turn unreadable parts into questions.

---

## Deploy to Vercel

1. Push this repo to GitHub, then import it in Vercel. Or run `vercel link` from this folder.
2. **Database:** in the Vercel project, open Storage → add **Neon** (Marketplace). This sets `DATABASE_URL`.
3. **Photos:** Storage → create a **Blob** store with **public** access, connected to the project. This sets `BLOB_READ_WRITE_TOKEN`.
4. **AI:** add `ANTHROPIC_API_KEY` under Settings → Environment Variables.
5. Create the tables and the demo data in Neon once, from your machine:
   ```bash
   vercel env pull .env.production.local
   DATABASE_URL="<the Neon URL from that file>" npm run db:push
   DATABASE_URL="<the Neon URL from that file>" npm run db:seed
   node scripts/select-db.mjs   # switch the local schema back to SQLite
   ```
6. Deploy with `vercel --prod`, or push to `main`.

The build runs `scripts/select-db.mjs`. It sets the Prisma provider to `postgresql` when `DATABASE_URL` is a Postgres URL and to `sqlite` otherwise, then runs `prisma generate`. If you put a Neon URL in `.env.local`, your local `prisma/schema.prisma` switches too. That's expected; delete the URL and rerun `npm run db:select` to switch back.

---

## Project layout

```
prisma/schema.prisma      data model (strings for dates and enums so SQLite and Postgres both work)
prisma/seed.ts            demo data, relative to today
scripts/select-db.mjs     picks sqlite or postgresql
scripts/test-summary.ts   CLI test for the AI summary
src/lib/
  timetable.ts            hard-coded 5 subjects + fake teacher names
  summarize.ts            Claude vision call, prompt, JSON validation
  summary-schema.ts       zod schema for the summary JSON
  storage.ts              Vercel Blob or public/uploads
  prepare-file.ts         in-browser photo resize
  dates.ts                YYYY-MM-DD helpers in Asia/Bangkok time
  session.ts              demo "login" (cookie with a user id)
src/app/
  login/                  user switcher
  page.tsx                student dashboard
  tasks/                  checklist (ตามงาน)
  plan/                   plan absence (วางแผน)
  buddy/                  buddy upload, or notes received (student)
  notes/[id]/             AI summary + original photos
  teacher/                teacher replies
  actions/                server actions
```

### Decisions worth knowing

- **Dates** are stored as `YYYY-MM-DD` strings in Thailand time. That keeps "พรุ่งนี้" correct on a UTC server.
- **One teacher account** answers for all 5 subjects. Each subject still shows its own fake teacher name.
- **Checklist groups:** ด่วน · พรุ่งนี้ means overdue, today or tomorrow; สัปดาห์นี้ means within 7 days. A fourth group, หลังจากนั้น, only appears when something is due later than that.
- **The AI summary** runs when the note page first opens. A database "claim" stops two open tabs from both calling Claude. If the call fails, or the JSON doesn't match the schema, the page shows the error, the photos and a retry button.
- **Refusal fallback:** the Claude call sends `fallbacks: "default"` (beta `server-side-fallback-2026-07-01`). If a safety classifier declines a request, Anthropic retries it on a fallback model. For school notes this should almost never trigger. Remove those two lines in `summarize.ts` if you don't want it.
