import type { Adventure, Itinerary, VehicleRequirement } from '../data/types'
import { meetsVehicle, ROAD_CLASS_LABEL, VEHICLE_LABEL } from './drive'

/**
 * The Bronco Sasquatch's structural capability class -- part-time 4WD with a
 * low-range transfer case and locking differentials. This is a capability
 * comparison, not a condition report: it says whether the truck's drivetrain
 * class meets the route's stated requirement, never whether the road is
 * actually open, dry or clear today. Those are different questions, and this
 * app does not conflate them.
 */
export const BRONCO_CAPABILITY: VehicleRequirement = 'four_wd_low_range'

export interface BroncoRouteContext {
  requirement: VehicleRequirement
  requirementLabel: string
  highClearanceRelevant: boolean
  fourWdRelevant: boolean
  /** null when the route's own requirement is itself unknown -- there is nothing to compare against. */
  meetsStatedRequirement: boolean | null
  roadClasses: string[]
  /** Sourced hazards/considerations already on the adventure -- no separate database. */
  considerations: string[]
}

/**
 * Builds the "Bronco check" shown on an adventure's detail page, entirely
 * from data the app already has (the adventure's own road segments, hazards
 * and the itinerary's resolved vehicle requirement). It never invents a new
 * fact about the route, and it never asserts that the truck can currently do
 * a route -- only whether its capability class meets the stated requirement.
 */
export function broncoRouteContext(
  adventure: Adventure,
  itinerary: Itinerary,
): BroncoRouteContext {
  const requirement = itinerary.vehicle
  const meetsStatedRequirement =
    requirement === 'unknown' ? null : meetsVehicle(BRONCO_CAPABILITY, requirement)

  const roadClasses = Array.from(
    new Set(adventure.outbound.map((s) => ROAD_CLASS_LABEL[s.roadClass])),
  )

  return {
    requirement,
    requirementLabel: VEHICLE_LABEL[requirement],
    highClearanceRelevant: requirement !== 'any_vehicle',
    fourWdRelevant: requirement === 'four_wd' || requirement === 'four_wd_low_range',
    meetsStatedRequirement,
    roadClasses,
    considerations: adventure.hazards,
  }
}
