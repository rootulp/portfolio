// Assemble the static site into dist/: copy src/ and inline src/styles.css into every
// page that links it, so a page renders from one response instead of two.
import { cpSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const here = import.meta.dirname
const src = join(here, 'src')
const dist = join(here, 'dist')

rmSync(dist, { recursive: true, force: true })
cpSync(src, dist, { recursive: true })

const link = '<link rel="stylesheet" href="/styles.css">'
const style = `<style>\n${readFileSync(join(src, 'styles.css'), 'utf8')}</style>`
for (const file of readdirSync(src, { recursive: true })) {
  if (!file.endsWith('.html')) continue
  const html = readFileSync(join(src, file), 'utf8')
  if (html.includes(link)) writeFileSync(join(dist, file), html.replace(link, style))
}
rmSync(join(dist, 'styles.css'))

// This site's small homepage uses headings, paragraphs, links, and spans only.
// Generate its alternate representation from that same content to prevent drift.
const homepage = readFileSync(join(src, 'index.html'), 'utf8')
const main = homepage.match(/<main>([\s\S]*?)<\/main>/)[1]
const markdown = main
  .replace(/<h([1-6])[^>]*>([\s\S]*?)<\/h\1>/g, (_, level, text) => `${'#'.repeat(Number(level))} ${text}\n\n`)
  .replace(/<a\s+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g, (_, href, text) => {
    const url = new URL(href, 'https://rootulp.com/').href
    return `[${text}](${url})`
  })
  .replace(/<\/?span[^>]*>/g, '')
  .replace(/<p[^>]*>/g, '')
  .replace(/<\/p>/g, '\n\n')
  .replace(/\n{3,}/g, '\n\n')
  .trim()
if (/<\/?[a-z][^>]*>/i.test(markdown)) throw new Error('Unsupported homepage markup in Markdown generation')
writeFileSync(join(dist, 'index.md'), `${markdown}\n`)
