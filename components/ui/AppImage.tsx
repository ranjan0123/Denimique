"use client";

import NextImage, { type ImageProps } from "next/image";
import { useState } from "react";

type AppImageProps = ImageProps & {
  quality?: ImageProps["quality"];
  fallbackSrc?: string;
};

const FALLBACK_IMAGE = "/logo-removebg-preview.png";
const normalizeFallbackSrc = (
  value: string | undefined,
  fallbackSrc = FALLBACK_IMAGE,
) => {
  if (!value) return fallbackSrc;
  try {
    const url = new URL(value);
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return fallbackSrc;
    }
    // Product images may be served from a separately configured storage host.
    // Keep every valid HTTP(S) URL so it does not get replaced by the logo.
    return value;
  } catch {
    // Relative paths are valid Next.js image sources.
    return value;
  }
};

export default function AppImage({
  quality = 85,
  sizes,
  src,
  onError,
  fallbackSrc = FALLBACK_IMAGE,
  ...props
}: AppImageProps) {
  return (
    <ImageWithFallback
      key={String(src)}
      {...props}
      src={src}
      quality={quality}
      sizes={sizes}
      onError={onError}
      fallbackSrc={fallbackSrc}
    />
  );
}

function ImageWithFallback({
  quality = 85,
  sizes,
  src,
  onError,
  fallbackSrc = FALLBACK_IMAGE,
  ...props
}: AppImageProps) {
  const [resolvedSrc, setResolvedSrc] = useState(() =>
    normalizeFallbackSrc(String(src), fallbackSrc),
  );

  // Re-normalize during render (rather than in an effect) whenever src or
  // fallbackSrc change. The parent already remounts this component on src
  // changes via `key={String(src)}`, but fallbackSrc can change on its own.
  const [trackedSrc, setTrackedSrc] = useState(src);
  const [trackedFallback, setTrackedFallback] = useState(fallbackSrc);
  if (src !== trackedSrc || fallbackSrc !== trackedFallback) {
    setTrackedSrc(src);
    setTrackedFallback(fallbackSrc);
    setResolvedSrc(normalizeFallbackSrc(String(src), fallbackSrc));
  }

  const resolvedSizes = sizes ?? (props.fill ? "100vw" : undefined);
  return (
    <NextImage
      {...props}
      src={resolvedSrc}
      // Product assets can come from runtime-configured storage hosts.
      unoptimized
      quality={quality}
      sizes={resolvedSizes}
      onError={(event) => {
        onError?.(event);
        if (resolvedSrc !== fallbackSrc) {
          setResolvedSrc(fallbackSrc);
        }
      }}
    />
  );
}
