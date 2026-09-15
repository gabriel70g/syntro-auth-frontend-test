import { NextResponse } from 'next/server';
import { appOrigin } from '@server/config';

/**
 * Why: redirección a una ruta propia. Con `APP_ORIGIN` sale absoluta. Sin ella, la `Location` va relativa y el
 * navegador la resuelve contra la URL que pidió. ❌ NEVER `req.nextUrl.origin`: en el servidor standalone detrás de
 * Railway vale `https://0.0.0.0:8080` (verificado en producción el 2026-09-15) y manda al usuario a una página rota.
 */
export function redirectResponse(path: string, status: 303 | 307): NextResponse {
    const origin = appOrigin();
    if (origin) return NextResponse.redirect(new URL(path, origin), status);
    return new NextResponse(null, { status, headers: { Location: path } });
}
