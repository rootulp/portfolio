// Assemble the static site into dist/.
// - Copies src/ plus the resume and favicon, which still live in ../public (shared with
//   the Next.js site) until the Next.js code is removed.
// - Inlines src/styles.css into every page so the first paint needs one request, not two.
import { cpSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const here = import.meta.dirname
const src = join(here, 'src')
const dist = join(here, 'dist')

rmSync(dist, { recursive: true, force: true })
cpSync(src, dist, { recursive: true })
for (const file of ['resume.html', 'resume.pdf', 'favicon.ico']) {
  cpSync(join(here, '..', 'public', file), join(dist, file))
}

const link = '<link rel="stylesheet" href="/styles.css">'
const style = `<style>\n${readFileSync(join(src, 'styles.css'), 'utf8')}</style>`
for (const file of readdirSync(src, { recursive: true })) {
  if (!file.endsWith('.html')) continue
  const html = readFileSync(join(src, file), 'utf8')
  if (!html.includes(link)) throw new Error(`${file} is missing ${link}`)
  writeFileSync(join(dist, file), html.replace(link, style))
}
rmSync(join(dist, 'styles.css'))
