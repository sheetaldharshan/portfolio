This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

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

## Showcase Browser Panel

The right-side browser panel is configured for showcase mode (project links and hosted previews), not unrestricted browsing.

- Client-side allow list env var: `NEXT_PUBLIC_BROWSER_PANEL_ALLOWED_HOSTS`
- Server-side proxy allow list env var: `BROWSER_PROXY_ALLOWED_HOSTS`

Both env vars accept comma-separated host patterns, for example:

```bash
NEXT_PUBLIC_BROWSER_PANEL_ALLOWED_HOSTS=*.yourdomain.com,preview.yourdomain.com
BROWSER_PROXY_ALLOWED_HOSTS=*.yourdomain.com,preview.yourdomain.com
```

Default allowed hosts are `hexoran.com` and `*.hexoran.com`.

## Site Assistant (Tawk-style)

A global floating assistant is now mounted across the site, with one exception:

- It is hidden only while the home page About section (`#about`) is visible.

### New routes

- Visitor widget: available globally via layout mount
- Operator inbox: `/admin/chat`
- API:
	- `POST /api/assistant/conversations`
	- `GET /api/assistant/conversations`
	- `PATCH /api/assistant/conversations`
	- `GET /api/assistant/messages`
	- `POST /api/assistant/messages`

### Required environment variables

```bash
# Existing
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
GROQ_API_KEY=...

# Required for secure operator actions
ASSISTANT_OPERATOR_KEY=your-strong-secret

# Recommended on server for elevated DB actions
SUPABASE_SERVICE_ROLE_KEY=...

# Required for push notifications
NEXT_PUBLIC_VAPID_PUBLIC_KEY=...
VAPID_PRIVATE_KEY=...
VAPID_SUBJECT=mailto:you@example.com

# Optional uploads config
ASSISTANT_ATTACHMENTS_BUCKET=assistant-attachments
ASSISTANT_MAX_FILE_BYTES=10485760

# Optional alert hooks (new visitor message alerts)
ASSISTANT_EMAIL_WEBHOOK_URL=https://your-email-webhook
ASSISTANT_WHATSAPP_WEBHOOK_URL=https://your-whatsapp-webhook

# Free Telegram alerts (recommended)
TELEGRAM_BOT_TOKEN=123456789:your_bot_token
TELEGRAM_CHAT_ID=123456789
```

### Database migration

Run the new migration in Supabase:

- `supabase/migrations/20260311_create_assistant_chat.sql`
- `supabase/migrations/20260311_assistant_push_subscriptions.sql`

It creates:

- `assistant_conversations`
- `assistant_messages`
- `assistant_push_subscriptions`

### Push notifications setup

Generate VAPID keys once:

```bash
npx web-push generate-vapid-keys
```

Use the generated keys in your env vars (`NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`).

### Storage setup for file/image sharing

Create a Supabase Storage bucket named `assistant-attachments` (or your value from `ASSISTANT_ATTACHMENTS_BUCKET`).

- For easiest MVP behavior, keep it public.
- If you want private storage, you can switch to signed URLs in the upload API.

### Operator mobile/web notifications

1. Open `/admin/chat`.
2. Paste and save your `ASSISTANT_OPERATOR_KEY`.
3. Click `Enable Push`.
4. Allow browser notification permission.

Now new visitor messages trigger push notifications, plus optional webhook alerts (email/WhatsApp).

### Message identities in chat

- AI replies: `SheetalDharshan Assistant`
- Human operator replies: `Sheetal Dharshan`
