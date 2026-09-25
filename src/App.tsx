import { StoreProvider } from './state/store'
import { useRoute } from './state/useRoute'
import { Home } from './screens/Home'
import { Results } from './screens/Results'
import { Detail } from './screens/Detail'
import { Builder } from './screens/Builder'
import { Trips } from './screens/Trips'
import { LogScreen } from './screens/LogScreen'
import { ProfileScreen } from './screens/ProfileScreen'
import { RegionScreen } from './screens/Region'
import { DestinationScreen } from './screens/Destination'
import { useStore } from './state/store'

const TABS = [
  { path: '', glyph: '🏔️', label: 'Today', match: ['home', 'mode', 'adventure', 'region', 'destination'] },
  { path: 'builder', glyph: '🗺️', label: 'Build', match: ['builder'] },
  { path: 'trips', glyph: '📌', label: 'Saved', match: ['trips', 'trip'] },
  { path: 'log', glyph: '📓', label: 'Log', match: ['log'] },
  { path: 'profile', glyph: '⚙️', label: 'Profile', match: ['profile'] },
]

function Screens() {
  const [route, go] = useRoute()
  const { trips } = useStore()

  let screen
  switch (route.name) {
    case 'mode':
      screen = <Results mode={route.mode} go={go} />
      break
    case 'adventure':
      screen = <Detail id={route.id} go={go} />
      break
    case 'trip': {
      const trip = trips.find((t) => t.id === route.id)
      screen = trip ? (
        <Detail id={trip.adventureId} tripId={trip.id} go={go} />
      ) : (
        <Trips go={go} />
      )
      break
    }
    case 'builder':
      screen = <Builder go={go} />
      break
    case 'trips':
      screen = <Trips go={go} />
      break
    case 'log':
      screen = <LogScreen go={go} />
      break
    case 'profile':
      screen = <ProfileScreen go={go} />
      break
    case 'region':
      screen = <RegionScreen id={route.id} go={go} />
      break
    case 'destination':
      screen = <DestinationScreen id={route.id} go={go} />
      break
    default:
      screen = <Home go={go} />
  }

  return (
    <>
      <main className="shell">{screen}</main>
      <nav className="tabbar" aria-label="Sections">
        {TABS.map((tab) => (
          <button
            key={tab.path}
            type="button"
            className="tabbar__btn"
            aria-current={tab.match.includes(route.name)}
            onClick={() => go(tab.path)}
          >
            <span className="tabbar__glyph" aria-hidden="true">
              {tab.glyph}
            </span>
            {tab.label}
          </button>
        ))}
      </nav>
    </>
  )
}

export default function App() {
  return (
    <StoreProvider>
      <Screens />
    </StoreProvider>
  )
}
