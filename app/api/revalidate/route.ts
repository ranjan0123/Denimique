import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { invalidateProductsCache } from "@/lib/storefront";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const slug = typeof body?.slug === "string" ? body.slug : undefined;

    invalidateProductsCache();

    revalidatePath("/");
    revalidatePath("/shop");
    if (slug) {
      revalidatePath(`/products/${slug}`);
    }

    return NextResponse.json({ revalidated: true });
  } catch (error) {
    console.error("Revalidation failed:", error);
    return NextResponse.json({ revalidated: false }, { status: 500 });
  }
}
