/** Why: healthcheck de Railway (antes lo respondía nginx). */
export function GET() {
    return new Response('healthy\n', { headers: { 'content-type': 'text/plain', 'cache-control': 'no-store' } });
}
