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
