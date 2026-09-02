export type MonthPalette = {
  bg: string
  ink: string
}

/** High-contrast retro pairings inspired by analog wall calendars. */
export const MONTH_PALETTES: MonthPalette[] = [
  { bg: "#E8C547", ink: "#1F4D3A" },
  { bg: "#F4EFE4", ink: "#2F6BFF" },
  { bg: "#E67A28", ink: "#1F4D3A" },
  { bg: "#F4EFE4", ink: "#C62828" },
  { bg: "#C62828", ink: "#F7F2E8" },
  { bg: "#1F4D3A", ink: "#E8C547" },
  { bg: "#F3A6C2", ink: "#1F4D3A" },
  { bg: "#8EC8E6", ink: "#1F4D3A" },
  { bg: "#E67A28", ink: "#F7F2E8" },
  { bg: "#1F4D3A", ink: "#F3A6C2" },
  { bg: "#C62828", ink: "#F4EFE4" },
  { bg: "#F3A6C2", ink: "#C62828" },
]

/** Tossed-in-a-basket layout: left/top %, rotation, scale, stacking. */
export const BASKET_SCATTER = [
  { left: "4%", top: "6%", rotate: -14, z: 3, scale: 1.02 },
  { left: "28%", top: "0%", rotate: 9, z: 2, scale: 0.94 },
  { left: "51%", top: "5%", rotate: -7, z: 4, scale: 1.06 },
  { left: "72%", top: "11%", rotate: 16, z: 1, scale: 0.9 },
  { left: "-2%", top: "32%", rotate: 11, z: 6, scale: 1 },
  { left: "22%", top: "26%", rotate: -18, z: 8, scale: 1.1 },
  { left: "48%", top: "30%", rotate: 6, z: 5, scale: 0.96 },
  { left: "70%", top: "38%", rotate: -10, z: 7, scale: 1.04 },
  { left: "6%", top: "56%", rotate: -8, z: 4, scale: 0.92 },
  { left: "30%", top: "52%", rotate: 13, z: 9, scale: 1.08 },
  { left: "55%", top: "58%", rotate: -15, z: 6, scale: 0.98 },
  { left: "74%", top: "64%", rotate: 8, z: 3, scale: 1.02 },
] as const

export const MONTH_ABBR = [
  "JAN",
  "FEB",
  "MAR",
  "APR",
  "MAY",
  "JUN",
  "JUL",
  "AUG",
  "SEP",
  "OCT",
  "NOV",
  "DEC",
] as const
