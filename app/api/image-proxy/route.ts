import { NextRequest, NextResponse } from "next/server";
import { API_ORIGIN } from "@/lib/apiConfig";

// The backend sends Cross-Origin-Resource-Policy: same-origin on every
// response, which blocks the browser from loading its /uploads images
// directly from this frontend's origin (see lib/api.ts resolveApiAssetUrl
// for the full explanation). This route fetches the image server-side,
// where CORP isn't enforced, and re-serves it from this app's own origin.
//
// Only URLs on our own backend origin are allowed — this is not a general
// proxy, so it can't be used to fetch or leak arbitrary remote content.
export async function GET(request: NextRequest) {
  const src = request.nextUrl.searchParams.get("src");
  if (!src) {
    return NextResponse.json({ message: "Missing src" }, { status: 400 });
  }

  let target: URL;
  try {
    target = new URL(src);
  } catch {
    return NextResponse.json({ message: "Invalid src" }, { status: 400 });
  }

  let allowedOrigin: string;
  try {
    allowedOrigin = new URL(API_ORIGIN).origin;
  } catch {
    return NextResponse.json({ message: "Proxy misconfigured" }, { status: 500 });
  }

  if (target.origin !== allowedOrigin) {
    return NextResponse.json({ message: "Origin not allowed" }, { status: 403 });
  }

  let upstream: Response;
  try {
    upstream = await fetch(target.toString());
  } catch {
    return NextResponse.json({ message: "Upstream fetch failed" }, { status: 502 });
  }

  if (!upstream.ok || !upstream.body) {
    return NextResponse.json(
      { message: "Image not found" },
      { status: upstream.status || 404 },
    );
  }

  return new NextResponse(upstream.body, {
    status: 200,
    headers: {
      "Content-Type": upstream.headers.get("content-type") || "application/octet-stream",
      "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
    },
  });
}
