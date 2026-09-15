# syntro-auth-frontend-test (frontend de SyntroAuth) — gate e invariantes del repo

> Ficha que consumen las skills `/sf-*` (nivel usuario). El método vive en la skill; los hechos de
> este repo, acá. Sin esta ficha, la skill se detiene.
>
> Todo lo que sigue fue **verificado el 2026-09-15** contra el repo, contra un build con el toolchain
> del Dockerfile y contra producción. Lo que no se pudo verificar está marcado como tal.

## Cómo se trabaja acá (aplica antes que cualquier otra cosa)

- **La frontera es tuya, el código es mío.** Qué pantallas existen, qué ve cada tipo de usuario, qué
  dice el copy, qué características se muestran, qué se borra — son decisiones del usuario y **se
  preguntan**. La implementación, los nombres, la estructura de componentes y la verificación son
  del agente: se hacen, no se consultan.
- **El tell.** Si la respuesta a *"¿por qué así?"* es un **principio** ("la pantalla no promete lo que
  el backend no hace"), saliste del código y estás moviendo un límite → preguntá. Si es una
  **técnica** ("paso el refresh por `refreshAccessToken` para no disparar la detección de robo"),
  decidí y seguí.
- ❌ NEVER meter código sin análisis previo. Si algo no queda claro, **se pregunta**.
- ❌ NEVER afirmar una negación ("no existe X") sin decir **dónde** se buscó.
- ❌ NEVER una sonda manual como evidencia: o queda como verificación repetible, o se dice
  "verificado a mano, sin test".
- 🔒 **Ya no es un frontend de demo: es el frontend de un IdP y cumple reglas duras de seguridad**
  (decisión del usuario, 2026-09-15). Las reglas están en "Reglas duras de seguridad", más abajo, y no
  se relajan por "es solo el front" ni por "el backend ya lo valida". Un cambio que viola una no se
  mergea. Nació como maqueta: encontrar restos es esperable, pero cada violación se ficha como **Bug**
  en `docs/TODO.md`. El mapa de partida está en `docs/MAPA_PANTALLAS.md`.

## Qué es

Frontend de **SyntroAuth** (el IdP de `gabriel70g/syntroAuth`): login y registro por empresa, 2FA,
recuperación de password, panel de la empresa (aplicaciones y kit de integración) y consola de admin
global. En producción sobre **Railway**, servicio `syntro-auth-frontend-test`,
`https://syntro-auth-frontend-test-production.up.railway.app` (sin dominio propio). Repo
`gabriel70g/syntro-auth-frontend-test`.

Next.js **16.1.6** (App Router) · React **19.2.3** · TypeScript · Tailwind 4 (`@tailwindcss/postcss`).
`package.json` es `frontend_test`, `private: true`. **Sin i18n**: todo el copy está en español,
escrito en los componentes, y `app/layout.tsx` declara `<html lang="es">`.

**Export estático** (`output: 'export'`, `next.config.ts`): no hay servidor Next. `pnpm build` genera
`out/` y el `Dockerfile` lo sirve con **nginx** (`nginx.conf`). Las 15 `page.tsx` de `app/` son
`'use client'`; el build **pre-renderiza su estado inicial** como HTML.

Rama única: **`main`**. Deploy automático desde `main` (verificado en los deploys de Railway).
No hay `develop`.

## Gate

```
pnpm lint      # eslint (eslint-config-next 16)
pnpm build     # compila + typecheck + export estático a out/
```

⚠️ **Correrlo con el toolchain del Dockerfile, no con el local.** El Dockerfile usa `node:20-alpine`
y `pnpm@9` (el `pnpm-lock.yaml` es formato 9). En la máquina del maintainer corre Node 22 y pnpm 11,
y `pnpm install` aborta sin TTY (`ERR_PNPM_ABORTED_REMOVE_MODULES_DIR_NO_TTY`). Reproducible:

```
docker build --target builder -t syntro-front:builder .     # install --frozen-lockfile + build
docker run --rm syntro-front:builder pnpm lint
```

❌ **El gate hoy no está verde:** `pnpm build` pasa; `pnpm lint` falla con 2 errores
(`react-hooks/set-state-in-effect`) y 1 warning. Fichado en `docs/TODO.md`.

❌ **No hay CI ni tests.** El `Dockerfile` corre `pnpm run build` pero **no** `pnpm lint`: hoy `main`
despliega con lint en rojo. Cuando un cambio se verifica a mano, se dice **qué** se miró y **dónde**.

⚠️ **Verificar lo que se sirve contra `out/` o contra producción**, no contra `pnpm dev`: el dev server
no reproduce el export estático ni el fallback de nginx. Para ver el HTML de una ruta:
`docker create syntro-front:<tag>` + `docker cp <id>:/usr/share/nginx/html ./out`.

## Invariantes

- ❌ NEVER commitear directo a `main` sin decirlo: `main` **es** producción. ✅ ALWAYS rama + PR, y
  decirle al usuario que el merge publica.
- ❌ NEVER una credencial, un token o un endpoint privado en `src/`: **todo lo que entra al bundle es
  público**. Un `NEXT_PUBLIC_*` es público por definición.
- ❌ NEVER guardar el access token fuera de `sessionStorage` ni el refresh token fuera de la cookie
  HttpOnly (`src/common/lib/storage/auth-session.storage.ts`). `localStorage` solo guarda la empresa
  activa, que no es secreta (`tenant.storage.ts`).
- ❌ NEVER llamar a `/api/auth/refresh` directo. ✅ ALWAYS `refreshAccessToken()` de
  `src/common/api/clients/http.helpers.ts`, que deja un solo refresh en vuelo: desde el 2026-09-15 el
  backend trata dos refresh simultáneos con el mismo token como robo y revoca todas las sesiones.
- ❌ NEVER tratar un guard del front como autorización. Los guards (`readStoredAccessToken`, el rol del
  token) solo deciden qué se muestra; la autorización la aplica el backend. Corolario: el HTML
  estático de una ruta "protegida" es público.
- ❌ NEVER decidir el destino después del login en cada pantalla. ✅ ALWAYS un único punto de decisión
  (hoy `src/common/lib/home-path.ts`, que no todos los caminos usan — ver `docs/TODO.md`).
- ❌ NEVER prometer en una pantalla una capacidad que el backend no tiene. El estado real del backend
  está en `syntroAuth/_docs/AUDITORIA_SEGURIDAD_2026-09-15.md` y en su `CHANGELOG.md`.
- ❌ NEVER mostrar ni loguear un secreto del backend después de su única vez (semilla TOTP,
  `key_secret` de grupo cuando exista).
- ❌ NEVER `npm` ni `yarn`: el gestor es **pnpm 9** (lockfile formato 9). Un `package-lock.json` que
  aparezca es un lockfile en conflicto.
- ✅ ALWAYS que un cambio observable quede reflejado en `docs/TODO.md`.

## Reglas duras de seguridad

> Vigentes desde 2026-09-15. Un cambio que viola una **no se mergea**; lo que hoy las viola está fichado
> como Bug en `docs/TODO.md`. Se verifican contra el HTML servido y los headers reales, no contra el JSX.

- ❌ NEVER desplegar con dependencias de producción con vulnerabilidades **critical** o **high** conocidas.
  ✅ ALWAYS `pnpm audit --prod` con el toolchain del Dockerfile antes del PR; una excepción se documenta
  con el motivo (p. ej. "solo afecta a servidores Windows y acá sirve nginx") y fecha de revisión.
- ❌ NEVER servir sin headers de seguridad. ✅ ALWAYS en `nginx.conf`, en **todas** las `location`:
  `Content-Security-Policy` (sin `unsafe-inline` ni `unsafe-eval` en `script-src`),
  `Strict-Transport-Security`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: no-referrer`,
  `frame-ancestors 'none'` (+ `X-Frame-Options: DENY`) y `Permissions-Policy`. Verificado con `curl -I`
  contra el contenedor.
- ❌ NEVER un flujo OAuth sin `state` aleatorio atado a la sesión del navegador y verificado a la vuelta
  (anti-CSRF / login forzado). ✅ ALWAYS generarlo con `crypto.getRandomValues`, guardarlo en
  `sessionStorage` y rechazar el callback si no coincide.
- ❌ NEVER dejar un token de un solo uso (reset, verificación de email, baja de 2FA) en la URL después de
  leerlo. ✅ ALWAYS sacarlo con `history.replaceState` al montar la pantalla.
- ❌ NEVER guardar tokens fuera de `sessionStorage` (access, temporal de 2FA) o de la cookie HttpOnly
  (refresh). ❌ NEVER un token, un secreto o un email en `console.*`, en la URL propia o en `localStorage`.
- ❌ NEVER `dangerouslySetInnerHTML`, `innerHTML` o `eval` con datos que vengan de la API o de la URL.
- ❌ NEVER navegar a una URL tomada de la query o del storage sin validarla contra una lista cerrada
  (open redirect). Hoy todos los destinos son rutas fijas: mantenerlo.
- ❌ NEVER mostrar datos sensibles en el estado inicial de una pantalla: el HTML estático es público aunque
  la ruta tenga guard.
- ❌ NEVER prometer en pantalla una capacidad de seguridad que el backend no tiene (ver "Invariantes").
- ✅ ALWAYS gate verde (lint + build + audit) y el `Dockerfile` corriendo el lint: nada se despliega en rojo.

## Gotchas conocidos

**Next mete scripts inline en cada página del export** (6 por página en 16.1.6). Con export estático no
hay nonce: la CSP sin `unsafe-inline` necesita los **hashes** de esos scripts, calculados sobre el
`out/` de **ese** build (cambian en cada build). ❌ NEVER copiar hashes a mano en `nginx.conf`.

**`add_header` en una `location` de nginx anula los del `server`.** Si una `location` declara
`Cache-Control` con `add_header`, pierde todos los headers de seguridad heredados. Van en un snippet
incluido en cada `location`.


**El export estático no tiene servidor.** Sin middleware, sin route handlers, sin headers por ruta, sin
redirects de Next: todo eso vive en `nginx.conf` o no existe. ❌ NEVER agregar código que asuma un
servidor Next (`headers()`, `cookies()`, `middleware.ts`): el build de export lo rechaza o lo ignora.

**nginx no manda headers de seguridad.** Verificado en producción el 2026-09-15 sobre `/login`: solo
`cache-control` y `server`. Sin CSP, sin HSTS, sin `X-Frame-Options`. Con el access token en
`sessionStorage`, un XSS se lo lleva.

**Toda ruta inexistente devuelve 200.** `try_files … /index.html` en `nginx.conf`; verificado en
producción (`/no-existe-xyz` → 200).

**Las pantallas con `Suspense` + `useSearchParams` se sirven como "Cargando…".** `/reset-password`,
`/verify-email` y `/settings/security/mfa/disable-confirm` no tienen contenido en el HTML: todo aparece
después de hidratar.

**El tenant de cada request sale del navegador.** `getDefaultHeaders()` (`src/common/lib/config.ts:28-33`)
manda `X-Tenant-Id` con la empresa activa de `localStorage` o, si no hay, `DEFAULT_TENANT_ID`
(`a0000000-0000-0000-0000-000000000001`, el tenant de fábrica). El backend da prioridad al tenant del
token cuando hay sesión (AT-3, corregido en el hotfix 2).

**`API_URL` cae en producción por defecto** (`config.ts:7-9`): un build sin `NEXT_PUBLIC_API_URL`
apunta a la API real.

**El `Dockerfile` solo recibe `NEXT_PUBLIC_API_URL` como build arg.** `NEXT_PUBLIC_TENANT_ID` y
`NEXT_PUBLIC_REDIRECT_URI` no se declaran como `ARG`: sin verificar si Railway las inyecta igual; si
no, el build usa los valores por defecto de `config.ts`.

**Las skills `/sf-*` nacieron para el sitio de SyntropySoft.** Acá no aplican la paridad `en`/`es`
(no hay i18n) ni lo de SEO/indexación (es una app detrás de login). El resto del método sí.

## Fuente de verdad del estado

`docs/TODO.md` — Bugs y Gaps abiertos, con lo hecho al final. Es lo primero que se consulta y lo
último que se actualiza. El mapa de pantallas de partida está en `docs/MAPA_PANTALLAS.md`.
