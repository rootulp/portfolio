// Only an explicit Markdown media range opts into Markdown. Wildcards keep the
// normal browser experience; more specific ranges override wildcard qualities.
export function prefersMarkdown(accept = '') {
  const ranges = accept.split(',').map((part) => {
    const [type, ...parameters] = part.trim().toLowerCase().split(';')
    const quality = parameters.map((value) => value.trim()).find((value) => value.startsWith('q='))
    const q = quality ? Number(quality.slice(2)) : 1
    return { type: type.trim(), q: Number.isFinite(q) && q >= 0 && q <= 1 ? q : 0 }
  })
  const quality = (type) => {
    for (const match of [type, 'text/*', '*/*']) {
      const matches = ranges.filter((range) => range.type === match)
      if (matches.length) return Math.max(...matches.map((range) => range.q))
    }
    return 0
  }
  return ranges.some((range) => range.type === 'text/markdown') &&
    quality('text/markdown') > 0 && quality('text/markdown') >= quality('text/html')
}

function varyAccept(response) {
  const headers = new Headers(response.headers)
  const vary = headers.get('Vary')
  if (!vary?.split(',').some((value) => ['accept', '*'].includes(value.trim().toLowerCase()))) {
    headers.set('Vary', vary ? `${vary}, Accept` : 'Accept')
  }
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers })
}

async function markdown(request, env, path, status = 200) {
  const url = new URL(path, request.url)
  const asset = await env.ASSETS.fetch(new Request(url, { method: request.method }))
  if (!asset.ok) throw new Error(`Missing Markdown asset: ${path}`)
  const headers = new Headers(asset.headers)
  headers.set('Content-Type', 'text/markdown; charset=utf-8')
  return varyAccept(new Response(asset.body, { status, headers }))
}

export default {
  async fetch(request, env) {
    const path = new URL(request.url).pathname
    const readable = request.method === 'GET' || request.method === 'HEAD'
    const wantsMarkdown = readable && prefersMarkdown(request.headers.get('Accept') ?? '')
    if (path === '/' && wantsMarkdown) return markdown(request, env, '/index.md')

    const response = await env.ASSETS.fetch(request)
    if (response.status === 404 && wantsMarkdown) return markdown(request, env, '/404.md', 404)
    if (path === '/' || response.status === 404) return varyAccept(response)
    return response
  },
}
