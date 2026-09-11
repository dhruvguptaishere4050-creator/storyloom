# Storyloom Free Edition

This directory is the Storyloom foundation, based on [WriteFreely](https://github.com/writefreely/writefreely) at commit `049aa2a25af41d20c400f2f9794b285f7b2958ec`.

WriteFreely already supplies the core publishing system: accounts, one or more writer blogs, Markdown writing, drafts, public and private posts, a reader timeline, tag-based discovery, exports, and ActivityPub support. It is a stronger, maintained replacement for building those parts from scratch.

## What "fully free" means here

The software is free and open source. This edition deliberately does **not** depend on paid AI, API keys, a managed database, or a paid hosting platform.

For a small community, run it on a computer you already own with its included SQLite database. This costs no subscription, but it is only available while that computer, its internet connection, and its power are on. A public service at any meaningful scale still has unavoidable real-world costs: electricity, storage, bandwidth, moderation time, backups, and the Google Play registration fee if you publish an Android app.

## Free discovery instead of paid RAG / AI

Storyloom Free Edition uses transparent, non-AI discovery:

1. Require writers to add clear tags such as `romance`, `thriller`, `comic`, `fantasy`, `teen`, or `mature`.
2. Show the local reader timeline and tag archive; recommend related tags from the current story.
3. Keep `mature` stories in a separate collection or instance. Do not place them on the default timeline or a tag page intended for young readers.
4. Do not collect reading history for recommendations. This keeps the platform simpler, private, and free to operate.

This is not a substitute for safety moderation. Tags can be wrong or abused, so humans must review reports and new writers.

## Safe, free starting setup

1. Install a current Go toolchain from the official Go project.
2. Copy `config.storyloom.ini.example` to `config.ini`.
3. Build from this folder:

   ```powershell
   go build -tags "netgo sqlite" -o storyloom.exe ./cmd/writefreely
   ```

4. Create the database and keys:

   ```powershell
   .\storyloom.exe --c config.ini --init-db
   .\storyloom.exe --c config.ini --gen-keys
   ```

5. Run the interactive setup and create your administrator account:

   ```powershell
   .\storyloom.exe --c config.ini --config
   ```

6. Start the local community:

   ```powershell
   .\storyloom.exe --c config.ini serve
   ```

7. Open `http://localhost:8080`.

Back up `storyloom.db` and the `keys` directory before every upgrade. Do not copy a database while the application is writing to it; stop the server first.

## Before inviting other people

- Set a clear content policy, report email address, and copyright-takedown process.
- Keep registrations closed until you can review new accounts and reports.
- Add a real, age-appropriate content rating workflow. WriteFreely does not provide automatic NSFW classification.
- Enable HTTPS before any public access. Never publish passwords or an admin dashboard over plain HTTP.
- Keep this installation patched, make tested backups, and publish an emergency contact path.

The ready-to-use [community rules](CONTENT_POLICY.md) and [moderation checklist](MODERATION_CHECKLIST.md) are included in this source tree. After the site starts, copy the policy into the editable About or Home page in `/admin/pages`, and replace the Contact page placeholder with your real moderation email.

## AGPL source obligation

WriteFreely is licensed under the GNU Affero General Public License v3. If this modified version is available to people over a network, those users must be able to get the corresponding source code of the version that is running.

Before public use, create a **public GitHub fork** of this repository and add a visible “Source code” link to that fork in the site footer. Keep `LICENSE`, upstream notices, and the source of all Storyloom modifications available under AGPLv3. This is a licensing obligation, not an optional credit.

## Deliberately not included yet

- Android native app (the existing Expo app in `../storyloom-mobile` can become a client later)
- Review threads and report dashboard
- Comics / image uploads
- Automatic moderation or recommendations

Adding those safely is a separate engineering task. We should add them to this branch gradually, with tests and clear moderation rules, rather than claiming that open-source code makes a public community automatically safe.
