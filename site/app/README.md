# Storyloom web app setup

This folder is the actual reader and publisher web application. It uses a Supabase Postgres database and Supabase Auth. The app remains in setup mode until `config.js` has the public project URL and public publishable/anon key.

## Create the free backend

1. Create a project in [Supabase](https://supabase.com/dashboard).
2. In the SQL Editor, run [`../../supabase/migrations/20260912000000_storyloom_core.sql`](../../supabase/migrations/20260912000000_storyloom_core.sql).
3. In Authentication, enable Email/Password sign-in. Keep email confirmation enabled for a public project.
4. In Project Settings → API, copy the project URL and the **publishable** key (or legacy anon key). Do **not** copy a service-role or secret key.
5. Put those two public values in `config.js`, commit and push this repository, then wait for the GitHub Pages workflow to finish. The app will be at `https://dhruvguptaishere4050-creator.github.io/storyloom/app/`.

The publishable/anon key is specifically designed to be visible in a browser. It is safe only because the SQL migration's Row Level Security policies enforce each request. Never put a service-role or secret key in `config.js`, GitHub Pages, an Android app, or a screenshot.

## Create the first moderator

Sign up through the web app first. In Supabase SQL Editor, list profiles:

```sql
select id, display_name from public.profiles;
```

Then promote only the correct account:

```sql
update public.profiles set is_admin = true where id = 'PASTE-THE-UUID-HERE';
```

Moderators can publish, lock, reject, and review content. Review every submitted story before publishing it.

## Security model

The SQL migration enables Row Level Security on every exposed table. Public visitors can read only published Everyone/Teen stories and their visible comments/reviews. Writers can submit and edit only their own pending stories. Privileged actions require `is_admin = true` in the database.

The migration is a starting point, not a claim of being hack-proof. Before a public launch add rate limits, spam/abuse detection, a monitored moderation address, backups, legal review, and recurring security updates. The current product uses human moderation and content ratings; do not rely on automated AI moderation to decide whether a child is safe.
