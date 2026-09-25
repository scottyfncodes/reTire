// @vitest-environment jsdom
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from '../App'
import { UTAH_DESTINATIONS } from '../data/utah'
import { MODE_META } from '../engine/match'

/*
 * Real-DOM tests for the Utah screens and the navigation that reaches them,
 * plus a check that the Durango screens still render. No network: the
 * forecast fetch is stubbed to fail, which the app must present as a failure.
 */

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

let container: HTMLDivElement
let root: Root

async function flush() {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0))
  })
}

async function mountAt(hash: string) {
  location.hash = hash
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
  await act(async () => {
    root.render(<App />)
  })
  await flush()
}

async function navigate(hash: string) {
  location.hash = hash
  await flush()
}

async function click(el: Element | null | undefined) {
  expect(el, 'element to click').toBeTruthy()
  await act(async () => {
    ;(el as HTMLElement).click()
  })
  await flush()
}

function text() {
  return container.textContent ?? ''
}

function buttonByText(label: string | RegExp): HTMLButtonElement | undefined {
  return [...container.querySelectorAll('button')].find((b) =>
    typeof label === 'string' ? b.textContent?.includes(label) : label.test(b.textContent ?? ''),
  )
}

function sectionTitles() {
  return [...container.querySelectorAll('.section-title')].map((h) => h.textContent)
}

beforeEach(() => {
  localStorage.clear()
  window.scrollTo = vi.fn() as never
  vi.stubGlobal(
    'fetch',
    vi.fn(() => Promise.reject(new Error('offline in tests'))),
  )
})

afterEach(() => {
  act(() => root.unmount())
  container.remove()
  vi.unstubAllGlobals()
})

describe('home and region navigation', () => {
  it('keeps every Durango mode on Home and adds the region switch', async () => {
    await mountAt('#/')
    for (const meta of Object.values(MODE_META)) expect(text()).toContain(meta.label)
    expect(text()).toContain("DEALER'S CHOICE")
    expect(text()).toContain('What are we')
    const colorado = buttonByText('Colorado')
    expect(colorado?.getAttribute('aria-pressed')).toBe('true')
    expect(buttonByText('Utah')?.getAttribute('aria-pressed')).toBe('false')
    expect(text()).toContain('Go further')
  })

  it('goes Home -> Utah via the switch, and back to Colorado', async () => {
    await mountAt('#/')
    await click(buttonByText(/^🏜️Utah/))
    expect(location.hash).toBe('#/region/utah')
    expect(container.querySelector('h1')?.textContent).toContain('Utah')
    expect(buttonByText(/^🏜️Utah/)?.getAttribute('aria-pressed')).toBe('true')
    await click(buttonByText(/^🏔️Colorado/))
    expect(location.hash).toBe('#/')
    expect(text()).toContain('What are we')
  })

  it('reaches Utah from the Go further teaser', async () => {
    await mountAt('#/')
    await click(container.querySelector('.utah-teaser'))
    expect(location.hash).toBe('#/region/utah')
  })

  it('keeps the Today tab lit on Utah pages', async () => {
    await mountAt('#/region/utah')
    const today = [...container.querySelectorAll('.tabbar__btn')].find((b) => b.textContent?.includes('Today'))
    expect(today?.getAttribute('aria-current')).toBe('true')
    await navigate('#/dest/moab')
    expect(today?.getAttribute('aria-current')).toBe('true')
  })
})

describe('Utah region page', () => {
  it('lists every destination with Moab first as the flagship', async () => {
    await mountAt('#/region/utah')
    const cards = [...container.querySelectorAll('.dest-card')]
    expect(cards).toHaveLength(UTAH_DESTINATIONS.length)
    expect(cards[0].textContent).toContain('Moab')
    expect(cards[0].className).toContain('dest-card--flagship')
    expect(cards[0].textContent).toContain('🟢 → 🔴')
    expect(cards[0].textContent).toContain('Bronco Off-Roadeo')
    for (const d of UTAH_DESTINATIONS) expect(text()).toContain(d.name)
  })

  it('shows the rating legend, glossary and live-conditions links', async () => {
    await mountAt('#/region/utah')
    for (const label of ['Beginner', 'Intermediate', 'Advanced', 'Not rated']) {
      expect(text()).toContain(label)
    }
    expect(container.querySelector('details.glossary')).toBeTruthy()
    expect(text()).toContain('Slickrock')
    const links = [...container.querySelectorAll('a')].map((a) => a.getAttribute('href'))
    expect(links).toContain('https://udottraffic.utah.gov/')
    expect(links).toContain('https://utahfireinfo.gov/')
  })

  it('opens a destination from its card', async () => {
    await mountAt('#/region/utah')
    await click(container.querySelector('.dest-card'))
    expect(location.hash).toBe('#/dest/moab')
    expect(container.querySelector('h1')?.textContent).toBe('Moab')
  })

  it('handles an unknown region', async () => {
    await mountAt('#/region/atlantis')
    expect(text()).toContain('not in the app yet')
  })
})

describe('every Utah destination page', () => {
  for (const d of UTAH_DESTINATIONS) {
    it(`renders ${d.name} with the full planning structure`, async () => {
      await mountAt(`#/dest/${d.id}`)
      expect(container.querySelector('h1')?.textContent).toBe(d.name)
      const titles = sectionTitles().join(' | ')
      for (const s of ['Why go', 'Terrain', 'Vehicle', 'Camping', 'Fuel', 'Food', 'Adventure nearby', 'Conditions', 'Resources', 'Getting there']) {
        expect(titles, `${d.id} missing ${s}`).toContain(s)
      }
      expect(container.querySelectorAll('.route')).toHaveLength(d.routes.length)
      // Forecast failure is shown as a failure, never a stand-in forecast.
      expect(text()).toContain('Forecast unavailable')
      // Back goes to the region, not Home.
      await click(buttonByText('← Utah'))
      expect(location.hash).toBe('#/region/utah')
    })
  }

  it('says UNKNOWN for a drive nobody sourced', async () => {
    await mountAt('#/dest/paiute_trail')
    expect(text()).toContain('Drive from Durango: UNKNOWN')
  })

  it('handles an unknown destination', async () => {
    await mountAt('#/dest/nowhere')
    expect(text()).toContain('not in the app')
  })
})

describe('Moab: Bronco school to next adventure', () => {
  it('frames the school as a discovery path, not a qualification', async () => {
    await mountAt('#/dest/moab')
    expect(text()).toContain('Bronco Off-Roadeo → next adventure')
    expect(text()).toContain('You learned the basics.')
    expect(text()).toContain('Now where do you want to take the Ford Bronco?')
    expect(text()).toContain('not a qualification')
    const steps = [...container.querySelectorAll('.ladder__title')].map((h) => h.textContent)
    expect(steps).toEqual(['Start here', 'Build confidence', 'Bring your A-game'])
  })

  it('expands a route to show who rated it, the vehicle verdict and links', async () => {
    await mountAt('#/dest/moab')
    const head = buttonByText("Hell's Revenge")
    expect(head?.getAttribute('aria-expanded')).toBe('false')
    expect(text()).not.toContain('6 of 10')
    await click(head)
    expect(head?.getAttribute('aria-expanded')).toBe('true')
    expect(text()).toContain('6 of 10')
    expect(text()).toContain('Grand County')
    // Stock 4WD Bronco vs. an advanced route: flagged, never "safe".
    expect(text()).toContain('beyond the Ford Bronco')
    const hrefs = [...container.querySelectorAll('a')].map((a) => a.getAttribute('href') ?? '')
    expect(hrefs).toContain('https://www.blm.gov/visit/hells-revenge-trailhead')
    expect(hrefs.some((h) => h.startsWith('https://www.google.com/maps/search/'))).toBe(true)
    await click(head)
    expect(head?.getAttribute('aria-expanded')).toBe('false')
  })

  it('keeps one route open at a time', async () => {
    await mountAt('#/dest/moab')
    await click(buttonByText('Onion Creek'))
    await click(buttonByText('Fins & Things'))
    const open = [...container.querySelectorAll('.route__head[aria-expanded="true"]')]
    expect(open).toHaveLength(1)
    expect(open[0].textContent).toContain('Fins & Things')
    expect(text()).toContain('meets the minimum vehicle class')
  })

  it('shows UNKNOWN rather than a made-up distance', async () => {
    await mountAt('#/dest/moab')
    await click(buttonByText('Moab Rim'))
    expect(container.querySelector('#route-moab_rim')?.textContent).toContain('UNKNOWN')
  })
})

describe('vehicle is a profile setting, not a Bronco hard-code', () => {
  it('uses whatever rig the profile holds', async () => {
    localStorage.setItem(
      'retire.v1.profile',
      JSON.stringify({ rig: { name: 'Toyota 4Runner', rigClass: 'high_clearance' } }),
    )
    await mountAt('#/dest/moab')
    expect(text()).toContain('Now where do you want to take the Toyota 4Runner?')
    await click(buttonByText('Fins & Things'))
    expect(text()).toContain('beyond the Toyota 4Runner')
  })

  it('loads a profile saved before the rig existed', async () => {
    localStorage.setItem('retire.v1.profile', JSON.stringify({ paceMph: 2.5 }))
    await mountAt('#/dest/moab')
    expect(text()).toContain('Ford Bronco')
  })

  it('edits the rig from the Profile screen and persists it', async () => {
    await mountAt('#/profile')
    expect(text()).toContain('What you drive')
    await click(buttonByText('Built 4x4'))
    const saved = JSON.parse(localStorage.getItem('retire.v1.profile') ?? '{}')
    expect(saved.rig).toEqual({ name: 'Ford Bronco', rigClass: 'advanced_4wd' })
    await navigate('#/dest/moab')
    await click(buttonByText("Hell's Revenge"))
    expect(text()).toContain('meets the minimum vehicle class')
  })
})

describe('Durango screens still work', () => {
  it('renders an existing adventure detail', async () => {
    await mountAt('#/adventure/ice_lake_basin_day')
    expect(container.querySelector('h1')?.textContent).toBe('Ice Lake Basin')
    expect(text()).toContain('The day')
  })

  it('renders a mode results list', async () => {
    await mountAt('#/mode/fourwd')
    expect(text()).toContain(MODE_META.fourwd.label)
    expect(container.querySelectorAll('.card--tap').length).toBeGreaterThan(0)
  })

  it('renders the builder, saved, log and profile tabs', async () => {
    await mountAt('#/builder')
    for (const tab of ['#/trips', '#/log', '#/profile']) {
      await navigate(tab)
      expect(container.querySelector('main')?.textContent?.length).toBeGreaterThan(20)
    }
  })
})
