import type { EventCategory } from "@/lib/types"

export const CATEGORIES: {
  id: EventCategory
  label: string
  colorVar: string
}[] = [
  { id: "class", label: "Class", colorVar: "--cat-class" },
  { id: "assignment", label: "Assignment", colorVar: "--cat-assignment" },
  { id: "exam", label: "Exam", colorVar: "--cat-exam" },
  { id: "social", label: "Social", colorVar: "--cat-social" },
  { id: "club", label: "Club / Org", colorVar: "--cat-club" },
  { id: "personal", label: "Personal", colorVar: "--cat-personal" },
]

export const CATEGORY_LABEL: Record<EventCategory, string> = {
  class: "Class",
  assignment: "Assignment",
  exam: "Exam",
  social: "Social",
  club: "Club / Org",
  personal: "Personal",
}

export function categoryColor(category: EventCategory) {
  return `var(--cat-${category})`
}

export function mapExtractedType(
  type: string | null | undefined
): EventCategory {
  switch (type) {
    case "assignment":
    case "exam":
    case "class":
    case "social":
    case "club":
      return type
    case "other":
    default:
      return "personal"
  }
}
