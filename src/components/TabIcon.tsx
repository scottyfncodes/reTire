/**
 * Hand-drawn tab marks, one per section, in the same 1.6px line weight. Kept
 * to the six tabs on purpose: everywhere else the words carry the meaning.
 */
const PATHS: Record<string, string> = {
  // Two peaks with a snowline: the day planner.
  today: 'M2 19 L8.5 8 L12 13.5 L15 9 L22 19 Z M6.6 11.3 L8.5 12.6 L10.4 11.3',
  // A boxy two-door in profile, square roof and big tyres.
  bronco:
    'M3 15.5 V10.5 L5 7 H15 V10.5 H19.5 L21 12.5 V15.5 H3 M6.5 17.5 a1.9 1.9 0 1 0 0.01 0 M17 17.5 a1.9 1.9 0 1 0 0.01 0 M9.5 7 V10.5',
  // A route traced between two waypoints.
  builder: 'M5 19 a2 2 0 1 0 0.01 0 M19 5 a2 2 0 1 0 0.01 0 M6.5 17.5 C10 15 7 11 12 10.5 S15 8 17.5 6.5',
  // A trailhead flag on its post.
  trips: 'M6 21 V3.5 M6 4.5 H17 L14.5 8 L17 11.5 H6',
  // A bound field notebook.
  log: 'M6 3.5 H18 V20.5 H6 Z M9 3.5 V20.5 M11.5 8 H15.5 M11.5 11.5 H15.5',
  // Two dials on sliders: the profile.
  profile: 'M4 7.5 H20 M4 16.5 H20 M9 5.5 V9.5 M15 14.5 V18.5',
}

export function TabIcon({ name }: { name: string }) {
  return (
    <svg
      className="tabbar__icon"
      viewBox="0 0 24 24"
      width="22"
      height="22"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d={PATHS[name]} />
    </svg>
  )
}
