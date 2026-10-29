import { useId, type ReactNode } from 'react'
import type { Scene } from './scenes'

/*
 * Procedural landscapes, one per kind of country reTire covers. Flat dusk
 * layers in the San Juans' slate and iron-red and Utah's slickrock, so every
 * card reads as the same set of illustrations. Decorative only:
 * the card text carries the facts.
 */
const SKY: Record<Scene, [string, string, string]> = {
  alpine: ['#0e1c33', '#34496c', '#e3a27c'],
  basin: ['#0f1b30', '#2f4262', '#e6a77a'],
  pass: ['#101a28', '#33324a', '#ef9a5a'],
  mesa: ['#111b2b', '#30344a', '#e08b52'],
  valley: ['#121d2e', '#3a3448', '#f0a35e'],
  arch: ['#0f1a26', '#33324a', '#ef9a5a'],
  canyon: ['#101a28', '#2e3247', '#e48a50'],
  dunes: ['#121d2e', '#3a3448', '#f0a35e'],
}

/**
 * `sky` adds that many units of sky above the 400x200 scene, for frames
 * that carry text over the top. `rig` puts the Bronco on the road. Tall
 * frames keep the ground (`bottom`); thin strips (`middle`) centre on the
 * band between the peaks and the road.
 */
export function Landscape({
  scene,
  sky = 0,
  rig = false,
  align = 'bottom',
  className,
}: {
  scene: Scene
  sky?: number
  rig?: boolean
  align?: 'bottom' | 'middle'
  className?: string
}) {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '')
  const [top, mid, low] = SKY[scene]
  return (
    <svg
      className={className}
      viewBox={align === 'bottom' ? `0 ${-sky} 400 ${200 + sky}` : '0 18 400 200'}
      preserveAspectRatio={align === 'bottom' ? 'xMidYMax slice' : 'xMidYMid slice'}
      aria-hidden="true"
      focusable="false"
      data-scene={scene}
    >
      <defs>
        <linearGradient id={`${uid}sky`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={top} />
          <stop offset="0.55" stopColor={mid} />
          <stop offset="0.82" stopColor={low} />
        </linearGradient>
        <linearGradient id={`${uid}sand`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#c9824a" />
          <stop offset="1" stopColor="#7d3d22" />
        </linearGradient>
        <linearGradient id={`${uid}water`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3fa7a8" />
          <stop offset="1" stopColor="#1d5560" />
        </linearGradient>
      </defs>
      <rect x="0" y={-sky} width="400" height={200 + sky} fill={`url(#${uid}sky)`} />
      {SCENES[scene](uid)}
      {rig && <Bronco />}
    </svg>
  )
}

/** Snow caps for a peak at (x, y): a small jagged cap hanging off the summit. */
function cap(x: number, y: number, w = 12) {
  const h = w * 1.3
  return `M${x} ${y} L${x - w} ${y + h} L${x - w * 0.45} ${y + h * 0.8} L${x + w * 0.1} ${y + h * 1.25} L${x + w * 0.55} ${y + h * 0.75} L${x + w} ${y + h * 0.95}Z`
}

const SCENES: Record<Scene, (uid: string) => ReactNode> = {
  // The high San Juans: snowy ridgelines over a spruce valley and a dirt road.
  alpine: () => (
    <>
      <circle cx="292" cy="98" r="15" fill="#ffe2b8" opacity="0.8" />
      <path d="M0 132 L36 98 L66 114 L112 62 L150 106 L182 88 L222 120 L262 74 L300 104 L342 58 L382 98 L400 92 L400 200 L0 200Z" fill="#4b5a78" />
      <g fill="#dfe6ee" opacity="0.9">
        <path d={cap(112, 62)} />
        <path d={cap(262, 74, 10)} />
        <path d={cap(342, 58)} />
      </g>
      <path d="M0 150 L56 110 L96 132 L148 98 L196 140 L246 112 L296 142 L356 104 L400 128 L400 200 L0 200Z" fill="#8e3f2a" />
      <path d="M148 98 L196 140 L176 140 L160 118Z M356 104 L400 128 L400 136 L372 122Z" fill="#c4683a" opacity="0.5" />
      <path d="M0 168 Q100 156 200 164 T400 162 L400 200 L0 200Z" fill="#14231d" />
      <g fill="#0f1b17">
        {[6, 22, 40, 62, 84, 104, 228, 250, 272, 300, 326, 352, 378, 396].map((x, i) => (
          <path key={x} d={`M${x} ${170 - (i % 3) * 3} l7 -${16 + (i % 2) * 7} l7 ${16 + (i % 2) * 7}Z`} />
        ))}
      </g>
      <path d="M0 200 L0 184 Q200 176 400 186 L400 200Z" fill="#241310" />
      <path d="M0 189 Q200 180 400 190" fill="none" stroke="#c98b55" strokeWidth="2.5" opacity="0.45" />
    </>
  ),
  // A lake basin: Ice Lake, Crater Lake, Highland Mary.
  basin: (uid) => (
    <>
      <circle cx="120" cy="96" r="13" fill="#ffe2b8" opacity="0.8" />
      <path d="M0 120 L48 70 L84 96 L128 54 L170 92 L206 76 L248 110 L292 60 L336 92 L372 66 L400 84 L400 200 L0 200Z" fill="#4b5a78" />
      <g fill="#dfe6ee" opacity="0.9">
        <path d={cap(48, 70, 10)} />
        <path d={cap(128, 54, 13)} />
        <path d={cap(292, 60, 13)} />
        <path d={cap(372, 66, 9)} />
      </g>
      <path d="M0 146 L60 120 L130 132 L200 124 L270 134 L340 118 L400 130 L400 200 L0 200Z" fill="#26354a" />
      <path d="M70 152 Q200 136 330 152 Q300 166 200 168 Q100 166 70 152Z" fill={`url(#${uid}water)`} />
      <path d="M118 154 L166 154 M226 152 L286 152 M160 160 L240 160" stroke="#bfe8e4" strokeWidth="1.4" opacity="0.45" />
      <path d="M0 160 Q40 150 76 156 Q140 172 200 172 Q270 172 326 156 Q366 148 400 158 L400 200 L0 200Z" fill="#3f5b3a" />
      <g fill="#e9c46a" opacity="0.7">
        <circle cx="42" cy="170" r="1.6" />
        <circle cx="96" cy="176" r="1.4" />
        <circle cx="318" cy="172" r="1.6" />
        <circle cx="362" cy="166" r="1.3" />
        <circle cx="250" cy="178" r="1.4" />
      </g>
      <path d="M0 200 L0 186 Q200 178 400 188 L400 200Z" fill="#1c1a12" />
      <path d="M0 191 Q200 182 400 192" fill="none" stroke="#c98b55" strokeWidth="2.5" opacity="0.4" />
    </>
  ),
  // A 4WD pass: one iron-stained mountain, a shelf road switching back to the saddle.
  pass: () => (
    <>
      <circle cx="96" cy="92" r="15" fill="#ffd59a" opacity="0.85" />
      <path d="M0 120 L60 100 L120 112 L170 96 L230 108 L300 92 L360 104 L400 98 L400 200 L0 200Z" fill="#5a3442" />
      <path d="M120 176 L176 82 L214 62 L240 76 L262 70 L292 38 L332 84 L372 120 L400 132 L400 176Z" fill="#8e3f2a" />
      <path d="M262 70 L292 38 L304 54 L280 92Z M176 82 L214 62 L222 74 L190 104Z" fill="#c4683a" opacity="0.5" />
      <g fill="#dfe6ee" opacity="0.88">
        <path d={cap(292, 38, 12)} />
        <path d={cap(214, 62, 9)} />
      </g>
      <path d="M0 176 L0 140 L40 128 L90 136 L130 150 L160 176Z" fill="#6e2f20" />
      <path
        d="M150 174 L300 160 L190 146 L320 132 L214 120 L300 106 L240 92 L240 76"
        fill="none"
        stroke="#e9c46a"
        strokeWidth="2.2"
        strokeLinejoin="round"
        opacity="0.6"
      />
      <path d="M0 172 Q100 162 200 170 T400 166 L400 200 L0 200Z" fill="#3a1d14" />
      <path d="M0 200 L0 184 Q200 176 400 186 L400 200Z" fill="#241310" />
      <path d="M0 189 Q200 180 400 190" fill="none" stroke="#c98b55" strokeWidth="2.5" opacity="0.45" />
    </>
  ),
  // Mesa Verde country: layered mesas, a cliff alcove, a juniper road.
  mesa: () => (
    <>
      <circle cx="364" cy="94" r="18" fill="#ffd59a" opacity="0.88" />
      <path d="M0 120 L30 120 L36 104 L120 104 L128 120 L210 120 L216 96 L230 96 L236 120 L400 120 L400 200 L0 200Z" fill="#5a3a4a" />
      <path d="M0 152 L20 152 L28 126 L250 126 L262 152 L400 152 L400 200 L0 200Z" fill="#8e3f2a" />
      <path d="M28 126 L250 126 L252 132 L26 132Z" fill="#c4683a" />
      <path d="M96 136 Q130 128 168 136 L168 148 L96 148Z" fill="#3a1d14" />
      <g fill="#d59a62">
        <rect x="104" y="140" width="9" height="8" />
        <rect x="116" y="137" width="7" height="11" />
        <rect x="126" y="141" width="12" height="7" />
        <rect x="141" y="138" width="6" height="10" />
        <rect x="150" y="142" width="10" height="6" />
      </g>
      <g fill="#241310">
        <rect x="107" y="143" width="2" height="3" />
        <rect x="129" y="143" width="2" height="3" />
        <rect x="153" y="144" width="2" height="2.5" />
      </g>
      <path d="M0 200 L0 172 L120 166 L180 176 L230 172 L400 180 L400 200Z" fill="#2b1610" />
      <g fill="#3f5b3a">
        {[30, 58, 214, 268, 330, 372].map((x, i) => (
          <ellipse key={x} cx={x} cy={172 - (i % 2) * 3} rx="7" ry="4.5" />
        ))}
      </g>
      <path d="M0 200 L0 186 Q200 178 400 188 L400 200Z" fill="#241310" />
      <path d="M0 191 Q200 182 400 192" fill="none" stroke="#c98b55" strokeWidth="2.5" opacity="0.4" />
    </>
  ),
  // Home water: the Animas valley, red cliffs, gold aspens, the river.
  valley: () => (
    <>
      <circle cx="120" cy="112" r="22" fill="#ffd59a" opacity="0.9" />
      <path d="M0 118 L60 96 L110 112 L170 86 L230 108 L300 82 L360 102 L400 94 L400 200 L0 200Z" fill="#4b4566" />
      <path d="M220 150 L236 108 L292 100 L340 112 L400 104 L400 160Z" fill="#a84e2c" />
      <path d="M236 108 L292 100 L340 112 L400 104 L400 112 L340 120 L292 108 L240 116Z" fill="#c4683a" opacity="0.7" />
      <path d="M0 160 L0 128 Q60 118 120 132 Q170 142 220 136 L240 160Z" fill="#26354a" />
      <path d="M0 158 Q100 146 200 152 T400 150 L400 200 L0 200Z" fill="#2d3a24" />
      <path d="M150 200 Q190 176 214 166 Q246 156 300 156 L330 156 Q260 164 238 176 Q212 190 206 200Z" fill="#4f8d9c" opacity="0.85" />
      <g fill="#e9c46a">
        {[12, 32, 52, 76, 96, 320, 344, 366, 388].map((x, i) => (
          <ellipse key={x} cx={x} cy={160 - (i % 3) * 2} rx="6" ry="9" opacity={0.75 + (i % 2) * 0.2} />
        ))}
      </g>
      <g stroke="#eef2f4" strokeWidth="1" opacity="0.5">
        {[12, 32, 52, 76, 96, 320, 344, 366, 388].map((x, i) => (
          <path key={x} d={`M${x} ${168 - (i % 3) * 2} L${x} 178`} />
        ))}
      </g>
      <path d="M0 200 L0 184 Q200 176 400 186 L400 200Z" fill="#1a1c12" />
      <path d="M0 189 Q200 180 400 190" fill="none" stroke="#c98b55" strokeWidth="2.5" opacity="0.4" />
    </>
  ),
  // Utah: Moab's arches, the Swell's canyons, the dune fields.
  arch: () => (
    <>
      <circle cx="274" cy="122" r="19" fill="#ffd59a" opacity="0.9" />
      <path d="M0 128 L40 128 L46 117 L104 117 L110 128 L176 128 L182 112 L238 112 L244 126 L400 126 L400 200 L0 200Z" fill="#4a2f3d" />
      <path d="M0 150 Q100 138 200 146 T400 142 L400 200 L0 200Z" fill="#7a3424" />
      <path
        fillRule="evenodd"
        fill="#b9502c"
        d="M206 162 L210 104 Q216 62 270 58 Q330 56 340 106 L346 162 Z M232 162 L236 116 Q242 86 272 84 Q306 84 312 116 L316 162 Z"
      />
      <path d="M210 104 Q216 62 270 58 Q330 56 340 106" fill="none" stroke="#e98149" strokeWidth="3" opacity="0.65" />
      <path d="M316 162 L312 116 Q306 84 272 84 Q298 90 302 118 L305 162Z" fill="#7a3424" opacity="0.7" />
      <path d="M0 172 Q80 160 160 170 T320 166 T400 168 L400 200 L0 200Z" fill="#2b1610" />
      <path d="M0 182 Q200 172 400 182" fill="none" stroke="#c98b55" strokeWidth="3" opacity="0.45" />
    </>
  ),
  canyon: () => (
    <>
      <circle cx="205" cy="92" r="14" fill="#ffd59a" opacity="0.85" />
      <path d="M0 110 L140 110 L150 98 L250 98 L262 112 L400 112 L400 200 L0 200Z" fill="#5a3442" />
      <path d="M0 30 L52 34 L58 60 L96 66 L104 98 L138 108 L150 140 L176 160 L186 200 L0 200Z" fill="#8e3f2a" />
      <path d="M58 60 L96 66 L104 98 L138 108 L150 140 L176 160 L186 200 L170 200 L140 150 L120 118 L90 104 L80 72Z" fill="#c4683a" opacity="0.55" />
      <path d="M400 24 L344 30 L338 58 L300 64 L292 96 L258 106 L248 138 L224 158 L214 200 L400 200Z" fill="#6e2f20" />
      <path d="M0 96 L92 102 M0 132 L128 138 M400 92 L296 100 M400 128 L262 134" stroke="#5b2416" strokeWidth="2" opacity="0.6" />
      <path d="M150 200 Q190 170 200 150 Q210 170 250 200Z" fill="#3a1d14" />
      <g fill="#3f5b3a">
        <circle cx="186" cy="182" r="4" />
        <circle cx="214" cy="176" r="3.5" />
        <circle cx="196" cy="166" r="3" />
        <circle cx="222" cy="190" r="4.5" />
      </g>
      <path d="M182 200 Q196 182 200 166 Q204 154 200 146" fill="none" stroke="#e9c46a" strokeWidth="2.5" opacity="0.55" />
    </>
  ),
  dunes: (uid) => (
    <>
      <circle cx="120" cy="130" r="26" fill="#ffd59a" opacity="0.9" />
      <path d="M210 132 L254 102 L274 114 L300 90 L328 110 L352 98 L400 122 L400 132Z" fill="#6a5470" />
      <g fill="#e6dce8" opacity="0.75">
        <path d="M300 90 L292 98 L298 97 L302 101 L306 96Z" />
        <path d="M254 102 L247 108 L252 107 L256 110 L259 106Z" />
      </g>
      <rect x="0" y="130" width="400" height="70" fill={`url(#${uid}sand)`} />
      <path d="M196 130 L204 130 L256 200 L144 200Z" fill="#2b1a14" opacity="0.55" />
      <path d="M200 132 L200 200" stroke="#e9c46a" strokeWidth="1.6" strokeDasharray="5 6" opacity="0.7" />
      <path d="M0 172 Q40 140 90 160 Q124 138 168 164 L176 200 L0 200Z" fill="#a84e2c" />
      <path d="M8 168 Q44 148 86 164 M14 182 Q60 164 120 176" fill="none" stroke="#7d3520" strokeWidth="2" opacity="0.7" />
      <path d="M262 178 Q310 150 358 168 Q384 156 400 160 L400 200 L256 200Z" fill="#9a4528" />
    </>
  ),
}

/*
 * A sixth-generation Ford Bronco in profile, heading right: the flat roof
 * and near-upright windshield, three-pane greenhouse, short overhangs, round
 * headlamp and the spare hung off the tailgate. Drawn as a dusk silhouette
 * to sit in the same layered style as the country it drives through.
 */
function Bronco() {
  const ink = '#120a08'
  return (
    <g className="scene__rig">
      <g transform="translate(0 189) scale(1.85)">
        <g className="scene__dust" fill="#d59a62">
          <ellipse cx="-7" cy="-2" rx="5" ry="2.4" opacity="0.35" />
          <ellipse cx="-14" cy="-3.6" rx="6.5" ry="3" opacity="0.2" />
        </g>
        {/* Headlamp beam, low and faint. */}
        <path d="M23.6 -8.4 L38 -11 L38 -5.4Z" fill="#ffd59a" opacity="0.14" />
        {/* Tailgate spare. */}
        <circle cx="-0.6" cy="-8.6" r="3.3" fill={ink} />
        <circle cx="-0.6" cy="-8.6" r="1.4" fill="none" stroke="#4a3a34" strokeWidth="0.6" />
        {/* Body: tub, flat roof, upright screen, flat hood. */}
        <path
          d="M0.6 -15.8 Q0.6 -16.9 1.7 -16.9 L14.1 -16.9 L15.9 -10.7 L22.9 -10.5 Q23.9 -10.4 23.9 -9.4 L23.9 -5.4 L24.6 -4.6 L24.6 -3.6 L0.2 -3.6 L0.2 -4.8 L0.6 -5.2Z"
          fill={ink}
        />
        {/* Roof edge catching the last light. */}
        <path d="M1.7 -16.9 L14.1 -16.9 L15.9 -10.7 L22.9 -10.5" fill="none" stroke="#e98149" strokeWidth="0.55" opacity="0.7" />
        {/* Greenhouse: rear quarter, rear door, front door. */}
        <g fill="#5d6f86" opacity="0.75">
          <path d="M2 -15.8 L5.4 -15.8 L5.4 -11.3 L2 -11.3Z" />
          <path d="M6.3 -15.8 L9.7 -15.8 L9.7 -11.3 L6.3 -11.3Z" />
          <path d="M10.6 -15.8 L13.4 -15.8 L14.7 -11.3 L10.6 -11.3Z" />
        </g>
        {/* Mirror, taillamp, headlamp. */}
        <rect x="14.6" y="-12.1" width="1.6" height="1.1" rx="0.3" fill={ink} />
        <rect x="0.2" y="-11.8" width="0.7" height="2.4" fill="#f26d6d" opacity="0.9" />
        <circle cx="23.1" cy="-8.4" r="0.95" fill="#ffd59a" />
        {/* Fender flares and rock rail. */}
        <path d="M0.9 -5 Q1.2 -9.3 5 -9.3 Q8.8 -9.3 9.1 -5" fill="none" stroke="#2a1b16" strokeWidth="0.7" />
        <path d="M14.6 -5 Q14.9 -9.3 18.7 -9.3 Q22.5 -9.3 22.8 -5" fill="none" stroke="#2a1b16" strokeWidth="0.7" />
        <rect x="9.6" y="-4.6" width="4.6" height="0.8" rx="0.3" fill="#2a1b16" />
        {/* Big tyres, spoked wheels turning. */}
        {[5, 18.7].map((cx) => (
          <g key={cx}>
            <circle cx={cx} cy="-3.4" r="3.4" fill={ink} />
            <g className="scene__wheel">
              <circle cx={cx} cy="-3.4" r="1.6" fill="#3b2c26" />
              <path
                d={`M${cx} -5 L${cx} -1.8 M${cx - 1.6} -3.4 L${cx + 1.6} -3.4`}
                stroke={ink}
                strokeWidth="0.45"
              />
            </g>
          </g>
        ))}
      </g>
    </g>
  )
}
