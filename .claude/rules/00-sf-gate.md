# syntro-auth-frontend-test (frontend de SyntroAuth) — gate e invariantes del repo

> Ficha que consumen las skills `/sf-*` (nivel usuario). El método vive en la skill; los hechos de
> este repo, acá. Sin esta ficha, la skill se detiene.
>
> Verificado el **2026-09-15** contra el repo, contra la imagen del `Dockerfile` corriendo y contra la imagen
> Native AOT del backend (E2E). Lo que no se pudo verificar está marcado como tal.

## Cómo se trabaja acá (aplica antes que cualquier otra cosa)

- **La frontera es tuya, el código es mío.** Qué pantallas existen, qué ve cada tipo de usuario, qué
  dice el copy, qué características se muestran, qué se borra — son decisiones del usuario y **se
  preguntan**. La implementación, los nombres, la estructura de componentes y la verificación son
  del agente: se hacen, no se consultan.
- **El tell.** Si la respuesta a *"¿por qué así?"* es un **principio** ("la pantalla no promete lo que
  el backend no hace"), saliste del código y estás moviendo un límite → preguntá. Si es una
  **técnica** ("el refresh lo hace el servidor para no disparar la detección de robo"), decidí y seguí.
- ❌ NEVER meter código sin análisis previo. Si algo no queda claro, **se pregunta**.
- ❌ NEVER afirmar una negación ("no existe X") sin decir **dónde** se buscó.
- ❌ NEVER una sonda manual como evidencia: o queda como verificación repetible, o se dice
  "verificado a mano, sin test".
- 🔒 **Ya no es un frontend de demo: es el frontend de un IdP y cumple reglas duras de seguridad**
  (decisión del usuario, 2026-09-15). Las reglas están en "Reglas duras de seguridad", más abajo, y no
  se relajan por "es solo el front" ni por "el backend ya lo valida". Un cambio que viola una no se
  mergea. Cada violación que se encuentre se ficha como **Bug** en `docs/TODO.md`.

## Qué es

Frontend de **SyntroAuth** (el IdP de `gabriel70g/syntroAuth`): login y registro por empresa, 2FA,
recuperación de password, panel de la empresa (aplicaciones y kit de integración) y consola de admin
global. En producción sobre **Railway**, servicio `syntro-auth-frontend-test`,
`https://syntro-auth-frontend-test-production.up.railway.app` (sin dominio propio). Repo
`gabriel70g/syntro-auth-frontend-test`.

Next.js **16.3.5** (App Router) · React **19.3.0** · TypeScript · Tailwind 4 · **Node 22** · **pnpm 9**.
`package.json` es `frontend_test`, `private: true`. **Sin i18n**: todo el copy está en español,
escrito en los componentes, y `app/layout.tsx` declara `<html lang="es">`.

**BFF con el servidor de Next** (desde 2026-09-15, `docs/PLAN_BFF.md`). `output: 'standalone'`: el
`Dockerfile` corre `node server.js` (sin nginx). Piezas:

| Pieza | Qué hace |
|---|---|
| `proxy.ts` | CSP con nonce por pedido y headers de seguridad; guards de páginas con sesión; `?token=` de los links del correo → cookie + 303 a la URL limpia |
| `app/api/[...path]/route.ts` | Proxy al backend con **allowlist** (`src/server/routes.ts`) |
| `app/api/bff/{session,logout,oauth/start}` | Claims sin token · logout · inicio de OAuth con `state` |
| `app/auth/callback/route.ts` | Vuelta de OAuth resuelta en el servidor |
| `src/server/*` | Solo servidor: cookies, sesión y refresh, CSRF, llamada al backend |
| `src/flows/*` y `app/**/page.tsx` | Pantallas (Client); las de links del correo y `/login` tienen `page.tsx` de servidor |

Todas las rutas son dinámicas (`await connection()` en el layout): el nonce lo exige.

Rama única: **`main`**. Deploy automático desde `main` (verificado en los deploys de Railway).
No hay `develop`.

**Variables de runtime en Railway** (el servidor las lee al arrancar):
- `APP_ORIGIN` — **obligatoria**: origen público del front. Sale de acá el `redirect_uri` de OAuth. Sin ella,
  OAuth falla cerrado (`/login?error=oauth_config`).
- `SYNTROAUTH_API_URL` — recomendada: el backend por la red privada de Railway. Sin ella usa
  `NEXT_PUBLIC_API_URL` (build arg) y, si tampoco está, la URL pública de producción.
- `SYNTROAUTH_REFRESH_COOKIE` — solo si el backend cambia `Auth:RefreshCookie:CookieName`.

## Gate

```
pnpm audit --prod --audit-level high   # 0 critical/high en dependencias de producción
python3 scripts/check-contrast.py      # WCAG AA de los tokens de color, modo claro y oscuro
pnpm lint                              # 0 errores, 0 warnings
pnpm build                             # typecheck + build standalone
bash scripts/e2e/bff.sh                # E2E: imagen del front contra la imagen AOT del backend
```

⚠️ **Correrlo con el toolchain del Dockerfile, no con el local.** En la máquina del maintainer corre pnpm 11
y `pnpm install` aborta sin TTY (`ERR_PNPM_ABORTED_REMOVE_MODULES_DIR_NO_TTY`). Reproducible:

```
docker build --target builder -t syntro-front:builder .     # install --frozen-lockfile + lint + build
docker run --rm syntro-front:builder pnpm audit --prod --audit-level high
docker build -t syntro-front:bff .                          # imagen final (la que usa el E2E)
```

✅ El `Dockerfile` corre `pnpm lint && pnpm build`: con el lint en rojo no hay imagen. CI
(`.github/workflows/ci.yml`) corre audit + lint + build en cada PR.

**E2E (`scripts/e2e/bff.sh`)**: levanta el backend con `syntroAuth/scripts/e2e/entorno.sh` (variable
`SYNTROAUTH_REPO`, por defecto `../syntroAuth`) y el front en `http://localhost:3000`, y verifica cada
fail-path de `docs/PLAN_BFF.md` con esperado vs obtenido: headers, nonce, guards, allowlist, CSRF, links,
OAuth `state`, login con y sin 2FA, refresh concurrente, sesión revocada, backend caído y logs.

⚠️ **Verificar lo que se sirve contra la imagen corriendo**, no contra `pnpm dev`: en dev la CSP agrega
`unsafe-eval` y el proxy no se comporta igual detrás de Turbopack.

## Invariantes

- ❌ NEVER commitear directo a `main` sin decirlo: `main` **es** producción. ✅ ALWAYS rama + PR, y
  decirle al usuario que el merge publica.
- ❌ NEVER un token (access, refresh, temporal de 2FA, de link, `state` de OAuth) al alcance del JavaScript de la
  página: ni en `sessionStorage`, ni en `localStorage`, ni en el JSON que devuelve el BFF, ni en la URL.
  ✅ ALWAYS en cookies `__Host-` HttpOnly que escribe `src/server/cookies.ts`. `localStorage` solo guarda la
  empresa activa, que no es secreta (`tenant.storage.ts`).
- ❌ NEVER llamar al backend desde el navegador. ✅ ALWAYS `/api/*` del mismo origen (`bffFetch` /
  `authenticatedFetch` de `src/common/api/clients/http.helpers.ts`). Un endpoint nuevo del backend no existe para
  el front hasta que se agrega a `src/server/routes.ts` con su `auth`, `capture` e `inject`.
- ❌ NEVER importar `src/server/*` desde un módulo `'use client'`: arrastra código de servidor al bundle.
- ❌ NEVER refrescar fuera de `src/server/session.ts`. Deja un solo refresh en vuelo por token y reusa la
  rotación unos segundos: el backend trata dos refresh con el mismo token como robo (A11). ⚠️ Vale con **una
  instancia**; con réplicas el lock va a Redis.
- ❌ NEVER reintentar un 401 que no traiga `WWW-Authenticate`: es un 401 de negocio (TOTP incorrecto) y
  reintentarlo reconsume el código (`src/server/proxy-handler.ts`, `isBearerRejection`).
- ❌ NEVER un route handler con método no seguro sin `isSameOriginRequest` (CSRF). El proxy lo aplica solo; los
  handlers propios (`/api/bff/*`) lo llaman explícito.
- ❌ NEVER tratar un guard como autorización. `proxy.ts` y los claims solo deciden qué se muestra; la
  autorización la aplica el backend.
- ❌ NEVER decidir el destino después del login en cada pantalla. ✅ ALWAYS `homePathForRole`
  (`src/common/lib/home-path.ts`), también en el callback de OAuth.
- ❌ NEVER prometer en una pantalla una capacidad que el backend no tiene. El estado real del backend
  está en `syntroAuth/_docs/AUDITORIA_SEGURIDAD_2026-09-15.md` y en su `CHANGELOG.md`.
- ❌ NEVER mostrar ni loguear un secreto del backend después de su única vez (semilla TOTP,
  `key_secret` de grupo cuando exista).
- ❌ NEVER `npm` ni `yarn`: el gestor es **pnpm 9** (`packageManager` en `package.json`). Un
  `package-lock.json` que aparezca es un lockfile en conflicto.
- ✅ ALWAYS que un cambio observable quede reflejado en `docs/TODO.md`.

## Reglas duras de seguridad

> Vigentes desde 2026-09-15. Un cambio que viola una **no se mergea**. Se verifican contra la imagen corriendo
> (`scripts/e2e/bff.sh`), no contra el JSX.

- ❌ NEVER desplegar con dependencias de producción con vulnerabilidades **critical** o **high** conocidas.
  ✅ ALWAYS `pnpm audit --prod --audit-level high` (CI lo corre); una excepción se documenta con el motivo y fecha
  de revisión. Las de devDependencies se listan aparte en `docs/TODO.md`.
- ❌ NEVER servir sin headers de seguridad. ✅ ALWAYS desde `proxy.ts`, en páginas y en `/api`:
  `Content-Security-Policy` con nonce (sin `unsafe-inline` ni `unsafe-eval` en `script-src`),
  `Strict-Transport-Security`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: no-referrer`,
  `frame-ancestors 'none'` + `X-Frame-Options: DENY` y `Permissions-Policy`.
- ❌ NEVER un flujo OAuth sin `state` aleatorio atado al navegador y verificado a la vuelta. ✅ ALWAYS en el
  servidor: `/api/bff/oauth/start` lo genera y lo guarda en cookie HttpOnly, `/auth/callback` lo compara en
  tiempo constante y lo consume. `redirect_uri` ❌ NEVER desde el header Host: ✅ ALWAYS `APP_ORIGIN`.
- ❌ NEVER dejar un token de un solo uso (reset, verificación de email, baja de 2FA) en la URL. ✅ ALWAYS
  `proxy.ts` lo pasa a cookie y redirige (303) a la URL limpia antes de servir la pantalla.
- ❌ NEVER un token, un secreto o un email en `console.*` ni en logs del servidor.
- ❌ NEVER `dangerouslySetInnerHTML`, `innerHTML` o `eval` con datos que vengan de la API o de la URL.
- ❌ NEVER navegar a una URL tomada de la query o del storage sin validarla contra una lista cerrada
  (open redirect). Hoy todos los destinos son rutas fijas; `/login?error=` solo muestra mensajes de
  `oauth-errors.data.ts`.
- ❌ NEVER un proxy abierto: `/api/*` solo reenvía lo que está en `src/server/routes.ts`, y el path se
  reconstruye rechazando `.`, `..` y barras.
- ❌ NEVER prometer en pantalla una capacidad de seguridad que el backend no tiene (ver "Invariantes").
- ✅ ALWAYS gate verde (audit + lint + build + E2E) antes del PR.

## Gotchas conocidos

**El nonce exige render dinámico.** Next aplica el nonce leyendo el `Content-Security-Policy` del pedido que
arma `proxy.ts`; una página prerenderizada en el build no tiene nonce y sus scripts quedan bloqueados. Por eso
`await connection()` en `app/layout.tsx`. ❌ NEVER sacarlo ni agregar `export const dynamic = 'force-static'`.

**`style-src` lleva `'unsafe-inline'`.** React escribe atributos `style=` y los atributos no admiten nonce. Si
se agrega un nonce a `style-src`, el navegador ignora `'unsafe-inline'` y se rompen los estilos inline.

**El refresh del backend llega en `Set-Cookie`, no en el JSON** (`IncludeRefreshTokenInJsonBody` es false por
defecto), con el valor codificado por ASP.NET. `refreshFromSetCookie` lo decodifica. El BFF lo devuelve en el
body de `/api/auth/refresh`; el backend lee cookie **o** body y, sin `Origin`, `RefreshOriginGuard` no aplica.

**Dos clases de 401 en el backend.** El esquema Bearer (token vencido, inválido, revocado) responde con
`WWW-Authenticate`; los endpoints (TOTP incorrecto, `STEP_UP_INVALID_FACTOR`) no. Solo el primero se refresca y
reintenta.

**El E2E del backend no tiene clave RSA.** El cifrado asimétrico solo se registra con S3: en
`entorno.sh`, `/api/auth/security/public-key` responde `404 ASYMMETRIC_ENCRYPTION_NOT_CONFIGURED` y el login
acepta la password sin cifrar. En ese entorno el login **desde la UI** falla (`encryptPassword` exige la clave):
el E2E manda la password por `curl`. En producción la clave existe.

**Cookies `__Host-` sobre `http://localhost`.** Llevan `Secure`: Chrome y curl las aceptan en `localhost`
(lo tratan como origen seguro); con otro host en http se descartan.

**El contenedor del front bloquea `e2e_down`.** Si queda conectado a `sa-e2e-net`, la red no se borra y el
próximo `e2e_up` falla con `network ... already exists`. `scripts/e2e/bff.sh` lo borra primero.

**Modo claro/oscuro: cada color es `light-dark(claro, oscuro)` en `app/globals.css`, pero en el CSS servido no hay
ningún `light-dark(`.** LightningCSS (lo usa Tailwind 4) lo compila a `var(--lightningcss-light, …)
var(--lightningcss-dark, …)`, y esas variables se activan según el `color-scheme` de `:root`. Por eso la elección se
hace con `color-scheme` (`:root` = `light dark`, `[data-theme]` lo fija) y no con un bloque de variables por tema.
- Verificado en la imagen local:
  - sin cookie sigue al sistema, emulado claro y oscuro;
  - la cookie `sa_theme` hace que el servidor pinte `data-theme` en `<html>`, sin parpadeo después de recargar.
- Las clases tailwind con color usan la variante `dark:` propia de `globals.css` (`data-theme` + sistema), no la de
  Tailwind por defecto.
- ❌ NEVER un color literal en un componente: en uno de los dos modos queda invisible. ✅ ALWAYS token +
  `python3 scripts/check-contrast.py`.

**No se puede llamar desde un Server Component una función exportada por un módulo `'use client'`.** Importarla compila
y el build da verde, pero en runtime cada página responde con la pantalla de error (`__next_error__`, React #441). En el
log aparece `Attempted to call parseThemeChoice() from the server but parseThemeChoice is on the client`. Visto al armar
el selector de tema: el layout usaba `parseThemeChoice` desde `ThemeToggle.tsx`. ✅ ALWAYS poner lo compartido entre
servidor y cliente en un módulo sin `'use client'` (`src/common/lib/theme.ts`) y verificar la imagen corriendo, no solo
el build.

**Railway dice `builder: RAILPACK` pero construye con el `Dockerfile`.** La config del servicio muestra
RAILPACK, y aun así los logs de build del deploy `c8b4c35b` (2026-09-15) ejecutan las stages del `Dockerfile`
(`[builder 7/7]`, `COPY nginx.conf`). Lo que manda es el `Dockerfile` de la raíz, no la config. Railway inyecta
`PORT` y `server.js` lo respeta.

**En los route handlers, `req.nextUrl.origin` es el origen interno del contenedor.** El servidor standalone escucha en
`HOSTNAME=0.0.0.0` y `PORT=8080`. Por eso, detrás de Railway, `req.nextUrl.origin` vale `http(s)://0.0.0.0:8080` y
no el dominio público.

- Verificado en producción el 2026-09-15: sin `APP_ORIGIN`, "Continuar con Google" redirigía a
  `https://0.0.0.0:8080/login?error=oauth_config`.
- Reproducido en rojo en local con la imagen previa al fix.

❌ NEVER armar una redirección de un route handler con `req.nextUrl.origin`. ✅ ALWAYS usar `redirectResponse`
(`src/server/redirect.ts`): arma la URL absoluta con `APP_ORIGIN` y, si la variable falta, manda una `Location` relativa.

**Excepción: `proxy.ts`.** En el proxy, `req.nextUrl` sí trae el host del pedido. Además, una `Location` relativa armada
a mano hace que el proxy tire `ERR_INVALID_URL` y responda 500. Verificado con la imagen sin `APP_ORIGIN`: `/tenant` → 500.
Por eso el proxy usa `NextResponse.redirect` con `appOrigin() ?? req.nextUrl.origin`.

**La IP que ve el backend es la del servidor de Next.** El BFF reenvía `X-Forwarded-For`, pero el backend no la
usa sin `KnownNetworks` en `ForwardedHeaders` (`syntroAuth/src/SyntroAuth.Api/Program.cs`). Afecta rate limit y
binding de IP. Ya pasaba antes con el proxy de Railway: fichado como pendiente del backend (M1–M3).

**`X-Tenant-Id` sale del navegador.** `getDefaultHeaders()` (`src/common/lib/config.ts`) manda la empresa activa
de `localStorage` o `DEFAULT_TENANT_ID`; el BFF solo reenvía un UUID válido. El backend da prioridad al tenant del
token cuando hay sesión (AT-3, hotfix 2).

**Las skills `/sf-*` nacieron para el sitio de SyntropySoft.** Acá no aplican la paridad `en`/`es`
(no hay i18n) ni lo de SEO/indexación (es una app detrás de login). El resto del método sí.

## Fuente de verdad del estado

`docs/TODO.md` — Bugs y Gaps abiertos, con lo hecho al final. Es lo primero que se consulta y lo
último que se actualiza. El mapa de pantallas de partida está en `docs/MAPA_PANTALLAS.md` (anterior al BFF) y el
plan del BFF en `docs/PLAN_BFF.md`.
