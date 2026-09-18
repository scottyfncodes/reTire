# reTire

**Retirement, with a lot more altitude.**

A personal adventure-planning PWA for getting out of Durango, Colorado. It is
not a trail database and it is not trying to replace Google Maps, AllTrails or
Gaia. It answers one question:

> What are we actually doing today?

…and then turns the answer into a real day — drive, explore, hike, refuel,
camp or home — with the times, the road requirements and the weather attached.

## The rule that shapes everything

**Never invent anything.**

Every physical measurement in the data layer is a `Measure`, which is one of
three things:

| Value | Meaning | Renders as |
| --- | --- | --- |
| `7.4` | A single sourced figure | `7.4 mi` |
| `{ min: 7.4, max: 8.5 }` | Reputable sources genuinely disagree | `7.4–8.5 mi` |
| `null` | Nobody credible said | `UNKNOWN` |

Ranges are not hedging. Published trail mileage really does vary between
sources, and picking the flattering end of that spread is a small lie that
compounds into a benighted party. So the spread is shown.

The same rule runs through the rest of the app:

- Every record carries **source ids and a last-checked date**, rendered next to
  the numbers rather than buried in a footer.
- **Brewery hours are not stored as fact.** They change constantly and a stale
  hour is a wasted drive, so they are a labelled note with a check date and a
  phone number. A business known to have closed stays in the dataset with a
  closure reason so the recommender can never resurrect it. (Avalanche Brewing
  in Silverton is the live example — it is the obvious beer stop on half these
  routes, and it shut in 2025.)
- **Unmeasured road legs are counted and reported.** If a leg has no sourced
  distance, the totals are labelled floors rather than being quietly
  under-reported.
- **Camping legality is never asserted.** Appearing here does not make a spot
  legal; the signs at the road junction and the current fire restrictions are
  the authority, and the app says so.
- **Weather is an input, not a verdict.** The app shows the forecast and lets
  you decide. It never calls a day perfect.
- **Navigation stops at the trailhead.** The app hands off to a maps app for
  the drive and explicitly refuses to pretend it can navigate the backcountry,
  where there is no cell service anyway.

## Modes

🏔️ Big Day · 🚙 4WD Mission · 🗺️ Day Trip · ⛺ Overnighter · 🏚️ Explorer ·
🍺 Full Send · 🎲 Dealer's Choice

Plus a **day-trip builder** that returns three genuinely different shapes of
day — historic high country, a Bronco day, and a big-legs day — rather than
three variations on one.

Adventures are described by **depth** (Quick Outing → Expedition) rather than a
beginner/advanced label, with the actual numbers alongside. The label
summarises; the numbers explain.

## Architecture

```
src/
  data/       datasets + types. Sourced, typed, with UNKNOWN as a first-class value
  engine/     pure logic: time, drive model, hike model, itinerary, depth,
              season, scoring, gear, memo. No React, no I/O, fully tested
  services/   weather (Open-Meteo), localStorage persistence, saved trips
  state/      React context, hash router, weather hook
  components/ cards, timeline, weather panel, memo, checklist
  screens/    home, results, detail, builder, saved, log, profile
```

The split matters: **data acquisition is separate from presentation**, and the
engine is pure functions so the parts that can be wrong about time, distance or
access are the parts under test.

### Estimates vs. facts

Durations are a **disclosed model**, and the UI marks them `est.`:

- **Driving** — average speed by road class (paved highway 55 mph down to
  technical 4WD 6 mph). A *sourced* travel time always beats the model; the
  Mesa Verde entrance road is 22 miles and 45 minutes, and no generic mph
  figure gets that right.
- **Hiking** — your own flat-ground pace from the profile, plus 30 min per
  1,000 ft of ascent, plus a thin-air penalty above 10,000 ft, plus a break
  allowance.

## Data sources

USFS (San Juan National Forest), BLM, National Park Service, CDOT / COtrip,
Recreation.gov, San Juan Mountains Association, Durango Trails, county road
information, the businesses' own sites, and — clearly labelled as such —
community trail data where nothing official publishes a figure. Weather comes
from [Open-Meteo](https://open-meteo.com/), elevation-corrected so a forecast
for a 12,000 ft basin is not silently the forecast for the valley floor.

Sources are listed in `src/data/sources.ts` and a test asserts that every
record cites one that exists.

## Development

```bash
npm install
npm run dev      # local dev server
npm test         # 167 tests
npm run build    # production build to dist/
```

Tests cover itinerary generation, time arithmetic, drive and hike durations,
return-home calculations, filtering, weather parsing, route requirements,
camping constraints, food integration, saved adventures, offline state,
malformed and missing data, and dataset integrity.

## Deployment

Pushed to GitHub Pages by `.github/workflows/deploy.yml`. The deploy is gated
on the tests, not just on the build succeeding — a plan that is confidently
wrong about when you get home is worse than no plan.

The repository's `github-pages` environment carries a deployment branch policy
naming `main`, and the Pages source is `main`, so the publishing branch has to
be `main`. A deployment from any other branch is rejected before a runner picks
it up, which shows as a `deploy` job that fails in about two seconds with no
logs at all. If that happens, the branch policy is the thing to look at:

```
gh api repos/OWNER/REPO/environments/github-pages/deployment-branch-policies
```

## Offline

A saved adventure keeps its full itinerary, coordinates, route summary, road
requirements, hike and campsite detail, hazards and packing list with no
signal. Live weather, current closures, navigation and brewery hours need the
network, and the app names exactly which is which rather than showing stale
data as current.
