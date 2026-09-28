# Theodoros Karagiannis — contact API

Separate deployable Node/Azure Functions project, adapted from the Atlas ACL
architecture. Source reference: `nkomp18/atlasacl-backend`, commit
`3d98fa5b862196131b50dced07655ced0c120da9`.

## Email architecture

The inspected Atlas code verifies Google reCAPTCHA v3 and sends through **EmailJS**.
It does not contain a direct Zoho API or OAuth implementation. If the client's
Zoho mailbox is supported/configured as an EmailJS email service, the same pattern
can be used. Confirm this with the final account details. Direct Zoho OAuth is a
separate integration choice and has not been implemented or tested here.

No production email is sent without complete environment configuration.

## Develop and test

Node 22 or later, pnpm 11.19.0:

```sh
pnpm install --frozen-lockfile
pnpm check
pnpm test
pnpm start
```

The local server listens on `127.0.0.1:7071`. `GET /api/health` checks liveness;
`POST /api/contact` accepts JSON `{name,email,message,consent,lang,website,captchaToken}`.
`website` is an empty honeypot. Responses have `{ok,code}`. Tests mock the providers
and never use live email/CAPTCHA credentials.

Set the values in `.env.example` as process environment variables or Azure
application settings. A local `.env` can be loaded with
`node --env-file=.env src/server.mjs`. Secrets stay in the backend host. The
frontend only receives the public site key and API URL.

## Before enabling production

1. Create the client's own Azure Function App (Node 22) and its required Azure
   storage/resources; confirm the hosting cost with the client.
2. Register reCAPTCHA v3 for the real hostnames, including any staging hostname
   used for end-to-end tests. Add origins with exact scheme and host, no paths.
3. Set all environment values. Configure EmailJS's template with a fixed recipient,
   sender owned by the client, and the visitor's email only as Reply-To. Use escaped
   text fields for name, email and message, never unescaped HTML interpolation.
4. Configure an upstream shared rate limit (for example in the selected gateway).
   The included 5-request/minute limit is per process and is not shared across
   Azure instances. The Azure adapter uses `x-azure-clientip`; configure the trusted
   gateway to overwrite that header and block direct bypass of the gateway. With
   no header, requests share an `unknown` bucket. Do not trust client-supplied IPs.
5. Configure CORS consistently with `ALLOWED_ORIGINS`. No wildcard origin is used.
6. Run real CAPTCHA + email delivery tests, including the spam folder and Reply-To.
   Finalize the website privacy notice for the actual provider arrangement.

## CI/CD

This project lives in `backend/` within `tkaragiannis8/website`. Its workflow is
`../.github/workflows/api.yml` and tests PRs and main pushes independently of the
frontend. Run the development commands above from this directory. Deployment stays disabled unless
`API_DEPLOY_ENABLED=true`. Configure Azure OIDC federation for this repository's
`production` environment and the Azure role needed to deploy this one Function App.
Set GitHub secrets `AZURE_CLIENT_ID`, `AZURE_TENANT_ID`,
`AZURE_SUBSCRIPTION_ID` and variable `AZURE_FUNCTIONAPP_NAME`.

The `.npmrc` uses a hoisted dependency layout for portable Azure deployment.
No resources, repositories, federation rules, or production secrets have been created.

## Protections and limitations

Input limits, explicit origins, consent validation, a honeypot, per-process limits,
single-use token tracking, CAPTCHA action/score/hostname/freshness validation,
provider timeouts, and generic errors are implemented. Mail content and credentials
are not logged. CAPTCHA replay protection also depends on Google's verification.
Delivery errors never become success responses. Real service delivery and Azure
hosting remain unverified until the client provides configuration.
