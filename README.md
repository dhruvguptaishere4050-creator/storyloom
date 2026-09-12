# Storyloom

**A free, open-source home for original stories, comics, and readers.**

The public website is at [Storyloom](https://dhruvguptaishere4050-creator.github.io/storyloom/). Its real community application—accounts, stories, reader discussion, reviews, reports, author blocking, and moderator controls—is in [`site/app`](site/app). It needs a free Supabase project before it can accept real accounts and posts; follow the exact setup guide in [`site/app/README.md`](site/app/README.md).

Storyloom is a community publishing foundation for fiction, serials, comics, romance, thriller, fantasy, and other writing. It uses tags and a local reader timeline for transparent discovery, so it has no paid AI, recommendation API, or tracking dependency.

## Included today

- A database-backed browser app with email accounts, story submissions, public reading, comments, one review per reader, reports, blocks, author status, and moderation queues.
- The upstream WriteFreely server remains included for communities that prefer self-hosting their own Go/SQLite publishing service.
- Storyloom defaults for community rules, a safer invitation-only launch, privacy guidance, and a moderator checklist.
- A free SQLite configuration for a small community running on its own computer.
- Dark/light and distraction-free editing modes supplied by the underlying platform.

## Start locally

Read [STORYLOOM.md](STORYLOOM.md) first. It explains the free local build with Go and SQLite, safety limits, backups, and the steps required before inviting other people.

Important: the software is free, but a public internet service still needs a computer/server, power, internet, backups, and active moderation. Do not open registration until a real person can respond to reports.

## Roadmap

- Story chapters and series pages
- Reviews, comments, reports, and a moderator dashboard
- Comic/image uploads with size and safety controls
- A native Android client that connects to this backend

## Upstream and license

Storyloom is a modified version of [WriteFreely](https://github.com/writefreely/writefreely), a clean publishing platform made for writers. Upstream copyright © 2018-2026 Musing Studio LLC and contributing authors.

Storyloom and WriteFreely are licensed under the [GNU Affero General Public License v3.0](LICENSE). If you run a modified version for people over a network, you must make the corresponding source available to them. See [NOTICE-STORYLOOM](NOTICE-STORYLOOM) and [STORYLOOM.md](STORYLOOM.md).
