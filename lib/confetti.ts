import confetti from "canvas-confetti"

export function celebrate() {
  const defaults = {
    startVelocity: 28,
    spread: 360,
    ticks: 70,
    gravity: 0.9,
    origin: { y: 0.65 },
    colors: ["#E85D4C", "#F4C27A", "#7EB6FF", "#8FDE9A", "#E8A0D4"],
  }
  confetti({ ...defaults, particleCount: 50, scalar: 0.9 })
  confetti({ ...defaults, particleCount: 30, scalar: 1.2 })
}
