export const EventTypes = {
  PARTY: "party",
  INTEGRATION: "integration",
  TRIP: "trip",
  LECTURE: "lecture",
  SPORT: "sport",
  COURSE: "course",
  HACKATHON: "hackathon",
  FAIR: "fair",
} as const;

export type EventType = (typeof EventTypes)[keyof typeof EventTypes];

export const ALLOWED_EVENT_TYPES = Object.values(EventTypes);
