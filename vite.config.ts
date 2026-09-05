import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig, type Plugin, type ResolvedConfig } from 'vite';

const PAGES = {
  main: 'index.html',
  tronk: 'tronk/index.html',
  gentleman: 'gentleman-productions/index.html',
  sanoj: 'sano-j/index.html',
  resume: 'resume/index.html',
  about: 'about/index.html',
} as const;

/**
 * Build-time HTML includes, so six pages can share one header and footer:
 *
 *   <!-- @include partials/header.html -->
 *
 * `{{root}}` in a page or a partial becomes the relative path back to the site
 * root ('' at the top, '../' one directory down). That is what lets the same
 * markup work whether the site is served from a domain root, a project
 * subfolder, or the filesystem — nothing is hardcoded to an absolute path.
 */
function htmlIncludes(): Plugin {
  const include = /<!--\s*@include\s+([\w./-]+)\s*-->/g;
  let config: ResolvedConfig;

  return {
    name: 'html-includes',
    configResolved(resolved) {
      config = resolved;
    },
    transformIndexHtml: {
      order: 'pre',
      handler(html, ctx) {
        const depth = ctx.path.replace(/^\//, '').split('/').length - 1;
        const root = '../'.repeat(depth);

        let out = html;
        // Resolve nested includes too, but refuse to loop forever.
        for (let pass = 0; pass < 5; pass++) {
          include.lastIndex = 0;
          if (!include.test(out)) break;
          include.lastIndex = 0;
          out = out.replace(include, (_match, file: string) =>
            readFileSync(resolve(config.root, file), 'utf8'),
          );
        }
        return out.replaceAll('{{root}}', root);
      },
    },
    handleHotUpdate({ file, server }) {
      if (file.replaceAll('\\', '/').includes('/partials/')) {
        server.ws.send({ type: 'full-reload' });
      }
    },
  };
}

export default defineConfig({
  // Relative asset URLs: the built site works at any base path.
  base: './',
  appType: 'mpa',
  plugins: [htmlIncludes()],
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: Object.fromEntries(
        Object.entries(PAGES).map(([name, file]) => [name, resolve(process.cwd(), file)]),
      ),
    },
  },
});
