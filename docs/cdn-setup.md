# Moving the course videos off GitHub

## Why this is worth doing

`assets/video/` is three MP4s totalling 70 MB:

| File | Size | Used by |
|---|---|---|
| `video1.mp4` | 24 MB | Module 1, "Why dark patterns exist" |
| `video2.mp4` | 24 MB | Module 2, "The eight families in 90 seconds" |
| `video3.mp4` | 24 MB | Module 3, "The three actions that fix most situations" |

They are 86% of the 81 MB repository. Three separate costs:

1. **Every clone downloads all 70 MB**, and because git stores full history, it
   downloads every past revision of them too.
2. **GitHub Pages is not a video host.** It is documented as a soft 1 GB site
   limit with a 100 GB/month soft bandwidth limit and no byte-range guarantees.
   A 24 MB MP4 with `preload="metadata"` mostly behaves, but seeking is poor,
   and roughly 4,000 video views a month puts you in range of the bandwidth
   limit. GitHub's remedy for exceeding it is to ask you to stop.
3. **The history purge is blocked on this.** `scripts/purge-media-history.sh`
   removes `*.mp4` from the working tree as well as from history, so running it
   while `courseone` still points at `assets/video/*.mp4` ships three broken
   players. See `docs/history-rewrite-checklist.md`.

Fixing this takes the repo from 81 MB to about 8 MB and makes the videos load
faster than they do now.

## What a CDN actually does here

You upload the three files once to a storage bucket. The provider serves them
from servers near the viewer, over a URL like
`https://media.fynoptic.org/video1.mp4`. The `<video>` tag points at that URL
instead of a repo path. Nothing else about the site changes — no build step, no
JavaScript, no account required for viewers.

The properties that matter for video, which GitHub Pages does not give you:
proper HTTP range requests (so scrubbing works), long-lived cache headers, and
bandwidth that is not your repo host's problem.

## Picking a provider

Verify current free-tier numbers before committing; these move.

| Option | Cost at your size | Trade-off |
|---|---|---|
| **Cloudflare R2** (recommended) | Free tier covers this — 10 GB storage, and **zero egress fees**, which is the unusual part | S3-compatible; needs a Cloudflare account. Best long-term answer. |
| **Bunny.net** | ~$1/month minimum | Simplest UI of the three, genuinely cheap, but not free. |
| **GitHub Releases** | Free | Zero new accounts — attach the MP4s to a release and hotlink. Not a real CDN, no guaranteed range support, and it is still GitHub bandwidth. Fine as a stopgap. |
| **YouTube / Vimeo unlisted** | Free | Best playback and adaptive bitrate by far. But it swaps your player for theirs, adds third-party tracking to the course page, and shows their branding. |

Recommendation: **Cloudflare R2**, because egress is free, the domain can be a
subdomain you control, and it does not put a tracker on a page about consumer
protection.

## Setting up Cloudflare R2

1. Create a Cloudflare account. You do **not** have to move `fynoptic.org`'s DNS
   to Cloudflare for this to work — the `r2.dev` URL is enough to start.
2. **R2 → Create bucket**, name it `fynoptic-media`. Pick the automatic region.
3. Upload the three files from `assets/video/`. Keep the existing filenames
   so the only change in the HTML is the prefix.
4. **Bucket → Settings → Public access.** Either:
   - enable the `r2.dev` development URL — instant, gives you
     `https://pub-<hash>.r2.dev/video1.mp4`, rate-limited and not meant for
     production; or
   - **connect a custom domain** — `media.fynoptic.org`. This requires
     `fynoptic.org` to use Cloudflare DNS. This is the one you want long-term.
5. Confirm range requests work, which is what makes scrubbing usable:

   ```bash
   curl -sI -H 'Range: bytes=0-1023' https://media.fynoptic.org/video1.mp4
   # expect: HTTP/2 206  and  content-range: bytes 0-1023/24385627
   ```

6. Set a long cache lifetime. The files are immutable — if you re-cut a video,
   upload it under a new filename rather than replacing one in place.

## Changing the site

Six `<source src>` values, three in each of the two front ends. Nothing else
references the videos.

`courseone.html` (lines ~194, ~230, ~276):

```diff
-<source src="assets/video/video1.mp4" type="video/mp4"/>
+<source src="https://media.fynoptic.org/video1.mp4" type="video/mp4"/>
```

`src/pages/courseone.astro` (lines ~151, ~187, ~233) — same change, and note
these are currently root-absolute (`/assets/video/...`).

Then delete the local copies:

```bash
git rm -r assets/video
```

Verify before merging: open the course page, play each of the three modules,
scrub to the middle of one, and confirm the network panel shows `206 Partial
Content` from the CDN host and no request to `assets/video`.

## Only then, the history purge

With the videos gone from the working tree *and* the site pointing at the CDN,
`scripts/purge-media-history.sh` becomes safe to run. Follow
`docs/history-rewrite-checklist.md` in order — in particular, everyone with a
clone has to push first and re-clone afterwards, or the deleted history comes
straight back on their next push.

## What is left after that

Roughly 8 MB, of which `js/articles-data.js` is 5.8 MB. The Astro build already
extracts those bodies into `src/articles/*.html` and no longer ships them to the
browser, so once the legacy pages are retired at cutover that file can go too.
