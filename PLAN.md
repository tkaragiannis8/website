# Website delivery plan

## Agreed direction

Create a modern, professional, static legal website for Theodoros Karagiannis,
using EllinLegal's slate-blue, burgundy, gray and white palette and existing
English, Greek and Russian page copy. Prioritize services, office address and
contact details. The POC is a reference, not a layout to reproduce. Display
Theodoros Karagiannis in Latin characters in the Russian version too.

The client owns `tkaragiannis8/website`, containing both the Astro frontend and
the independently deployable `backend/` contact API. No Umbraco or .NET hosting
is required. Immediate preview target: https://tkaragiannis8.github.io/website/.
GitHub Actions builds, tests and deploys the frontend on main pushes. Backend
tests run separately; backend deployment remains opt-in until configured.

## Implemented locally

- Seven legacy pages in each language, shared layout and page-preserving flags.
- Responsive contemporary layout, locally hosted fonts and original images.
- Static metadata, language alternates, sitemap, robots, 404 and privacy notice.
- Click-to-load map/video embeds and prominent phone, email and office address.
- Contact form disabled visibly until public API URL and CAPTCHA key exist.
- Azure Functions-compatible API with validation, origin allowlist, CAPTCHA v3
  verification, replay checks, honeypot, bounded process-local rate limits,
  provider timeouts and mocked provider tests.
- Atlas-inspired EmailJS integration. Atlas does not implement direct Zoho
  OAuth; determine whether the client's Zoho mailbox can use the EmailJS service
  or requires a different adapter when the account details are supplied.
- Frontend and backend CI workflows and a client-owned deployment path.

## Before production launch

1. Publish and verify the GitHub Pages preview, including all language routes.
2. Client reviews copy, contact address/email, legacy claims and asset rights.
3. Confirm backend hosting and cost, configure client-owned Azure resources and
   OIDC deployment, and set runtime secrets outside the repository.
4. Supply reCAPTCHA and email configuration; test actual delivery and failures.
   Configure shared gateway rate limiting and trusted client-IP handling.
5. Finalize privacy wording for the actual providers and retention policy.
6. Launch at `theodoroskaragiannis.com` and `theodoroskaragiannis.gr` with HTTPS.
   The provisional canonical is .com; confirm with the client. Redirect the
   secondary domain preserving paths and query strings through an HTTPS-capable
   redirect service. Update SITE_URL and BASE_PATH=/ for the custom domain.
7. Verify DNS, redirects, HTTPS and rollback. No DNS changes are made now.
8. Remove temporary personal-account access when no longer needed; keep client
   ownership and verify independent deployments and secret rotation.

## Verification

Frontend checks cover 21 original locale/page combinations, language switching,
preserved service/publication copy, internal links/assets and the unconfigured
form. Backend tests mock CAPTCHA and mail, covering rejection and success paths.
Desktop/mobile previews, map loading and language-preserving navigation were
checked locally. Live email and final-domain behavior remain pending configuration.
