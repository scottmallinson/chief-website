# Chief website

The public site for [Chief](https://github.com/scottmallinson/chief.ai), the on-device AI chief of
staff. Hand-written static HTML in `site/`, deployed by Vercel. No build step, no framework.

**The site makes no requests.** Its headline is that nothing about you leaves your machine, so
the page loads nothing from anywhere (see the Content-Security-Policy in `site/vercel.json`). Anything
that changes over time is written into the files by a workflow here, not fetched by the visitor.

## Keeping it current

The app repo tells this one when something changes:

| Event (`repository_dispatch`) | Sent when                                         | What happens                                                            |
| ----------------------------- | ------------------------------------------------- | ----------------------------------------------------------------------- |
| `open-prs`                    | a pull request in chief.ai opens, closes or edits | `scripts/stamp-prs.mjs` writes the oldest open one into the app picture |

With nothing open, the picture shows an example card and says so. Dates in the picture are filled
in by the visitor's own browser (`site/support.js`), with no request.

The release version and changelog still live in chief.ai for now: its release workflow edits
`site/support.js`, `site/index.html` and `site/changelog.html`.

## Working on it

```bash
npm install
npm run serve        # http://localhost:4174
npm run verify       # formatting, tests, layout tests
```

Commits follow [Conventional Commits](https://www.conventionalcommits.org/).

## Deploying

In the Vercel project, set the **Root Directory** to `site`.
