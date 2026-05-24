# Stack Direction

ChartQuery is intended to become a real product, not just a static demo. The preferred long-term stack is:

- **App hosting:** Vercel
- **DNS and security edge:** Cloudflare
- **Framework:** Standard Next.js App Router route handlers
- **Current host:** Vercel at `https://chartquery.vercel.app`

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

1. Connect the Vercel project to `KrisCyberSec/chartquery` for automatic deployments after the Vercel account has a GitHub login connection.
2. Set Vercel build command to `npm run build`.
3. Set or update Vercel environment variables:
   - `NEXT_PUBLIC_SITE_URL`
   - `ANTHROPIC_API_KEY` when Claude generation should be live
4. Add the production domain to Vercel.
5. Manage the domain in Cloudflare DNS and point it to Vercel using Vercel's domain instructions.
6. Enable Cloudflare proxy once Vercel verifies the domain.
7. Configure Cloudflare security rules:
   - Managed WAF rules
   - Rate limits for `/api/chart`, `/api/live/*`, and future auth endpoints
   - Turnstile for signup, login, and any high-cost AI generation flow
   - Bot protections that do not block normal search/social preview crawlers
8. Verify:
   - `/`
   - `/api/health`
   - `/api/chart`
   - `/opengraph-image`

## Current Repo State

The Vercel project is deployed manually from this repo. GitHub auto-linking still needs the Vercel account to add a GitHub login connection before every push can deploy automatically.
