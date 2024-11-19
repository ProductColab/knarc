import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Only apply WASM headers in development
  if (process.env.NODE_ENV === 'development' && request.url.endsWith('.wasm')) {
    const response = NextResponse.next();
    response.headers.set('Cross-Origin-Opener-Policy', 'same-origin');
    response.headers.set('Cross-Origin-Embedder-Policy', 'require-corp');
    response.headers.set('Content-Type', 'application/wasm');
    return response;
  }
  return NextResponse.next();
}

export const config = {
  matcher: process.env.NODE_ENV === 'development'
    ? [
      '/((?!api|_next/static|_next/image|favicon.ico).*)',
      '/duckdb-eh.wasm',
      '/duckdb-mvp.wasm'
    ]
    : [],
}; 