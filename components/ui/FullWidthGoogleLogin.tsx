"use client";

import { useEffect, useRef, useState } from "react";
import { GoogleLogin, GoogleLoginProps } from "@react-oauth/google";

type FullWidthGoogleLoginProps = Omit<GoogleLoginProps, "width">;

/**
 * Google's Identity Services button only accepts a pixel `width`, not "100%",
 * so it never actually stretches to fill its container on its own. This
 * measures the wrapping div and feeds that pixel value back into GoogleLogin.
 */
export default function FullWidthGoogleLogin(props: FullWidthGoogleLoginProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState<number>();

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const updateWidth = () => setWidth(el.offsetWidth);
    updateWidth();

    const observer = new ResizeObserver(updateWidth);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} className="w-full">
      {width ? <GoogleLogin {...props} width={width} /> : null}
    </div>
  );
}
