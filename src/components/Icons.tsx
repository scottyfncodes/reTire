import type { SVGProps } from 'react'

/** Line icons drawn for reTire. 24px grid, 2px stroke, currentColor. */
type P = SVGProps<SVGSVGElement>

const base = (props: P) => ({
  width: 24,
  height: 24,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
  ...props,
})

export const IconPeak = (p: P) => (
  <svg {...base(p)}><path d="M3 20l6.5-11 3.5 5.5 2.5-3.5L21 20z" /><path d="M8 11.5l1.5 1.5 1.5-1.5" /></svg>
)
export const IconMap = (p: P) => (
  <svg {...base(p)}><path d="M9 4L3 6v14l6-2 6 2 6-2V4l-6 2z" /><path d="M9 4v14M15 6v14" /></svg>
)
export const IconPin = (p: P) => (
  <svg {...base(p)}><path d="M12 21s7-6.2 7-11.5A7 7 0 005 9.5C5 14.8 12 21 12 21z" /><circle cx="12" cy="9.5" r="2.5" /></svg>
)
export const IconBook = (p: P) => (
  <svg {...base(p)}><path d="M5 4h11a3 3 0 013 3v13H8a3 3 0 01-3-3z" /><path d="M5 17a3 3 0 013-3h11" /><path d="M9 8h6" /></svg>
)
export const IconUser = (p: P) => (
  <svg {...base(p)}><circle cx="12" cy="8" r="4" /><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" /></svg>
)
export const IconChevron = (p: P) => (
  <svg {...base(p)}><path d="M9 6l6 6-6 6" /></svg>
)

/** The reTire mark: a tyre with a San Juan ridgeline in the rim. */
export function ReTireMark({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 64 64" aria-hidden="true">
      <circle cx="32" cy="32" r="29" fill="#151a1f" stroke="#fb923c" strokeWidth="4" />
      <path d="M14 40l10-13 6 7 5-6 15 12" fill="none" stroke="#fb923c" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M19 47h26" stroke="#e9c46a" strokeWidth="4" strokeLinecap="round" />
    </svg>
  )
}
