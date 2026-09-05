# jelledelporte.dev

Personal site — home, three project pages, a resume and an about page. Plain HTML, CSS and
TypeScript, bundled by Vite. No framework.

```bash
npm install
npm run dev       # dev server with hot reload
npm run build     # type-check, then build to dist/
npm run preview   # serve the built site
```

## How it fits together

| Path | What it is |
| --- | --- |
| `index.html`, `tronk/`, `gentleman-productions/`, `sano-j/`, `resume/`, `about/` | one `index.html` per page |
| `partials/` | shared `head`, `header`, `footer`, included at build time |
| `src/styles/` | `tokens.css` holds the palette and type ramp; everything else reads it |
| `src/hex.ts` | draws the Tronk board — the only real JavaScript on the site |
| `public/` | copied verbatim into `dist/` |
| `design/` | the design canvas the site was built from |

**Shared header and footer** come from a small Vite plugin in `vite.config.ts`. Write
`<!-- @include partials/header.html -->` in a page and it is inlined during dev and build.

**`{{root}}`** in any page or partial becomes the relative path back to the site root (`` at the
top, `../` one level down). Together with `base: './'` this keeps every link and asset relative, so
the same `dist/` works at a domain root, inside a project subfolder, or opened from disk — the repo
can be renamed without touching the code.

**The active nav item** is CSS, not JavaScript: each page sets `<body data-page="work|about|resume">`.

**The resume PDF is the resume page, printed.** `src/styles/print.css` inverts it to ink on white,
drops the site chrome and fits A4. There is no second file to keep in sync.

## Deploying to GitHub Pages

`.github/workflows/deploy.yml` builds and deploys on every push to `main`. One manual step first:
in the repo, **Settings → Pages → Build and deployment → Source: GitHub Actions**.

The URL depends on the repo name: a repo called `DelporteJelle.github.io` is served at the root,
any other name from a subfolder (`…github.io/portfolio/`). Both work as-is.

## Still to fill in

Text in `[BRACKETS]` and `[EXPAND: …]` marks everything only Jelle can write — years, roles,
education, project outcomes, the Sano-J URL. Client screenshots are honest empty frames until real
ones exist; the three photographs are `placeholder-*.jpg` stand-ins.

```bash
grep -rn "\[EXPAND\|\[REPLACE\|\[YEAR\|\[YOUR\|\[SCREENSHOT\|\[CITY\|\[COMPANY\|\[DEGREE" --include="*.html" .
```
