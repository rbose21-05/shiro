# CampusSync

AI-powered calendar for college students. Drop a syllabus screenshot or paste a group chat — CampusSync extracts events, you review them, then they land on a week/month calendar. Optional two-way Google Calendar sync.

## Quick start

```bash
npm install
cp .env.local.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The home screen is a year wall of month cards. Click a month to open that calendar. You can use the app as a guest (events stay in this browser) until you add keys.

## Environment variables

Copy `.env.local.example` and fill in what you have. The app degrades gracefully: missing AI keys use a simple heuristic parser; missing Supabase uses local storage; missing Google OAuth hides live sync.

| Variable | Where to get it |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` | [Supabase](https://supabase.com) → Project Settings → API |
| `GEMINI_API_KEY` | [Google AI Studio](https://aistudio.google.com/apikey). Model default: `gemini-3.5-flash` |
| `GROQ_API_KEY` | [Groq Console](https://console.groq.com/keys). Model default: `openai/gpt-oss-120b` |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | [Google Cloud Console](https://console.cloud.google.com/apis/credentials) OAuth client (Web) |
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` locally, your Vercel URL in production |

### Supabase setup

1. Create a project.
2. Auth → Providers: enable Email and Google (for app login).
3. SQL Editor: paste and run [`supabase/migrations/001_init.sql`](supabase/migrations/001_init.sql).
4. Confirm Storage bucket `screenshots` exists (the migration creates it).
5. Site URL / redirect URLs: `{APP_URL}/auth/callback`.

### Google Calendar OAuth (separate from login)

1. Enable **Google Calendar API**.
2. OAuth client type **Web application**.
3. Authorized redirect URI: `{APP_URL}/api/google/callback`.
4. In the app: Settings → Connect Google Calendar → pick which calendar to sync into.

CampusSync login can use Google via Supabase. Calendar access is a second connect so refresh tokens are stored on your `profiles` row.

## How the AI layer works

All extraction goes through [`lib/ai/extractEvents.ts`](lib/ai/extractEvents.ts):

- Images → Gemini vision (`gemini-3.5-flash`)
- Text → Gemini, then Groq (`openai/gpt-oss-120b`) if Gemini fails
- No keys → heuristic parser so the review UI still works

Chat lives in [`lib/ai/chat.ts`](lib/ai/chat.ts) and always returns a proposed mutation for confirmation — nothing is written until you tap **Add**.

## Deploy on Vercel

1. Push the repo and import in Vercel.
2. Add the same env vars.
3. Set `NEXT_PUBLIC_APP_URL` to the production URL.
4. Update Google/Supabase redirect URLs.

## Scripts

- `npm run dev` — local dev (Turbopack)
- `npm run build` — production build
- `npm run start` — serve the build
