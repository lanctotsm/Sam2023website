# Architecture proposal: cheaper, or much better for the same money

Written 2026-07-31. Reviewed against the repository as it stands on
`feat/design-system-and-gallery`.

## The honest summary

You are paying roughly **$6/month** today. There is very little to cut — at most
about $2 — so a proposal that promises big savings would be lying to you. The
real opportunities are different, and there are three of them:

1. **Make the $5 box behave like a much bigger one.** Every public page is
   currently rendered from scratch on every request. Caching them properly is
   free and is worth more than any hardware upgrade you could buy.
2. **Close the two ways this setup can actually hurt you**: a single large photo
   upload can run the instance out of memory, and a database failure can lose up
   to seven days of content.
3. **Make your brother's site cost $0 instead of $5–7/month**, by putting it on
   the same instance rather than a second one.

Everything below is ordered by value per hour of work. Phase 0 is a single
evening and changes no architecture.

## Where the money currently goes

| Line item | Monthly |
| --- | --- |
| Lightsail `nano_3_0` instance (2 vCPU, 512 MB RAM, 20 GB SSD, IPv4) | $5.00 |
| Lightsail static IP (free while attached) | $0.00 |
| Route 53 hosted zone | $0.50 |
| CloudFront (1 TB egress + 10M requests are permanently free) | ~$0.00 |
| S3 Standard, assuming ~5 GB of photos across three variants each | ~$0.12 |
| **Total** | **~$5.60** |

Two things follow from this table. First, CloudFront is effectively free at your
traffic level, so you should use it far more aggressively than you currently do.
Second, the instance is 89% of the bill, which means the only meaningful cost
lever is *how many sites that one instance serves*.

## What is running now

```
GitHub Actions → lint/typecheck/test → next build (standalone)
              → npm rebuild better-sqlite3
              → rsync to Lightsail:/opt/heron-cms  (--delete)
              → deploy-db.cjs (SQLite migrations)
              → pm2 restart → Apache :443 → 127.0.0.1:3000

Lightsail nano (512 MB)
  ├── /opt/heron-cms                  app, replaced every deploy
  └── /var/lib/heron-cms/data/cms.db  SQLite, WAL mode, survives deploys

S3 (private) → CloudFront → public image URLs
```

Images go through CloudFront. **HTML and API traffic do not** — they go straight
to one small box on one IPv4 address, and every page is re-rendered per request.

---

## P1. Stop re-rendering every page on every request

**The problem.** `app/posts/page.tsx`, `app/posts/[slug]/page.tsx`,
`app/albums/page.tsx`, and `app/albums/[slug]/page.tsx` all declare:

```ts
export const dynamic = "force-dynamic";
```

So a visitor loading an album triggers a full React Server Component render, a
`getServerUser()` session decode, and two sequential `serverFetch()` calls that
loop back into this same Node process over HTTP on `127.0.0.1:3000` — which then
run the SQLite queries. Content that changes a few times a month is being
rebuilt thousands of times a month, on the smallest instance AWS sells.

**Why it is currently written that way.** These pages render admin affordances
inline, for example in `app/albums/[slug]/page.tsx`:

```tsx
{user && (
  <Link href={`/admin/albums/${album.id}`}>Manage album</Link>
)}
```

Because the HTML depends on who is asking, it cannot be cached as-is. That is
the actual blocker, and it is worth removing.

**The change.**

1. Move admin-only controls into a small client component that reads
   `useSession()`. The server-rendered HTML then becomes identical for everyone.
2. Replace `force-dynamic` with `export const revalidate = 3600`.
3. Call `revalidateTag("posts")` / `revalidateTag("albums")` from the mutating
   API routes, exactly as `services/settings.ts` already does for settings. That
   pattern is established in the codebase, so this is consistent rather than new.

**Payoff.** Renders drop from once-per-request to once-per-change. Page latency
becomes a disk read. The box stops being the bottleneck, and P2 becomes possible.

**Caveat worth knowing.** Next.js keeps the incremental cache in `.next/cache`,
which lives inside `/opt/heron-cms` and is therefore wiped by the deploy's
`rsync --delete`. The cache is cold after each deploy and re-warms itself, which
is fine; if you would rather it persist, point a custom `cacheHandler` at a
directory under `/var/lib/heron-cms`.

**Effort.** Medium: four route files, a handful of mutation handlers, one
component split.

---

## P2. Put the application behind the CloudFront distribution you already pay for

**The problem.** All HTML and API traffic terminates on a single 512 MB instance
with a public IPv4 address. Any traffic spike, crawler, or scanner hits Node
directly. TLS is renewed on the box by certbot, which is one more thing that can
quietly break.

**The change.** `infra/lightsail-cms.yaml` already defines a distribution for
S3. Add the instance as a second origin and split behaviors:

- **Cached**: `/`, `/posts*`, `/albums*`, `/resume`, `/feed.xml`, `/_next/static/*`
- **Never cached** (`CachingDisabled`, forward all headers/cookies): `/api/*`,
  `/admin*`, `/upload*`

Then terminate TLS at CloudFront with an ACM certificate, drop certbot from the
instance, and lock the origin so it only accepts requests carrying a shared
secret header from CloudFront. Direct-to-IP scanning traffic disappears.

**Do P1 first — this order is not optional.** If you cache HTML while pages
still render `{user && ...}` server-side, CloudFront will happily store a
logged-in admin's HTML and serve it to the public. If for some reason you want
P2 before P1, you must add the session cookies
(`next-auth.session-token`, `__Secure-next-auth.session-token`) to the cache key
so anonymous and authenticated responses are stored separately. Doing P1 first
avoids the whole problem.

**Cost.** $0 at this traffic level; the free tier covers 1 TB and 10M requests
per month permanently.

---

## P3. Raise the memory ceiling on uploads

This is the most likely way the site actually goes down, and it is the cheapest
thing in this document to fix.

**The problem.** The instance has 512 MB of RAM. Meanwhile:

- `MAX_UPLOAD_BYTES` defaults to 100 MB, and `next.config.js` sets
  `serverActions.bodySizeLimit: "100mb"`.
- `processImage()` in `lib/image-processing.ts` receives the whole file as a
  `Buffer`, then does `Buffer.from(input)` for `original.buffer` — **a second
  full copy of a file that may be 100 MB, for no reason**. Nothing mutates the
  input, so the copy can be dropped outright.
- It then runs six sharp operations over that buffer (metadata, thumb, thumb
  metadata, large, large metadata, LQIP). Decoding a 25 MP image costs roughly
  75 MB of raw pixels, and libvips keeps its own cache on top.

Peak usage for one big upload comfortably exceeds what the box has, and the
Linux OOM killer does not politely fail the request — it kills the Node process
and takes the whole site with it.

**The changes, cheapest first.**

1. ✅ Drop the `Buffer.from(input)` copy and pass `input` through. One line,
   saves up to 100 MB per upload. Done in the code review below.
2. ✅ `sharp.concurrency(1)` and `sharp.cache({ memory: 32 })` at module load,
   so libvips cannot balloon on a small box. Done in `lib/image-processing.ts`.
3. Add a 2 GB swap file. The Lightsail Ubuntu blueprint has none by default;
   swap converts an OOM-kill into a merely slow request. **Not done** — this
   touches the live instance and the deploy workflow, which the code review
   below deliberately left alone; do it as its own watched change.
4. Set `NODE_OPTIONS=--max-old-space-size=384` in the deployed `.env` so V8 does
   not try to grow into memory the box does not have. **Not done**, same
   reason as #3.
5. ✅ Lower `MAX_UPLOAD_BYTES` to ~25 MB, which still accepts anything a phone
   or a full-frame camera produces. Done — server default in
   `app/api/images/upload/route.ts` and `.../replace/route.ts`, client-side
   default in `lib/upload-utils.ts`. If you genuinely need larger files, write
   the upload to a temp file and let sharp stream from disk instead of
   buffering.

**Effort.** Items 1, 2, and 5 are done (app-level, low-risk). Items 3 and 4
are infra changes against the live production instance and remain open.

---

## P4. Replace the weekly database dump with continuous replication

**The problem.** `scripts/backup-cms-db.cjs` runs from cron at `15 3 * * 0` —
once a week, Sunday morning — and retains eight copies. If the instance's disk
fails on a Saturday, you lose six days of posts, albums, and uploads metadata.
The photos themselves survive in S3, but the records describing them do not.

**The change.** Run [Litestream](https://litestream.io) against
`/var/lib/heron-cms/data/cms.db`, replicating the WAL continuously to
`s3://<bucket>/litestream/cms.db`. Recovery point objective goes from *one week*
to *a few seconds*, restore is a single `litestream restore` command, it is free
and open source, and it is purpose-built for exactly this deployment shape
(one SQLite file, one small VM). Keep the weekly gzip dump as well — it is
cheap, and a periodic full snapshot protects against a corrupted replication
stream in a way that continuous replication does not.

Separately, turn on **Lightsail automatic snapshots** (~$1/month for the 20 GB
disk). Litestream protects the database; snapshots let you rebuild the entire
machine. This is the single best dollar in this document.

---

## P5. Stop storing cold originals in the hot tier, and let browsers cache images

**The problem.** Every upload writes three S3 objects: `uploads/{id}-thumb.jpg`,
`uploads/{id}-large.jpg`, and `uploads/{id}-original.{ext}`. The site only ever
serves thumb and large; the original exists as an archival master and for
re-processing on rotate. It is nevertheless kept in S3 Standard forever, and it
is by far the largest of the three. There is no lifecycle policy in
`infra/lightsail-cms.yaml`.

Separately, `putObject()` in `lib/s3.ts` sets only `ContentType`. With no
`Cache-Control`, you are relying entirely on CloudFront's default TTL and
getting no useful browser caching.

**The changes.**

1. Add a lifecycle rule transitioning `uploads/*-original.*` to **Glacier
   Instant Retrieval** after 30 days: $0.023/GB-month becomes $0.004/GB-month on
   your largest objects, with millisecond retrieval still available for rotates.
   Leave thumb and large in Standard.
2. Set `Cache-Control` on upload — **but note a real trap first.** The keys are
   not content-addressed: rotate and replace overwrite
   `uploads/{id}-large.jpg` in place. Marking that `immutable` would leave
   visitors looking at the pre-rotation photo until the CDN entry expires. So
   either version the key (`uploads/{id}-large-{updatedAt}.jpg`) and then use
   `max-age=31536000, immutable`, or settle for `max-age=86400`. The versioned
   key is the better answer, and it also fixes the stale-image-after-rotate
   behaviour that exists today.
3. `scripts/cleanup-orphan-s3.ts` already exists but nothing runs it. Add it to
   the weekly cron alongside the backup, in report-then-delete form.

**Prefer an explicit lifecycle rule over S3 Intelligent-Tiering here.**
Intelligent-Tiering charges a per-object monitoring fee to discover an access
pattern you already know: originals are cold by definition.

---

## P6. Make the second site free instead of $5–7/month

This is the only place in this document with genuine cost savings, and it is the
reason the reusability document is worth reading alongside this one.

Once the instance runs containers behind Caddy — which is the already-approved
direction in `docs/superpowers/specs/2026-05-30-ci-custom-image-lightsail-design.md`
— a second website is one more container, one more Caddy site block, one more
key prefix in the same S3 bucket, and one more behavior on the same CloudFront
distribution. **Marginal infrastructure cost: $0.**

One constraint to respect: 512 MB is not enough for two Node processes plus
image processing. Move up when you add the second site:

| Option | Monthly | RAM | Per site |
| --- | --- | --- | --- |
| Two separate `nano` instances | $10.00 | 512 MB each | $5.00 |
| One `micro` hosting both | $7.00 | 1 GB shared | $3.50 |
| One `small` hosting both | $12.00 | 2 GB shared | $6.00 |

`micro_3_0` at $7 is the value pick and still cheaper than two nanos.
`small_3_0` at $12 costs slightly more per site than two nanos but gives each
site four times the memory it has today, which — given P3 — is worth the $2.

Because the CMS uses SQLite, each site needs its own database file. Keep them in
separate directories (`/var/lib/heron-cms/`, `/var/lib/heron-brother/`) with a
separate Litestream target each. Do not try to share one database between sites.

---

## Alternatives considered and rejected

**Vercel or Netlify free tier.** Attractive on price, but this CMS writes to a
SQLite file on local disk and serverless platforms have no persistent
filesystem. You would have to move to a hosted Postgres or Turso first. That is
a rewrite plus a new bill, to replace something that costs $5.

**Lightsail Container Service ($7–10/month).** Already rejected in the existing
spec, for the correct reason: no persistent volume, so SQLite cannot live there.

**RDS or Lightsail managed database (from $15/month).** Triples the bill to
solve a scaling problem this site does not have.

**Turso / libSQL.** Genuinely the most interesting option here — SQLite-
compatible, replication built in, generous free tier. The catch is that it is a
*networked* database, so every synchronous `better-sqlite3` call in
`lib/db/index.ts` and every service in `services/` becomes async. Worth
revisiting if you ever outgrow one instance; not worth it now.

**IPv6-only instance ($3.50, saves $1.50/month).** Would make the site
unreachable to IPv4-only visitors and networks. Not worth $18 a year.

---

## Suggested sequence

**Phase 0 — one evening, no architecture change, ~$1/month.** P3 (drop the
buffer copy, sharp limits, swap, `NODE_OPTIONS`), P4 (Litestream and automatic
snapshots), P5.1 (lifecycle rule). Pure downside protection with no new moving
parts.

**Phase 1 — P1.** Admin affordances move client-side; pages become cacheable
with `revalidateTag`. This is the largest performance change and it unblocks
Phase 2.

**Phase 2 — P2.** CloudFront in front of the app, TLS at the edge, certbot and
Apache's public exposure retired.

**Phase 3 — the Docker / GHCR / Caddy migration** already specified in
`docs/superpowers/plans/2026-05-30-ci-custom-image-lightsail.md`. This one has a
deadline attached rather than a payoff: the Bitnami blueprint the current
instance depends on cannot be used for new VMs after **2026-11-19**, so until
this lands you cannot rebuild the box from scratch. Do it before November.

**Phase 4 — P6.** Second site onto the same instance, sized up to `micro` or
`small`.

## Where you end up

| | Today | After Phase 0–2 | After Phase 4 (two sites) |
| --- | --- | --- | --- |
| Monthly cost | ~$5.60 | ~$6.60 | ~$8.60–$13.60 |
| Cost per site | ~$5.60 | ~$6.60 | ~$4.30–$6.80 |
| Public page render | every request | once per content change | once per content change |
| HTML served from | one 512 MB box | CloudFront edge | CloudFront edge |
| Worst-case data loss | up to 7 days | seconds | seconds |
| Large upload | can OOM-kill the site | bounded, swap-backed | bounded, swap-backed |
| Can rebuild the box after Nov 2026 | no | no, until Phase 3 | yes |

The bill goes up by about a dollar. The number of ways this site can ruin your
weekend goes down by most of them.
