#!/usr/bin/env node
const { spawnSync } = require('child_process')
const fs = require('fs')
const path = require('path')
const os = require('os')
const { PDFDocument } = require('pdf-lib')

const CHROME_PATHS = [
  process.env.CHROME_PATH,
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium'
].filter(Boolean)

function findChrome() {
  for (const p of CHROME_PATHS) {
    if (fs.existsSync(p)) return p
  }
  console.error('Could not locate Chrome. Tried:')
  for (const p of CHROME_PATHS) console.error(`  ${p}`)
  console.error('Set CHROME_PATH=/path/to/chrome to override.')
  process.exit(1)
}

async function main() {
  const chrome = findChrome()
  const repoRoot = path.resolve(__dirname, '..')
  const inputHtml = process.env.INPUT_HTML
    ? path.resolve(process.env.INPUT_HTML)
    : path.join(repoRoot, 'public', 'resume.html')
  const outputPdf = process.env.OUTPUT_PDF
    ? path.resolve(process.env.OUTPUT_PDF)
    : path.join(repoRoot, 'public', 'resume.pdf')
  const tmpPdf = path.join(os.tmpdir(), `resume-${process.pid}.pdf`)

  if (!fs.existsSync(inputHtml)) {
    console.error(`Input HTML not found: ${inputHtml}`)
    process.exit(1)
  }

  const result = spawnSync(
    chrome,
    [
      '--headless=new',
      '--disable-gpu',
      '--no-pdf-header-footer',
      '--virtual-time-budget=10000',
      `--print-to-pdf=${tmpPdf}`,
      `file://${inputHtml}`
    ],
    { stdio: 'inherit' }
  )

  if (result.status !== 0) {
    console.error(`Chrome exited with code ${result.status}`)
    process.exit(1)
  }

  if (!fs.existsSync(tmpPdf)) {
    console.error(`Chrome did not produce ${tmpPdf}`)
    process.exit(1)
  }

  const bytes = fs.readFileSync(tmpPdf)
  const doc = await PDFDocument.load(bytes)
  const pageCount = doc.getPageCount()
  if (pageCount !== 1) {
    console.error(
      `Expected 1 page, got ${pageCount}. Tmp PDF left at ${tmpPdf} for inspection.`
    )
    process.exit(1)
  }

  fs.renameSync(tmpPdf, outputPdf)
  console.log(
    `wrote ${path.relative(repoRoot, outputPdf)} (${bytes.length} bytes, 1 page)`
  )
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
