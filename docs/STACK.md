# Stack Direction

ShapeOfIt is intended to become a real product, not just a static demo. The preferred long-term stack is:

- **App hosting:** Vercel
- **DNS and security edge:** Cloudflare
- **Framework:** Standard Next.js App Router route handlers
- **Current host:** Vercel at `https://chartquery.vercel.app`
- **Target production domain:** `shapeofit.app`

## Why This Direction

Vercel is the best default host for this codebase because the product is built on modern Next.js with App Router routes, API handlers, and Open Graph image generation. Keeping the app on Vercel minimizes framework adapter risk as the product adds accounts, payments, saved charts, and more server-side behavior.

Cloudflare should sit in front of the production domain for DNS and edge security. Cloudflare is the stronger platform for WAF rules, DDoS protection, rate limiting, bot controls, and Turnstile.

## Portability Rules

- Keep app logic in standard Next.js route handlers under `app/api`.
- Avoid Netlify-specific services for new product features.
- Avoid Vercel-only APIs unless they are clearly worth the lock-in.
- Use external product infrastructure for core data, auth, and payments when possible.
- Keep environment variables platform-neutral.

## Production Cutover Plan

1. Buy `shapeofit.app`.
2. Add `shapeofit.app` to the Vercel project and make it primary.
3. Manage the domain in Cloudflare DNS and point it to Vercel using Vercel's domain instructions.
4. Enable Cloudflare proxy once Vercel verifies the domain.
5. Set or update Vercel environment variables:
   - `NEXT_PUBLIC_SITE_URL`
   - `ANTHROPIC_API_KEY` when Claude generation should be live
6. Configure Cloudflare security rules:
   - Managed WAF rules
   - Rate limits for `/api/chart`, `/api/live/*`, and future auth endpoints
   - Turnstile for signup, login, and any high-cost AI generation flow
   - Bot protections that do not block normal search/social preview crawlers
7. Verify:
   - `/`
   - `/api/health`
   - `/api/chart`
   - `/opengraph-image`

## Current Repo State

The Vercel project is connected to GitHub and deploys from `main`. Until `shapeofit.app` is purchased and configured, the working production URL remains `https://chartquery.vercel.app`.
