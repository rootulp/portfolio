# Portfolio

[![license](https://img.shields.io/:license-mit-blue.svg)](https://rootulp.mit-license.org)

This portfolio is built with [Next.js](https://nextjs.org/) and hosted on [Vercel](https://vercel.com).

This repo was created with [nextjs-portfolio-starter](https://github.com/vercel-solutions/nextjs-portfolio-starter) which uses a library called [Nextra](https://nextra.vercel.app/).

## Local Development

1. `git clone`
2. `yarn install`
3. Start the web server locally with `yarn dev`
4. Preview local changes at [http://localhost:3000](http://localhost:3000)
5. Make changes and create a PR. vercel bot should add a link to preview the deployment.
6. If changes look good, merge the PR.

## Static version (Cloudflare Workers, in progress)

`site/` holds a plain HTML/CSS version of the site that deploys to Cloudflare Workers static assets. `site/build.sh` copies `site/src` plus the resume and favicon from `public/` into `site/dist`.

1. `cd site && npm install`
2. Preview locally with `npx wrangler dev` at [http://localhost:8787](http://localhost:8787)
3. Deploy with `npx wrangler deploy` (needs a `CLOUDFLARE_API_TOKEN`)
