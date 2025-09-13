import { NextRequest, NextResponse } from "next/server";

const ADMIN_ROOT = "/admin";
const PUBLIC_AUTH_ROUTES = ["/admin/login", "/admin/register"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = true;


  // console.log({ sessionCookie })

  const isAdminRoute = pathname === ADMIN_ROOT || pathname.startsWith(ADMIN_ROOT + "/");
  const isAuthPublic = PUBLIC_AUTH_ROUTES.includes(pathname);

  // 1. Usuário não autenticado tentando acessar /admin (exceto login/register)
  if (isAdminRoute && !isAuthPublic && !sessionCookie) {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }

  // 2. Usuário autenticado tentando acessar login/register
  if (sessionCookie && isAuthPublic) {
    return NextResponse.redirect(new URL(ADMIN_ROOT, request.url));
  }

  // 3. Todas as outras rotas são públicas
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/|api/|trpc/|.*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
  ],
};