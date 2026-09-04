import { youtubeEmbedSrc, youtubeIdFromUrl } from "@/lib/patients/youtube"
import { cn } from "@/lib/utils"

export function VideoPreview({
  url,
  title,
  fill = false,
}: {
  url: string | null
  title: string
  /** Umple un container `relative aspect-video` părinte (carduri grid). */
  fill?: boolean
}) {
  const frameClass = fill
    ? "absolute inset-0 h-full w-full border-0"
    : "aspect-video h-auto w-full border-0"
  const mediaClass = fill
    ? "absolute inset-0 h-full w-full bg-black object-cover"
    : "aspect-video h-auto w-full bg-black object-cover"
  const placeholderClass = cn(
    "flex items-center justify-center bg-slate-100 text-sm text-slate-500",
    fill ? "absolute inset-0 h-full w-full" : "aspect-video w-full",
  )

  if (!url) {
    return <div className={placeholderClass}>Fără video</div>
  }

  const lower = url.toLowerCase()
  if (lower.includes(".mp4") || lower.startsWith("blob:") || lower.startsWith("data:video")) {
    return (
      <video controls playsInline preload="metadata" className={mediaClass} title={title}>
        <source src={url} />
      </video>
    )
  }

  const youtubeId = youtubeIdFromUrl(url)
  if (youtubeId) {
    return (
      <iframe
        src={youtubeEmbedSrc(youtubeId)}
        title={title}
        loading="lazy"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
        allowFullScreen
        className={frameClass}
      />
    )
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className={cn(
        placeholderClass,
        "font-medium text-[#042f2e] underline-offset-4 hover:underline",
      )}
    >
      Deschide video
    </a>
  )
}
