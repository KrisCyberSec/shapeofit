# Stack Direction

Shape Of It is intended to become a real product, not just a static demo. The preferred long-term stack is:

- **App hosting:** Vercel
- **DNS and security edge:** Cloudflare
- **Framework:** Standard Next.js App Router route handlers
- **Production domain:** `https://shapeofit.app`
- **Vercel fallback domain:** `https://chartquery.vercel.app`

## Why This Direction

Vercel is the best default host for this codebase because the product is built on modern Next.js with App Router routes, API handlers, and Open Graph image generation. Keeping the app on Vercel minimizes framework adapter risk as the product adds accounts, payments, saved charts, and more server-side behavior.

Cloudflare should sit in front of the production domain for DNS and edge security. Cloudflare is the stronger platform for WAF rules, DDoS protection, rate limiting, bot controls, and Turnstile.

## Portability Rules

- Keep app logic in standard Next.js route handlers under `app/api`.
- Avoid Netlify-specific services for new product features.
- Avoid Vercel-only APIs unless they are clearly worth the lock-in.
- Use external product infrastructure for core data, auth, and payments when possible.
- Keep environment variables platform-neutral.

## Current Production State

- `shapeofit.app` is attached to the Vercel project.
- `www.shapeofit.app` is attached to the Vercel project.
- Cloudflare manages DNS for the domain.
- The Vercel project deploys from GitHub `main`.
- Cloudflare DNS currently points the apex and `www` records at Vercel.

## Security Edge Plan

1. Keep Cloudflare as DNS authority for `shapeofit.app`.
2. Enable Cloudflare proxy once the Vercel domain state remains healthy with the proxied records.
3. Set or update Vercel environment variables:
   - `NEXT_PUBLIC_SITE_URL`
   - `ANTHROPIC_API_KEY` when Claude generation should be live
4. Configure Cloudflare security rules:
   - Managed WAF rules
   - Rate limits for `/api/chart`, `/api/live/*`, and future auth endpoints
   - Turnstile for signup, login, and any high-cost AI generation flow
   - Bot protections that do not block normal search/social preview crawlers
5. Verify:
   - `/`
   - `/api/health`
   - `/api/chart`
   - `/opengraph-image`

## Product Infrastructure Phasing

Current MVP infrastructure:

- Vercel hosting
- Cloudflare DNS
- Standard Next.js route handlers
- Public live-data routes
- Local browser storage for history and notes

Planned product infrastructure:

- Cloudflare WAF, rate limiting, bot controls, and Turnstile
- Account-backed saved charts
- Payment-backed Pro tier
- Database persistence for history, collections, shared charts, and annotations
- Analytics for query/category demand
