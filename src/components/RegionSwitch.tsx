import { REGIONS, regionCount } from '../data/regions'

/**
 * Colorado ⇄ Utah. One row, two thumbs' worth of targets, no extra layer of
 * navigation: Colorado is the home screen, Utah is its own page.
 */
export function RegionSwitch({
  current,
  go,
}: {
  current: string
  go: (path: string) => void
}) {
  return (
    <nav className="region-switch" aria-label="Region">
      {REGIONS.map((region) => (
        <button
          key={region.id}
          type="button"
          className="region-switch__btn"
          aria-pressed={region.id === current}
          onClick={() => go(region.home ? '' : `region/${region.id}`)}
        >
          <span className="region-switch__glyph" aria-hidden="true">
            {region.emoji}
          </span>
          <span>
            <span className="region-switch__name">{region.name}</span>
            <span className="region-switch__count">
              {regionCount(region.id)} {region.home ? 'day trips' : 'destinations'}
            </span>
          </span>
        </button>
      ))}
    </nav>
  )
}
