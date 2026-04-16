// middleware.js
import { NextResponse } from 'next/server';

export function middleware(request) {
  const adminPaths = ['/admin', '/admin-chat', '/admin-login'];
  const isAdminPath = adminPaths.some(path => request.nextUrl.pathname.startsWith(path));
  
  if (!isAdminPath) {
    return NextResponse.next();
  }
  
  // Проверка за токен в sessionStorage (не може директно, затова използваме cookie)
  const adminToken = request.cookies.get('admin_token')?.value;
  const validToken = 'reborn_admin_9f7d3e8a2c1b5f6e9d4a7c8b3e2f1a9d';
  
  if (adminToken !== validToken) {
    // Пренасочване към login страницата
    const loginUrl = new URL('/admin-login', request.url);
    loginUrl.searchParams.set('from', request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/admin-chat/:path*'],
};