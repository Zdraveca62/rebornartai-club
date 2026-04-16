// proxy.js (преименуван от middleware.js)
import { NextResponse } from 'next/server';

export function proxy(request) { // функцията вече се казва proxy
  // Списък със защитените пътища
  const protectedPaths = ['/admin', '/admin-chat'];
  const isProtectedPath = protectedPaths.some(path => request.nextUrl.pathname.startsWith(path));
  
  // Изключваме login страницата
  if (request.nextUrl.pathname === '/admin-login') {
    return NextResponse.next();
  }
  
  if (!isProtectedPath) {
    return NextResponse.next();
  }
  
  // Вземаме токена от cookie
  const adminToken = request.cookies.get('admin_token')?.value;
  const validToken = 'reborn_admin_9f7d3e8a2c1b5f6e9d4a7c8b3e2f1a9d';
  
  // Ако няма токен или е невалиден – пренасочваме към login
  if (!adminToken || adminToken !== validToken) {
    const loginUrl = new URL('/admin-login', request.url);
    loginUrl.searchParams.set('from', request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/admin-chat/:path*'],
};