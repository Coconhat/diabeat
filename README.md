This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## FastAPI + Gemini Integration

This app is wired to:

- FastAPI ML endpoints:
  - `POST /predict/medical`
  - `POST /predict/lifestyle`
- Gemini insight endpoint through Next.js route (server-side):
  - `POST /api/gemini-insight`

The Gemini integration now uses the official Google GenAI SDK (`@google/genai`), aligned with Google AI Studio quickstart.

### 1. Configure environment variables

Create `.env.local` in the project root:

```bash
NEXT_PUBLIC_FASTAPI_URL=http://127.0.0.1:8000
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.5-flash
```

Notes:

- `NEXT_PUBLIC_FASTAPI_URL` is used by client-side form pages to call your FastAPI server.
- `GEMINI_API_KEY` is only used server-side by `src/app/api/gemini-insight/route.ts`.
- `GEMINI_MODEL` is optional (fallback models are attempted automatically).

Create your key in Google AI Studio:

- https://aistudio.google.com/app/apikey

After updating `.env.local`, restart the Next.js server.

### 2. Run your FastAPI backend

Make sure your Python service is running and CORS allows `http://localhost:3000`.

Example:

```bash
uvicorn main:app --reload --port 8000
```

### 3. Run this Next.js app

```bash
bun dev
```

Then open `http://localhost:3000`, complete either screening flow, and the app will:

1. Send inputs to FastAPI for risk prediction.
2. Save prediction result in session storage.
3. Render result page with real risk score and breakdown.
4. Request Gemini-generated explanation through `/api/gemini-insight`.
5. If Gemini is available, show 3 sections:

- Summary
- How to combat it (steps to lower risk)
- Suggestions

### Gemini troubleshooting (AI Studio)

If AI feedback is not showing from Gemini:

1. Confirm your API key exists in AI Studio and is active.
2. Confirm `.env.local` has `GEMINI_API_KEY` and restart `npm run dev`.
3. If your key is restricted, ensure it allows the Generative Language API.
4. Optionally set `GEMINI_MODEL` explicitly (example: `gemini-2.5-flash`).

### Important for non-medical flow

Current non-medical UI has fewer questions than your full FastAPI `LifestyleData` schema.
The app currently maps existing answers into the required fields using deterministic defaults for missing symptom fields.
For best model quality, extend the non-medical form to collect all required symptom/lifestyle flags directly.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
