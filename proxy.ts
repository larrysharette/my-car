import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

const protectedPaths = [
  "/",
  "/gas",
  "/find-gas",
  "/maintenance",
  "/inspections",
  "/wishlist",
  "/gallery",
  "/settings",
  "/notifications",
  "/export",
  "/service-manual",
]
const authPaths = ["/signin", "/signup"]

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const session = request.cookies.get("session")

  const isProtected = protectedPaths.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  )
  const isAuthPage = authPaths.some((path) => pathname === path)

  if (isProtected && !session) {
    return NextResponse.redirect(new URL("/signin", request.url))
  }

  if (isAuthPage && session) {
    return NextResponse.redirect(new URL("/", request.url))
  }

  return NextResponse.next()
}

export const proxyConfig = {
  matcher: [
    "/",
    "/gas/:path*",
    "/find-gas",
    "/maintenance/:path*",
    "/inspections/:path*",
    "/wishlist/:path*",
    "/gallery/:path*",
    "/settings/:path*",
    "/notifications/:path*",
    "/export/:path*",
    "/service-manual/:path*",
    "/signin",
    "/signup",
  ],
}
