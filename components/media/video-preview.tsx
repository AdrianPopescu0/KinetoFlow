"use client"

import { useEffect, useRef, useState } from "react"
import { Maximize, Pause, Play } from "lucide-react"

import { youtubeEmbedSrc, youtubeIdFromUrl, youtubeThumbnailUrl } from "@/lib/patients/youtube"
import { cn } from "@/lib/utils"

const playButtonClassName =
  "flex size-16 min-h-[44px] min-w-[44px] items-center justify-center rounded-full bg-white/95 text-[#042f2e] shadow-md"
const controlButtonClassName =
  "inline-flex size-11 min-h-[44px] min-w-[44px] items-center justify-center rounded-full text-white hover:bg-white/15"

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
    ? "absolute inset-0 h-full w-full"
    : "relative aspect-video h-auto w-full"
  const placeholderClass = cn(
    "flex items-center justify-center bg-slate-100 text-sm text-slate-500",
    fill ? "absolute inset-0 h-full w-full" : "aspect-video w-full",
  )

  if (!url) {
    return <div className={placeholderClass}>Fără video</div>
  }

  const lower = url.toLowerCase()
  if (lower.includes(".mp4") || lower.startsWith("blob:") || lower.startsWith("data:video")) {
    return <Html5VideoPlayer src={url} title={title} className={frameClass} />
  }

  const youtubeId = youtubeIdFromUrl(url)
  if (youtubeId) {
    return <YoutubePlayer youtubeId={youtubeId} title={title} className={frameClass} />
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className={cn(
        placeholderClass,
        "min-h-[44px] font-medium text-[#042f2e] underline-offset-4 hover:underline",
      )}
    >
      Deschide video
    </a>
  )
}

function YoutubePlayer({
  youtubeId,
  title,
  className,
}: {
  youtubeId: string
  title: string
  className: string
}) {
  const [started, setStarted] = useState(false)
  const thumb = youtubeThumbnailUrl(youtubeId)

  if (started) {
    return (
      <iframe
        src={youtubeEmbedSrc(youtubeId, { autoplay: true })}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
        allowFullScreen
        className={cn(className, "border-0")}
      />
    )
  }

  return (
    <button
      type="button"
      onClick={() => setStarted(true)}
      className={cn(className, "overflow-hidden bg-slate-900")}
      aria-label={`Redă video: ${title}`}
    >
      {thumb ? (
        <img src={thumb} alt="" className="absolute inset-0 h-full w-full object-cover" />
      ) : (
        <span className="absolute inset-0 bg-slate-800" />
      )}
      <span className="absolute inset-0 bg-slate-900/25" />
      <span className="absolute inset-0 flex items-center justify-center">
        <span className={playButtonClassName}>
          <Play className="size-7 fill-current" />
        </span>
      </span>
    </button>
  )
}

function Html5VideoPlayer({
  src,
  title,
  className,
}: {
  src: string
  title: string
  className: string
}) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [playing, setPlaying] = useState(false)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const player = videoRef.current
    if (!player) {
      return
    }

    function sync() {
      const node = videoRef.current
      if (!node) {
        return
      }
      setPlaying(!node.paused)
      setProgress(node.duration ? node.currentTime / node.duration : 0)
    }

    player.addEventListener("play", sync)
    player.addEventListener("pause", sync)
    player.addEventListener("timeupdate", sync)
    player.addEventListener("ended", sync)
    return () => {
      player.removeEventListener("play", sync)
      player.removeEventListener("pause", sync)
      player.removeEventListener("timeupdate", sync)
      player.removeEventListener("ended", sync)
    }
  }, [])

  function togglePlayback() {
    const video = videoRef.current
    if (!video) {
      return
    }
    if (video.paused) {
      void video.play()
    } else {
      video.pause()
    }
  }

  function seek(value: number) {
    const video = videoRef.current
    if (!video || !video.duration) {
      return
    }
    video.currentTime = value * video.duration
  }

  function enterFullscreen() {
    const video = videoRef.current
    if (!video) {
      return
    }
    const withWebkit = video as HTMLVideoElement & { webkitEnterFullscreen?: () => void }
    if (typeof video.requestFullscreen === "function") {
      void video.requestFullscreen()
      return
    }
    withWebkit.webkitEnterFullscreen?.()
  }

  return (
    <div className={cn(className, "overflow-hidden bg-black")}>
      <video
        ref={videoRef}
        playsInline
        preload="metadata"
        title={title}
        className="absolute inset-0 h-full w-full object-cover"
        onClick={togglePlayback}
      >
        <source src={src} />
      </video>

      {!playing ? (
        <button
          type="button"
          onClick={togglePlayback}
          className="absolute inset-0 z-10 flex items-center justify-center bg-slate-900/20"
          aria-label={`Redă video: ${title}`}
        >
          <span className={playButtonClassName}>
            <Play className="size-7 fill-current" />
          </span>
        </button>
      ) : null}

      <div className="absolute inset-x-0 bottom-0 z-20 flex items-center gap-1 bg-gradient-to-t from-black/75 to-transparent px-1.5 pt-8 pb-1.5">
        <button type="button" onClick={togglePlayback} className={controlButtonClassName} aria-label={playing ? "Pauză" : "Redă"}>
          {playing ? <Pause className="size-5 fill-current" /> : <Play className="size-5 fill-current" />}
        </button>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={progress}
          onChange={(event) => seek(Number(event.target.value))}
          aria-label="Progres video"
          className="h-11 min-h-[44px] flex-1 cursor-pointer accent-white"
        />
        <button type="button" onClick={enterFullscreen} className={controlButtonClassName} aria-label="Ecran complet">
          <Maximize className="size-5" />
        </button>
      </div>
    </div>
  )
}
