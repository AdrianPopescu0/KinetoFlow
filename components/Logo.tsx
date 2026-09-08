import { useId } from "react"

import { cn } from "@/lib/utils"

export type LogoSize = "sm" | "md" | "lg"

export type LogoProps = {
  size?: LogoSize
  showText?: boolean
  className?: string
  /** Use on teal / dark headers so the wordmark stays readable. */
  variant?: "default" | "onDark"
}

const sizeClass: Record<LogoSize, { icon: string; text: string; gap: string }> = {
  sm: { icon: "size-6", text: "text-sm", gap: "gap-1.5" },
  md: { icon: "size-8", text: "text-base", gap: "gap-2" },
  lg: { icon: "size-10", text: "text-xl", gap: "gap-2.5" },
}

export function Logo({
  size = "md",
  showText = true,
  className,
  variant = "default",
}: LogoProps) {
  const scale = sizeClass[size]
  const onDark = variant === "onDark"

  return (
    <span
      className={cn(
        "inline-flex items-center font-sans tracking-tight",
        scale.gap,
        scale.text,
        onDark ? "text-white" : "text-slate-900",
        className,
      )}
    >
      <KineticMark
        className={cn("shrink-0", scale.icon)}
        variant={variant}
        decorative={showText}
      />
      {showText ? (
        <span className="leading-none">
          <span className="font-normal" style={{ fontWeight: 400 }}>
            Kineto
          </span>
          <span className="font-bold" style={{ fontWeight: 700 }}>
            Flow
          </span>
        </span>
      ) : null}
    </span>
  )
}

export function KineticMark({
  className,
  variant = "default",
  decorative = true,
}: {
  className?: string
  variant?: "default" | "onDark"
  decorative?: boolean
}) {
  const reactId = useId().replace(/:/g, "")
  const gradientId = `kf-mark-${reactId}`
  const onDark = variant === "onDark"
  const arc = onDark ? "#2DD4BF" : "#14B8A6"

  return (
    <svg
      viewBox="0 0 32 32"
      className={className}
      fill="none"
      aria-hidden={decorative ? true : undefined}
      role={decorative ? undefined : "img"}
      aria-label={decorative ? undefined : "KinetoFlow"}
    >
      <defs>
        <linearGradient id={gradientId} x1="12" y1="26" x2="26" y2="8" gradientUnits="userSpaceOnUse">
          <stop stopColor={onDark ? "#2DD4BF" : "#14B8A6"} />
          <stop offset="1" stopColor={onDark ? "#99F6E4" : "#5EEAD4"} />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="8" fill={onDark ? "rgba(255,255,255,0.12)" : "#042f2e"} />
      <path
        d="M19.4 25.8C12.1 25.2 7.1 19.4 7.6 12.8C8 7.8 12.2 4.8 17.2 5.6"
        stroke={arc}
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <circle cx="18.35" cy="11.35" r="2.4" fill={`url(#${gradientId})`} />
      <path
        d="M17.85 13.85c-1.7 2.55-2.55 5.15-1.15 8.55.85 2.05 1.45 2.95.95 3.55"
        stroke={`url(#${gradientId})`}
        strokeWidth="2.45"
        strokeLinecap="round"
      />
      <path
        d="M18.7 15.15c2.55.15 5.15-1.55 7.35-4.55"
        stroke={`url(#${gradientId})`}
        strokeWidth="2.45"
        strokeLinecap="round"
      />
    </svg>
  )
}
