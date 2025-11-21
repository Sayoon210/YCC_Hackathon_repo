import { type NextRequest, NextResponse } from 'next/server';
import { updateSession } from '@/utils/supabase/middleware';

export async function middleware(request: NextRequest) {
    // Update session for Supabase auth
    const response = await updateSession(request);

    // Check for specific redirects if needed, but for now, the root page.tsx handles the main redirect.
    // If we wanted to force redirect here, we could check for session and path.
    // However, keeping it simple: let updateSession handle auth state refresh.

    return response;
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * Feel free to modify this pattern to include more paths.
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
};
