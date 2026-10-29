// Renders public/icons/icon.svg to the PNG sizes the manifest and iOS need.
// Uses Playwright's Chromium: `npm run icons` (requires playwright available).
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
let chromium
try {
  ;({ chromium } = require('playwright'))
} catch {
  ;({ chromium } = require(process.env.PLAYWRIGHT_MODULE ?? 'playwright'))
}

const svg = readFileSync(new URL('../public/icons/icon.svg', import.meta.url), 'utf8')
const targets = [
  { file: 'icon-192.png', size: 192, pad: 0, bg: 'transparent' },
  { file: 'icon-512.png', size: 512, pad: 0, bg: 'transparent' },
  { file: 'apple-touch-icon.png', size: 180, pad: 0, bg: '#0b0e11' },
  // Maskable: content inside the 80% safe zone on a full-bleed background.
  { file: 'icon-maskable-512.png', size: 512, pad: 0.12, bg: '#0f1418' },
]

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined })
const page = await browser.newPage()
for (const t of targets) {
  const inner = Math.round(t.size * (1 - t.pad * 2))
  await page.setViewportSize({ width: t.size, height: t.size })
  await page.setContent(
    `<html><body style="margin:0;background:${t.bg};display:grid;place-items:center;width:${t.size}px;height:${t.size}px">` +
      `<div style="width:${inner}px;height:${inner}px">${svg.replace('<svg ', `<svg width="${inner}" height="${inner}" `)}</div></body></html>`,
  )
  await page.screenshot({ path: new URL(`../public/icons/${t.file}`, import.meta.url).pathname, omitBackground: t.bg === 'transparent' })
  console.log('wrote', t.file)
}
await browser.close()
