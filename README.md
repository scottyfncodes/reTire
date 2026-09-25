# RayTire

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
  phone number. Every business carries an explicit `status`
  (`active`/`seasonal`/`temporarily_closed`/`permanently_closed`/`unknown`),
  and only `active` businesses are ever offered as a recommendation — a
  general rule, not a one-off special case. (Avalanche Brewing in Silverton is
  the example that motivated it — it was the obvious beer stop on half these
  routes, shut in 2025, and stays in the dataset as `permanently_closed` so
  the recommender can never resurrect it.)
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

## 🚙 Bronco

A dedicated tab covers the Bronco Sasquatch as a field companion, not an
owner's-manual dump: a quick-reference dashboard (ground clearance, approach/
departure/breakover angle, water fording, tire size, fuel capacity), G.O.A.T.
Modes explained in plain language, an off-road cheat sheet, tire and recovery
guidance, a roof-tent checklist, and an interactive pre-adventure checklist.
Every figure is Ford's own, cited in `src/data/bronco.ts`; anything that
varies by body style, trim or engine says so instead of picking one number.
Every adventure's detail page carries a **Bronco check** built from the
route's own sourced data — vehicle capability is compared against the
route's stated requirement, but current road condition is always a separate
"VERIFY" call, never something this app asserts on the vehicle's behalf.

Adventures are described by **depth** (Quick Outing → Expedition) rather than a
beginner/advanced label, with the actual numbers alongside. The label
summarises; the numbers explain.

## Utah

The second region. Colorado stays exactly what it was — the Durango day-trip
planner on the home screen — and a Colorado ⇄ Utah switch at the top leads to
**Utah**: eight destinations you drive to and explore from, with **Moab** as
the flagship.

| Destination | What it is |
| --- | --- |
| 🏜️ Moab | Slickrock from 🟢 Onion Creek to 🔴 Moab Rim, plus the Bronco school → next adventure ladder |
| 🌅 Sand Hollow & Hurricane | State-park dunes and the BLM Sand Mountain OHV area |
| 🪨 San Rafael Swell | Wedge Overlook / Buckhorn Draw backway, Temple Mountain mining roads |
| 🌲 Paiute Trail System | A 275-mile main loop and 1,000+ miles of side trail; width limits |
| 🌳 White Wash Sand Dunes | Fenced dunes with cottonwoods, south of Green River |
| 🏖️ Little Sahara | 63,000 acres of dunes and Sand Mountain |
| 🌄 Kanab & Grand Staircase | Cottonwood Canyon Road, Coral Pink Sand Dunes |
| 🦕 Vernal & Dinosaur | Red Cloud Loop, Red Mountain OHV trail |

Routes use a three-step scale — 🟢 Beginner, 🟡 Intermediate, 🔴 Advanced —
plus an explicit ⚪ **Not rated** for anything nobody credible rates (dunes,
mostly). A colour is only allowed on a route that cites someone's published
rating, and the rating, who published it and why the route sits where it does
are shown together. Where sources disagree the harder reading wins.

Vehicle suitability is about the vehicle, not the brand. The profile holds a
rig (name + class: standard SUV → high clearance → 4WD → lockers + big tires →
OHV); the Sasquatch Bronco is only the default. Each route compares its listed minimum with the
rig and at best says *meets the minimum* — never *safe*.

Utah data lives in `src/data/utah.ts` and `src/data/regions.ts`; the logic in
`src/engine/offroad.ts`. A new destination is a data entry, not a new screen.

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
information, the businesses' own sites and area tourism/chamber listings, Ford
(for the Bronco Sasquatch specifications), and — clearly labelled as such —
community trail and owner-forum data where nothing official publishes a
figure. Weather comes from [Open-Meteo](https://open-meteo.com/),
elevation-corrected so a forecast for a 12,000 ft basin is not silently the
forecast for the valley floor.

Sources are listed in `src/data/sources.ts` and a test asserts that every
record cites one that exists.

## Development

```bash
npm install
npm run dev      # local dev server
npm test         # 272 tests
npm run build    # production build to dist/
```

Tests cover itinerary generation, time arithmetic, drive and hike durations,
return-home calculations, filtering, weather parsing, route requirements,
camping constraints, food integration, business status/recommendation rules,
Bronco data provenance and route-context logic, saved adventures, offline
state, malformed and missing data, and dataset integrity — plus Utah data
honesty, the off-road engine, and real-DOM tests of the Utah screens and
navigation (`src/screens/utah.ui.test.tsx`, jsdom).

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

The app was renamed from reTire to RayTire. Data saved under the old
`retire.v1.` storage prefix is moved to `raytire.v1.` on first launch, so an
installed copy keeps its trips, log and profile across the rename.
