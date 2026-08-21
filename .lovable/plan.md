# Fix: "Unauthorized: Invalid token" on the deployed site

## What is happening

The screenshot is your own Cloudflare deploy (`earthonlinebd.earthonlinebd2026.workers.dev`), not the Lovable-published site. Login works (the sidebar shows `manager@gmail.com`), so the browser side has the correct backend keys. The failure comes from the server side: every admin data call is validated on the server, and the server rejects the login token as invalid.

That happens when the server-side backend settings in the Cloudflare Worker do not match the backend the frontend logged into — typically leftover values from the previous backend project (the project was switched to the new one recently), or values that were never added to the Worker at all.

Note: the code itself is fine — the same flow works in preview, where the platform injects the server-side values automatically.

## Recommended fix (simplest, no maintenance)

Publish through Lovable instead of the hand-rolled Worker. Lovable's hosting injects all server-side backend values on every deploy, so this class of error cannot happen. The `.lovable.app` URL (and any custom domain you attach) then serves the same app.

## If you want to keep your own Cloudflare Worker

Then the Worker needs these three server-side variables set to exactly the same backend project the frontend is built against:

- `SUPABASE_URL`
- `SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_PROJECT_ID`

Steps:
1. Read the current values from the project's `.env` in this workspace (they are the correct, current backend values).
2. In the Cloudflare dashboard, open the Worker → Settings → Variables, and set/overwrite the three names above with those values (delete any old ones from the previous backend project).
3. Also confirm the frontend build variables (`VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`) used at build time are from the same project — a mismatch between the browser and server sides produces exactly this "Invalid token" message.
4. Redeploy the Worker and hard-refresh, then log out and log in once so a fresh token is issued.

If cron endpoints are also used from that deployment, `CRON_SECRET` and the service-role value must be present in the Worker too; those are separate from this login problem.

## What I will change in code

Nothing is required in the app code for this fix — it is a deployment configuration issue. If you prefer, I can additionally make the admin screen show a clearer message ("server backend configuration mismatch") instead of the raw `Unauthorized: Invalid token`, so future misconfiguration is obvious at a glance.
