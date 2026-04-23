# Serverless Changelog

Changelog platforms are a great use case for leveraging the benefits of serverless. Not only is it more cost effective than using a cheap always running VPS, but it also allows for near instant scalability if needed in the future.

This lightweight changelog app helps track and display changelog updates to end users or investors for any project. Save time and money on your next project - Deploy a cost effective and highly scalable changelog service on Cloudflare for your projects in ~10 minutes.

## Stack / Tooling

- Astro framework - frontend and backend in a single app
- Cloudflare adapter for Worker-style deployment
- Cloudflare D1 for posts, tags, inquiries, and rate-limit tracking
- EasyMDE for admin markdown editor
- `marked` + `sanitize-html` for markdown rendering

## Features / Highlights

- Blazing fast, Granular scalability
- Easy to modify design, lightweight framework
- Lazy-loading for viewing older posts
- Built-in search across titles, subtitles, and tags
- Optional password protected access with rate-limiting for investors/private projects
- Simple and secure admin panel for content post and tag management
- Inquiry module for funneling user submitted questions/suggestions
- Markdown content support with image support via markdown image syntax for data portability

## Required environment variables

Copy `.dev.vars.example` to `.dev.vars` for local development.

- `ADMIN_PASSWORD`: password for the admin panel
- `SESSION_SECRET`: signing secret for admin and viewer session cookies
- `SITE_NAME`: optional brand override
- `SITE_TAGLINE`: optional subtitle override

## D1 database schema

Required tables:

- `posts`
- `tags`
- `post_tags`
- `inquiries`
- `settings`
- `rate_limits`

## Local setup

1. Install Node.js 20+.
2. Install dependencies:

```bash
npm install
```

3. Update `wrangler.jsonc` with your real D1 `database_id`.
4. Create `.dev.vars` from `.dev.vars.example`.
5. Run the schema locally:

```bash
npm run db:migrate
```

6. If you already created the database before these updates, apply the migrations:

```bash
wrangler d1 execute changelog --local --file=./db/migrations/002_tag_color.sql
wrangler d1 execute changelog --local --file=./db/migrations/003_viewer_access_settings.sql
wrangler d1 execute changelog --local --file=./db/migrations/004_fix_markdown_newlines.sql
```

7. Optional: seed demo data:

```bash
npm run db:seed
```

8. Start the app:

```bash
npm run dev
```

## Deployment

1. Run `npm run build`.
2. Make sure your production Worker/Pages project binds the D1 database as `DB`.
3. Set `ADMIN_PASSWORD`, `SESSION_SECRET`, `SITE_NAME`, and `SITE_TAGLINE`.
4. Deploy with Wrangler or push to repo for autodeploy via Github workflow.

## Notes

- Post content images are expected to be referenced by URL in markdown.
