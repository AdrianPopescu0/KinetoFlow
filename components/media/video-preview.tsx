import { youtubeEmbedSrc, youtubeIdFromUrl } from "@/lib/patients/youtube"

export function VideoPreview({ url, title }: { url: string | null; title: string }) {
  if (!url) {
    return (
      <div className="flex aspect-video items-center justify-center bg-slate-100 text-sm text-slate-500">
        Fără video
      </div>
    )
  }

  const lower = url.toLowerCase()
  if (lower.includes(".mp4") || lower.startsWith("blob:") || lower.startsWith("data:video")) {
    return (
      <video
        controls
        playsInline
        preload="metadata"
        className="aspect-video h-full w-full bg-black"
        title={title}
      >
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
        className="aspect-video h-full w-full"
        {...{ playsInline: true, playsinline: "1" }}
      />
    )
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className="flex aspect-video items-center justify-center bg-slate-100 text-sm font-medium text-[#042f2e] underline-offset-4 hover:underline"
    >
      Deschide video
    </a>
  )
}
