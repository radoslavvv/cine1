# Authentication design

Design confirmed by the user and implemented. Authentication uses the existing React and ASP.NET Core application with PostgreSQL-backed ASP.NET Core Identity.

## Agreed scope

- Support customer accounts and administrator sign-in.
- Support one administrator for now.
- Preserve guest checkout; customer registration is optional.
- Customers sign in with email and password.
- Signed-in customers have a My bookings page containing their bookings and tickets.
- Provision the single administrator through a setup command with credentials supplied when it runs. Public registration creates customers only.
- Implement and verify this increment locally; deployment setup is deferred.
- Replace the Development-only administration gates with administrator authorization in every environment.
- Require email verification before customer sign-in and support forgotten-password reset through emailed links. Deliver these messages to a local development inbox for this increment.
- My bookings contains only bookings made while signed in. Do not automatically associate bookings by matching email, and defer claiming guest bookings.
- Signed-in checkout uses the account's verified email; guest checkout continues to accept a contact email.
- Preserve private confirmation and ticket links without requiring sign-in, including links for account-owned bookings. My bookings requires sign-in and account ownership checks.
- Use a browser-session cookie with an eight-hour maximum, without Remember me. Provide sign-out and temporary lockouts after repeated failed sign-in attempts.
- The administrator retains all existing management permissions and can also book tickets as a customer. Additional staff roles are deferred.
- Defer profile editing, email changes, an account-settings password-change screen, and account deletion. Password recovery remains available. Include resending verification emails.
- Allow sign-in from checkout and return with the seat selection preserved. If the session expires, require the customer to choose sign-in or guest checkout explicitly. Recheck seat availability before confirmation; a selection does not reserve seats.
- On subsequent runs, the setup command leaves the existing administrator unchanged and refuses to create a second administrator. Require administrator email verification before first sign-in and support the same email-based password recovery. Do not provide a built-in default password.

## Technical baseline

- Follow the roadmap's ASP.NET Core Identity and cookie-authentication approach, backed by PostgreSQL.
- Apply CSRF protection to browser-authenticated state changes, server-side administrator authorization, and ownership checks for My bookings.
- Public registration cannot grant administrator privileges. Derive booking ownership from the authenticated customer rather than client-supplied ownership fields.
- Keep existing private-link access compatible with guest and account-owned bookings.

## Behavior before this increment

- The roadmap proposes ASP.NET Core Identity, secure cookie authentication, CSRF protection, and customer/admin authorization. Details remain to be confirmed during this interview.
- Administration had no authentication and was available only in Development, with gates in both the API and frontend.
- Bookings had a contact email and private confirmation link, but no customer account owner. Customer booking history did not exist.
- The project currently targets a local Docker learning environment; application hosting is not configured.

## Local setup

Run `docker compose up -d --wait` to start PostgreSQL and Mailpit. Start the API and frontend using the README commands, or use `./start.ps1`. The startup script preserves its chosen frontend port in account email links. Open [the inbox](http://localhost:8025) to read verification and password-reset emails; messages stay local. Booking confirmation emails remain deferred.

The launcher checks both session and schedule requests through the frontend proxy before reporting ready. To check an already-running app, run `node scripts/check-running-app.mjs http://localhost:5173`. After backend changes, restart the API process; Vite updates frontend code only. A session 404 alongside schedule failures can indicate an old backend process, especially one launched from the former `src/backend/bin` path rather than the current `src/backend/Cinema.Api` project.

Account forms use the same cinema header as the schedule and booking pages, plus the cinema footer. Registration labels its credential field Password; New password is reserved for password reset. Verification resend is offered after registration, on email-verification pages, or after a failed sign-in. A service failure leaves account navigation available and shows a separate message with a visibly pending retry button.

Register at `/account/register`, open the verification link from Mailpit, click Verify email, and sign in. My bookings is available at `/account/bookings`. Registration, verification resend, forgotten-password requests, verification, reset, and sign-in share a per-IP limit of ten requests per minute. Five failed password attempts lock an account for fifteen minutes. Passwords require 12–128 characters with uppercase, lowercase, a digit, and a symbol. Verification and reset links expire after one hour; a successful password reset invalidates existing sessions.

Create the real administrator yourself, choosing its email and password when prompted:

```powershell
dotnet run --project src/backend/Cinema.Api --no-launch-profile -- setup-admin --environment Development
```

The command hides typed passwords. It does not promote an existing customer or change an existing administrator. If email delivery fails after creation, use Resend verification. A second run reports that an administrator already exists without changing credentials. A PostgreSQL advisory lock and filtered unique index prevent concurrent commands from creating multiple administrators. Verify the email before signing in to `/admin`. No administrator password is bundled with the app.

`Identity:FrontendOrigin` is the trusted origin used in email links (default Development value: `http://localhost:5173`). Override it when using another frontend port. Mailpit listens on loopback SMTP port 1025 and web port 8025. Sessions are HttpOnly, SameSite Strict browser cookies with an absolute eight-hour maximum. Non-Development cookies require HTTPS. The browser gets a CSRF request token from `/api/account/session` and includes it in `X-CSRF-Token` for every write, including guest booking and anonymous account requests.

## Architecture and compatibility

Identity tables belong to the `identity` schema. `booking.bookings.customer_id` is nullable and references Identity users; the migration leaves existing guest bookings ownerless. Ownership always comes from the authenticated principal. `expectedCustomerId` in checkout is only a session-consistency guard: it never grants ownership. Replaying a booking request requires the original owner as well as matching seats, screening, and email.

My bookings uses a server-filtered query with 20 bookings per page. Customer changes clear cached booking history, administration results, and confirmations. Tabs announce sign-in/out changes, and focus plus a periodic check refresh session state. A changed session blocks checkout until the customer explicitly chooses how to continue. An uncertain confirmation retains its original request and owner so authentication changes cannot silently start another attempt. Seat selections survive the sign-in round trip in tab-scoped storage for up to two hours; these selections do not reserve seats.

Account endpoints use application service interfaces; Identity, EF, email delivery, and credential management stay in Infrastructure. Identity supplies password hashing, security stamps, lockouts, and email tokens. Authentication uses cookies rather than bearer tokens stored in browser storage. Frontend route guards provide navigation behavior; the API enforces administrator permissions and booking ownership independently.

Deployment remains outside this increment. Before deploying, configure a trusted HTTPS frontend origin, real SMTP settings (`Email:SmtpHost`, `SmtpPort`, `From`, and optionally `Username`/`Password`), durable ASP.NET Data Protection keys, same-origin API routing, and explicit migrations. SMTP uses TLS outside Development. The setup command must run under the same application identity/key configuration as the server so emailed tokens can be verified.

## Verification

Fast checks:

```powershell
dotnet test Cinema.slnx --no-restore
npm test --prefix src/frontend -- --configLoader runner
npm run test:legacy --prefix src/frontend
npm run build --prefix src/frontend -- --configLoader runner
```

The HTTP tests use isolated in-memory Data Protection keys and never connect to the developer database. The live verification script exercises real PostgreSQL, Identity cookies, Mailpit, account verification, the single-administrator setup command, existing administration regressions, guest and account booking boundaries, private ticket links/QR, reset-token reuse, session invalidation, and failed-login lockout. It intentionally waits when exercising the account rate limit.

To run it against a fresh disposable database, start Mailpit and PostgreSQL, create `cinemar_auth_verification`, and run a separate API terminal:

```powershell
docker compose exec postgres createdb -U cinemar cinemar_auth_verification
$env:ConnectionStrings__Cinema = 'Host=127.0.0.1;Port=5433;Database=cinemar_auth_verification;Username=cinemar;Password=cinemar_local'
dotnet run --project src/backend/Cinema.Api --no-launch-profile -- --environment Development --urls http://127.0.0.1:5081
```

In another terminal:

```powershell
$env:AUTH_TEST_CONNECTION = 'Host=127.0.0.1;Port=5433;Database=cinemar_auth_verification;Username=cinemar;Password=cinemar_local'
node scripts/check-auth-flow.mjs
```

The script requires a fresh disposable database, creates a random test administrator and customers, and never prints their credentials. It does not provision the administrator in the developer's normal `cinemar` database. After stopping the test API, remove only this disposable database with `docker compose exec postgres dropdb -U cinemar cinemar_auth_verification`. Do not reuse it for another run: the single administrator is intentionally immutable through setup.
