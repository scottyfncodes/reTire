import type { Itinerary } from '../data/types'
import { buildGearList } from '../engine/gear'

export function GearChecklist({
  itinerary,
  packed,
  onToggle,
}: {
  itinerary: Itinerary
  packed: string[]
  onToggle: (id: string) => void
}) {
  const sections = buildGearList(itinerary)
  if (sections.length === 0) {
    return (
      <p className="tiny faint">
        Nothing on this plan needs a special kit list.
      </p>
    )
  }

  return (
    <div>
      {sections.map((section) => (
        <div key={section.title} style={{ marginBottom: 18 }}>
          <div className="eyebrow">{section.title}</div>
          <p className="tiny faint" style={{ margin: '2px 0 6px' }}>
            {section.reason}
          </p>
          <ul className="checklist">
            {section.items.map((item) => {
              const id = `${section.title}:${item.id}`
              const done = packed.includes(id)
              return (
                <li key={id} data-done={done}>
                  <input
                    type="checkbox"
                    checked={done}
                    onChange={() => onToggle(id)}
                    aria-label={item.label}
                  />
                  <span>
                    {item.label}
                    {item.note && (
                      <span className="faint tiny"> — {item.note}</span>
                    )}
                  </span>
                </li>
              )
            })}
          </ul>
        </div>
      ))}
    </div>
  )
}
