export const CLINIC_NAME = "Clinic Assistant"

export const SUGGESTIONS = [
  "Book an appointment",
  "When is my next appointment?",
  "Is my insurance accepted?",
  "Which doctors do you have?",
]

// What the assistant says when it pauses for the front desk. The backend doesn't
// save it, so we show it again when a waiting chat is opened.
export const FRONT_DESK_REPLY =
  "I've sent this to the front desk for a quick check. I'll reply here as soon as they answer."

// How often we ask the backend if the front desk has answered (or for new requests).
export const POLL_MS = 2000

// The clinic's timezone. Appointment times are shown in it.
export const CLINIC_TIMEZONE = "America/Los_Angeles"
