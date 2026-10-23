import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import { before, after, test } from 'node:test'
import { unstable_dev } from 'wrangler'
import { prefersMarkdown } from '../worker.mjs'

let site
before(async () => {
  site = await unstable_dev('worker.mjs', {
    config: 'wrangler.jsonc', ip: '127.0.0.1', port: 0, inspectorPort: 0,
    local: true, logLevel: 'error', persist: false,
    experimental: { disableExperimentalWarning: true, disableDevRegistry: true, watch: false },
  })
})
after(async () => { await site?.stop() })

const request = (path, accept = 'text/html', options = {}) => fetch(new URL(path, `http://${site.address}:${site.port}`), {
  ...options, headers: { Accept: accept, ...options.headers },
})
const hasVary = (response) => assert.match(response.headers.get('vary') ?? '', /(?:^|,\s*)Accept(?:,|$)/i)
const read = (file) => readFileSync(new URL(`../${file}`, import.meta.url), 'utf8')

test('negotiation respects explicit opt-in, quality, and wildcard specificity', () => {
  for (const value of ['', '*/*', 'text/*', 'text/html', 'text/markdown;q=0',
    'text/markdown;q=0,*/*;q=1', 'text/markdown;q=0.5,text/html;q=0.9',
    'text/markdown;q=invalid', 'text/markdown;q=2']) assert.equal(prefersMarkdown(value), false, value)
  for (const value of ['text/markdown', 'TEXT/MARKDOWN; charset=utf-8',
    'text/markdown,text/html', 'text/markdown;q=0.9,text/html;q=0.5',
    'text/markdown;q=0.5,text/html;q=0,*/*;q=1']) assert.equal(prefersMarkdown(value), true, value)
})

test('raw HTML has meaningful content, a clear H1, identity metadata, and unchanged styles', async () => {
  const response = await request('/')
  assert.equal(response.status, 200)
  assert.match(response.headers.get('content-type'), /^text\/html/)
  hasVary(response)
  const html = await response.text()
  const main = html.match(/<main>([\s\S]*?)<\/main>/)[1]
  const text = main.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
  assert.ok(text.length >= 500, `Only ${text.length} characters`)
  assert.deepEqual([...main.matchAll(/<h([1-6])\b/g)].map((match) => +match[1]), [1])
  assert.match(main, /<h1>Rootul Patel<\/h1>/)
  assert.match(html, /<title>Rootul Patel · Distributed Systems Engineering Manager at Celestia<\/title>/)
  assert.match(html, /<link rel="canonical" href="https:\/\/rootulp.com\/">/)
  assert.match(html, /<meta property="og:url" content="https:\/\/rootulp.com\/">/)
  assert.ok(html.includes(`<style>\n${read('src/styles.css')}</style>`))
  assert.doesNotMatch(html, /<script(?! type="application\/ld\+json")/)
  const person = JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1])
  assert.equal(person['@context'], 'https://schema.org')
  assert.equal(person['@type'], 'Person')
  assert.equal(person.name, 'Rootul Patel')
  assert.equal(person.url, 'https://rootulp.com/')
  assert.ok(person.description.length > 20)
  assert.equal(person.worksFor.name, 'Celestia')
  for (const profile of person.sameAs) assert.ok(main.includes(`href="${profile}"`))
})

test('homepage Markdown contains the same biography and links, including with a query string', async () => {
  for (const path of ['/', '/?source=agent']) {
    const response = await request(path, 'text/markdown')
    assert.equal(response.status, 200)
    assert.match(response.headers.get('content-type'), /^text\/markdown(?:;|$)/)
    hasVary(response)
    const markdown = await response.text()
    assert.equal(markdown, read('dist/index.md'))
    assert.match(markdown, /^# Rootul Patel\n/)
    assert.doesNotMatch(markdown, /<(?:html|style|script|p|a)\b/)
    const main = read('src/index.html').match(/<main>([\s\S]*?)<\/main>/)[1]
    for (const [, href] of main.matchAll(/href="([^"]+)"/g)) {
      assert.ok(markdown.includes(`](${new URL(href, 'https://rootulp.com/').href})`), href)
    }
    assert.ok(markdown.includes('At Celestia, I led the first consensus-breaking network upgrade'))
  }
})

test('404 responses preserve their status and negotiate Markdown with discovery links', async () => {
  for (const path of ['/__ora-404-probe-test', '/missing/deep/page', '/missing.json']) {
    for (const accept of ['text/html', 'text/markdown']) {
      const response = await request(path, accept)
      assert.equal(response.status, 404)
      assert.match(response.headers.get('content-type'), new RegExp(`^${accept}`))
      hasVary(response)
      const body = await response.text()
      if (accept === 'text/markdown') {
        assert.equal(body, read('src/404.md'))
        assert.ok(body.length >= 20)
        assert.match(body, /\[sitemap\]\(https:\/\/rootulp.com\/sitemap.xml\)/)
      } else assert.match(body, /<h1>404: Page not found<\/h1>/)
    }
  }
})

test('HTML remains the default and the preferred representation for browsers', async () => {
  for (const accept of ['*/*', 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'text/markdown;q=0', 'text/html;q=1,text/markdown;q=0.5']) {
    const response = await request('/', accept)
    assert.match(response.headers.get('content-type'), /^text\/html/)
    assert.match(await response.text(), /<!DOCTYPE html>/)
    hasVary(response)
  }
})

test('HEAD returns matching metadata without a body for homepage and missing pages', async () => {
  for (const path of ['/', '/missing']) {
    for (const accept of ['text/html', 'text/markdown']) {
      const response = await request(path, accept, { method: 'HEAD' })
      assert.equal(response.status, path === '/' ? 200 : 404)
      assert.match(response.headers.get('content-type'), new RegExp(`^${accept}`))
      hasVary(response)
      assert.equal(await response.text(), '')
    }
  }
})

test('all public files and existing resume routes still resolve for HTML and Markdown clients', async () => {
  for (const path of [...readdirSync(new URL('../dist/', import.meta.url)).map((file) => `/${file}`), '/resume']) {
    for (const accept of ['text/html', 'text/markdown']) {
      let response = await request(path, accept, { redirect: 'manual' })
      if ([301, 302, 307, 308].includes(response.status)) {
        const location = response.headers.get('location')
        await response.arrayBuffer()
        response = await request(new URL(location, 'https://rootulp.com/').pathname, accept, { redirect: 'manual' })
      }
      assert.equal(response.status, 200, `${path} (${accept})`)
      assert.ok((await response.arrayBuffer()).byteLength > 0, path)
      if (path === '/resume.pdf') assert.match(response.headers.get('content-type'), /^application\/pdf/)
      if (path.endsWith('.md')) assert.match(response.headers.get('content-type'), /^text\/markdown/)
    }
  }
  assert.equal(read('dist/resume.html'), read('src/resume.html'))
})

test('canonical redirects resolve in one hop and preserve negotiation', async () => {
  for (const [alias, canonical] of [['/index.html', '/'], ['/resume.html', '/resume']]) {
    const redirect = await request(alias, 'text/html', { redirect: 'manual' })
    assert.equal(redirect.status, 307)
    assert.equal(new URL(redirect.headers.get('location'), `http://${site.address}:${site.port}`).pathname, canonical)
    await redirect.arrayBuffer()
    for (const accept of ['text/html', 'text/markdown']) {
      const response = await request(alias, accept)
      assert.equal(response.status, 200)
      assert.equal(new URL(response.url).pathname, canonical)
      assert.match(response.headers.get('content-type'), new RegExp(`^${canonical === '/' ? accept : 'text/html'}`))
      await response.arrayBuffer()
    }
  }
})

test('machine-readable discovery files use canonical URLs and link to working endpoints', async () => {
  const robots = await request('/robots.txt')
  assert.match(robots.headers.get('content-type'), /^text\/plain/)
  assert.equal(await robots.text(), 'User-agent: *\nAllow: /\n\nSitemap: https://rootulp.com/sitemap.xml\n')
  const sitemap = await request('/sitemap.xml')
  assert.match(sitemap.headers.get('content-type'), /(?:application|text)\/xml/)
  const xml = await sitemap.text()
  assert.match(xml, /<urlset xmlns="http:\/\/www.sitemaps.org\/schemas\/sitemap\/0.9">/)
  const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1])
  assert.deepEqual(urls, ['https://rootulp.com/', 'https://rootulp.com/resume'])
  const guide = await request('/llms.txt')
  assert.match(guide.headers.get('content-type'), /^text\/plain/)
  const markdown = await guide.text()
  assert.match(markdown, /^# Rootul Patel\n\n> /)
  for (const url of [...urls, ...[...markdown.matchAll(/\]\((https:\/\/rootulp.com\/[^)]*)\)/g)].map((match) => match[1])]) {
    const response = await request(new URL(url).pathname)
    assert.equal(response.status, 200, url)
    await response.arrayBuffer()
  }
})
