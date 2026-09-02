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
      <KineticWaveMark
        className={cn("shrink-0", scale.icon)}
        variant={variant}
        decorative={showText}
      />
      {showText ? (
        <span className="leading-none">
          <span className="font-medium">Kineto</span>
          <span className="font-bold">Flow</span>
        </span>
      ) : null}
    </span>
  )
}

export function KineticWaveMark({
  className,
  variant = "default",
  decorative = true,
}: {
  className?: string
  variant?: "default" | "onDark"
  decorative?: boolean
}) {
  const reactId = useId().replace(/:/g, "")
  const gradientId = `kf-wave-${reactId}`
  const onDark = variant === "onDark"

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
        <linearGradient id={gradientId} x1="7" y1="24" x2="25" y2="8" gradientUnits="userSpaceOnUse">
          <stop stopColor={onDark ? "#2DD4BF" : "#0D9488"} />
          <stop offset="1" stopColor={onDark ? "#5EEAD4" : "#14B8A6"} />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="8" fill={onDark ? "rgba(255,255,255,0.12)" : "#0F172A"} />
      <path
        d="M7.2 22.8C10.2 12.4 14 12.2 16 16c2 3.8 5.6 4 8.8-6.4"
        stroke={`url(#${gradientId})`}
        strokeWidth="2.15"
        strokeLinecap="round"
      />
      <path
        d="M8.7 23.6C11.6 13.6 14.6 13.4 16.3 16.2c1.8 3.4 5.2 3.6 8.2-5.6"
        stroke={`url(#${gradientId})`}
        strokeWidth="2.15"
        strokeLinecap="round"
        opacity="0.78"
      />
      <path
        d="M10.2 24.2C12.8 14.8 15.2 14.6 16.6 16.4c1.6 3 4.6 3.2 7.4-4.8"
        stroke={`url(#${gradientId})`}
        strokeWidth="2.15"
        strokeLinecap="round"
        opacity="0.55"
      />
    </svg>
  )
}
