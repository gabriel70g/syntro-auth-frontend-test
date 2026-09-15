# Plan — BFF con el servidor de Next y endurecimiento

> `/sf-plan`, 2026-09-15, rama `chore/ficha-y-mapa`. Pedido del usuario: seguir el endurecimiento de
> `docs/TODO.md` **usando el server-to-server de Next**. Se implementa en la misma rama y queda en el PR
> en borrador: la confirmación del plan es la revisión del PR (el usuario pidió modo automático).

## Resultado observable

Después de esto, el navegador **no ve ni guarda ningún token** de SyntroAuth: habla solo con el servidor
de Next en su mismo origen (`/api/...`), que llama al backend server-to-server y guarda access, refresh,
token temporal de 2FA, `state` de OAuth y tokens de un solo uso en cookies `HttpOnly`. Cada página se
sirve con CSP con nonce y headers de seguridad, y una ruta protegida sin sesión redirige a `/login` desde
el servidor, sin mandar su HTML.

## Clasificación

`estructura` + `ruta` + `dependencia`.

- **estructura:** pasa de export estático + nginx a servidor Node de Next (`output: 'standalone'`). Aparecen
  `proxy.ts`, route handlers (`app/api/**/route.ts`) y un módulo solo de servidor (`src/server/`).
- **ruta:** `/auth/callback` pasa de página a route handler. Aparecen `/api/bff/session`, `/api/bff/logout`
  y `/api/bff/oauth/start`. `/api/*` pasa a ser el proxy al backend. Ninguna URL visible sale.
- **dependencia:** next 16.1.6 → 16.3.5, react 19.2.3 → 19.3.0, overrides de `browserslist`,
  `baseline-browser-mapping` y `@babel/core`, y Node 20 (sin soporte desde abril de 2026) → 22.

## Por qué BFF (técnica, no producto)

- **XSS:** hoy el access token vive en `sessionStorage` y un XSS se lo lleva. Con cookies `HttpOnly` el
  script no puede leerlo.
- **CSP sin `unsafe-inline` en `script-src`:** con export estático había que calcular hashes por build;
  con servidor, Next aplica el nonce solo (docs de Next 16.3.5,
  `01-app/02-guides/content-security-policy.md`).
- **OAuth:** el `state` y el intercambio del `code` quedan del lado del servidor; el `code` no pasa por JS.
- **Refresh:** se coordina en un solo lugar (el servidor), y deja de depender de cuántas pestañas haya.

### Contrato del backend verificado (no se toca el backend)

- `/api/auth/refresh` y `/logout` leen la cookie `syntroauth_refresh` **o** el campo `refreshToken` del body
  (`AuthEndpoints.cs:175-177`). `RefreshOriginGuard` deja pasar pedidos **sin** `Origin`
  (`RefreshOriginGuard.cs:17-19`): server-to-server no necesita CORS.
- El refresh viaja en `Set-Cookie` y no en el JSON, porque `IncludeRefreshTokenInJsonBody` es false por
  defecto y Railway no lo configura (`AuthRefreshCookieOptions.cs`). El BFF lo lee del `Set-Cookie` de la
  respuesta.
- El binding de User-Agent acepta `X-Original-User-Agent` (`AuthEndpoints.cs:199`): el BFF reenvía el del
  navegador.
- Emiten tokens: `login` (`AuthEndpoints.cs:140`), `login/2fa` (`MfaEndpoints.cs:119`), `oauth/login`
  (`OAuthEndpoints.cs:192`), `refresh` (`AuthEndpoints.cs:268`), `verify-email/confirm`
  (`VerificationEndpoints.cs:62`) y `step-up/verify` (solo access elevado, `AuthEndpoints.cs:549`).

## Pasos

1. **Dependencias y toolchain.** Archivos: `package.json`, `pnpm-lock.yaml`, `.nvmrc`. Deployable al
   terminar: sí.
2. **Servidor Next.** Archivos: `next.config.ts` (`standalone`, sin `images.unoptimized`), `Dockerfile`
   (Node 22, `pnpm lint` + `build`, runtime `node server.js` sin root) y borrar `nginx.conf`.
   `/health` → `app/health/route.ts`. Deployable: sí; Railway detecta el puerto por `PORT`.
3. **Núcleo BFF solo de servidor.** `src/server/` con `import 'server-only'`:
   - `config.ts`: `SYNTROAUTH_API_URL` con fallback a `NEXT_PUBLIC_API_URL` y a producción; `APP_ORIGIN`.
   - `cookies.ts`: nombres `__Host-`, `HttpOnly`, `Secure`, `SameSite=Lax`.
   - `backend.ts`: fetch al backend que reenvía IP y UA y extrae el refresh del `Set-Cookie`.
   - `session.ts`: refresh single-flight por token, con memoria corta de rotaciones recientes.
   - `csrf.ts`: `Sec-Fetch-Site` / `Origin`.
   - `jwt-claims.ts`.

   Deployable: sí (no lo usa nadie todavía).
4. **Proxy `/api/[...path]`.** Allowlist de rutas del backend; inyecta bearer, token temporal y token de
   enlace desde cookies; captura y **quita** los tokens de las respuestas; refresh transparente en 401;
   descarga binaria del kit. Más `/api/bff/session` (claims, sin token), `/api/bff/logout` y
   `/api/bff/oauth/start`, y `app/auth/callback/route.ts` (valida `state`, intercambia, redirige por rol).
   Deployable: sí.
5. **`proxy.ts`.** Nonce y CSP por pedido, headers de seguridad, guard de rutas protegidas por cookie
   (redirect a `/login`) y tokens de enlace (`?token=` → cookie + redirect 303 a la URL limpia). Layout
   dinámico (`await connection()`). Deployable: sí.
6. **Cliente.**
   - Borrar el storage de tokens y el refresh del navegador.
   - `authenticatedFetch` → `fetch('/api/...')` same-origin.
   - `useSession()` contra `/api/bff/session` en vez de `decodeJwtPayload`.
   - Destino único `homePathForRole` (2FA, verify-email, 2FA de cuenta).
   - Callback de OAuth sin pantalla.
   - Arreglar los 2 errores de lint y el warning, y sacar los `console.error`.
   - Borrar el código muerto (`users.http.client.ts`, `register-result.mapper.ts`, `postAuthRefresh`).

   Deployable: sí, recién acá cierra el corte.
7. **CI.** `.github/workflows/ci.yml`: install frozen + lint + build + `pnpm audit --prod --audit-level high`.
8. **Verificación.** Gate en Docker. E2E con la imagen del front contra la imagen AOT del backend
   (`syntroAuth/scripts/e2e/entorno.sh`), mirando `curl -I` y el navegador integrado. Después
   `docs/TODO.md`, la ficha, el PR y `/sf-learn`.

⚠️ Los pasos 2-6 cambian el runtime entero. En `main` entran juntos (un PR); ningún corte intermedio
llega a `main` por separado.

## Fail-paths a cubrir

| Entrada adversarial | Comportamiento esperado | Cómo se verifica |
|---|---|---|
| JS de la página intenta leer el token (`document.cookie`, storage) | No hay token visible | Navegador: `document.cookie` y `sessionStorage` sin tokens tras login |
| `POST /api/...` desde otro sitio (CSRF) | 403 `CSRF_REJECTED` | `curl` con `Origin: https://evil.example` y `Sec-Fetch-Site: cross-site` |
| `/api/../../algo` o ruta fuera de la allowlist (SSRF/proxy abierto) | 404 sin llamar al backend | `curl` a rutas no permitidas |
| Browser llama `/api/auth/refresh` directo | 404: el refresh solo lo hace el servidor | `curl` |
| Callback de OAuth con `state` distinto, sin cookie o reutilizado | Redirect a `/login?error=oauth_state`, sin llamar al backend | `curl` al callback con state falso |
| Callback con `error=access_denied` o sin `code` | Redirect a `/login?error=oauth` | `curl` |
| `?error=` arbitrario en `/login` | Solo códigos de una lista cerrada; el resto se ignora | Navegador |
| Access vencido + 2 pedidos simultáneos (2 pestañas) | Un solo refresh al backend; los dos pedidos siguen | E2E: `redis`/log del backend con un solo `refresh` + sin `TOKEN_THEFT_DETECTED` |
| Refresh revocado o robado | Cookies borradas, 401 `SESSION_EXPIRED`, cliente a `/login` | E2E: revocar sesión y pedir `/api/tenants/mine` |
| Ruta protegida sin cookie | 307 a `/login` sin HTML de la pantalla | `curl -I /tenant` |
| `?token=` en `/reset-password`, `/verify-email`, `/…/disable-confirm` | 303 a la URL sin query + cookie `HttpOnly` de vida corta | `curl -I` |
| Script inyectado sin nonce | Bloqueado por CSP | `curl -I` (CSP con nonce, sin `unsafe-inline` en `script-src`) + consola sin violaciones en las pantallas legítimas |
| Backend caído | 502 `BACKEND_UNAVAILABLE`, sin stack ni URL interna | E2E con `docker stop` del backend |
| Respuesta de login con tokens | El JSON que llega al navegador no trae `accessToken`/`refreshToken`/`tempToken` | E2E: `curl` al BFF |
| Host header falso en OAuth start | `redirect_uri` sale de `APP_ORIGIN`, no del header | `curl -H 'Host: evil'` |

## Paridad i18n

No aplica: no hay i18n. Copy nuevo mínimo, solo mensajes de error de OAuth en `/login`: "No se pudo
iniciar sesión con Google. Probá de nuevo." Es un mensaje técnico que no promete ninguna capacidad.

## Impacto en rutas / SEO

- `/auth/callback` sigue existiendo, ahora como route handler.
- Aparecen `/api/*`, `/api/bff/*` y `/health` (antes `/health` estaba en nginx).
- Las rutas inexistentes pasan a responder **404** (antes 200 por el fallback de nginx), lo que cierra ese Gap.
- SEO: no aplica (app detrás de login).

## Riesgos

- **Varias instancias en Railway:** el single-flight del refresh vive en memoria del proceso. Con más de una
  réplica, dos pedidos simultáneos pueden caer en instancias distintas y el backend lo trata como robo.
  → Documentado en la ficha como invariante (una réplica, o mover el lock a Redis). Detectado por
  `TOKEN_THEFT_DETECTED` en logs del backend.
- **IP del cliente para rate limit y binding:** el backend ve la IP de quien le habla. Ya hoy, sin
  `ForwardedHeaders` configurado para la red de Railway (`Program.cs:164-168`, `KnownProxies` por defecto =
  loopback), ve la IP del proxy de Railway y no la del usuario; con el BFF ve la del servidor de Next. El BFF
  reenvía `X-Forwarded-For`, pero el backend no lo usa hasta que se configure `KnownNetworks`. **No empeora lo
  que hay; queda anotado como pendiente del backend (M1–M3).** → Detectado por login 429 compartido entre
  usuarios.
- **Variables en Railway:** hacen falta `APP_ORIGIN` (para `redirect_uri` de OAuth) y, recomendado,
  `SYNTROAUTH_API_URL` apuntando a la red privada. Sin `APP_ORIGIN` el login con Google falla cerrado. → Lo
  tiene que cargar el usuario antes del merge; va en el PR.
- **Google OAuth:** el `redirect_uri` registrado en Google no cambia (`/auth/callback`).
- **Performance:** todas las páginas pasan a render dinámico (condición del nonce). Para una app detrás de
  login es aceptable.
