/** The RayTire mark: a tyre with a San Juan ridgeline in the rim. */
export function Mark({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 64 64" aria-hidden="true" focusable="false">
      <circle cx="32" cy="32" r="29" fill="#151a1f" stroke="#fb923c" strokeWidth="4" />
      <path
        d="M14 40l10-13 6 7 5-6 15 12"
        fill="none"
        stroke="#fb923c"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M19 47h26" stroke="#e9c46a" strokeWidth="4" strokeLinecap="round" />
    </svg>
  )
}
