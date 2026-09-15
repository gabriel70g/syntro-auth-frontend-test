# TODO — frontend de SyntroAuth

> Fuente de verdad del estado (ver `.claude/rules/00-sf-gate.md`). Verificado el 2026-09-15.
> **Bug** = impacto observable con fail-path. **Gap** = falta algo que un producto real necesita.
> **Sugerencia** = limpieza sin impacto hoy. Las decisiones de producto se marcan como tales.

## Antes de mergear el BFF (lo tiene que hacer el usuario)

- [ ] **Cargar `APP_ORIGIN` en Railway** (servicio `syntro-auth-frontend-test`) con el origen público del front
      (`https://syntro-auth-frontend-test-production.up.railway.app`). Sin esa variable, el login con Google falla
      cerrado (`/login?error=oauth_config`).
- [ ] **Recomendado: `SYNTROAUTH_API_URL`** con el dominio privado del backend (`http://<RAILWAY_PRIVATE_DOMAIN>:<puerto>`).
      Sin ella, el servidor usa la URL pública.
- [ ] **Puerto:** la imagen escucha en `PORT` (8080 por defecto). Revisar que Railway no tenga fijado el 80 de nginx.
- [ ] **Una sola réplica** del servicio del front: el lock del refresh vive en memoria (`src/server/session.ts`).
- [ ] **Probar en el navegador el login con password, el login con Google y el 2FA.** El E2E los cubre por HTTP
      contra la imagen AOT, pero ese entorno no tiene clave RSA y la pantalla de login no puede cifrar ahí.

## Decisiones de producto abiertas (las toma el usuario)

- [ ] **Qué listado ve cada rol al entrar.** Dirección acordada (2026-09-15): ir directo "al listado".
      Candidatos: admin global → Usuarios (`/admin/users`); dueño de empresa → Aplicaciones (hoy un panel
      dentro de `/tenant`). ¿El dueño ve los usuarios de su empresa? Hoy el backend no lo permite
      (listar usuarios es solo admin global desde C1).
- [ ] **El dashboard pasa a ser una pantalla de características** (acordado). Abierto: ¿pública o detrás
      del login? ¿Solo lo que funciona hoy, o también lo que está en camino marcado como tal?
- [ ] **Identidad:** nombre, dominio propio, nombre del repo (`frontend-test`).
- [ ] **Grupos de aplicaciones** (`syntroAuth/_docs/DISENO_GRUPOS_APLICACIONES.md` §7): `/tenant` pasa a
      grilla de grupos → detalle del grupo → grilla de apps. El rediseño tiene que contemplarlo. El secreto de
      grupo, cuando exista, pasa por el BFF: entra a `src/server/routes.ts` y no se guarda.

## Bugs

- [ ] **El dashboard dice algo falso sobre dónde vive el token.** El banner "Demo" de
      `src/flows/dashboard/general/components/DashboardScreen.tsx` dice que el access token se guarda en
      `sessionStorage`. Desde el BFF vive en una cookie HttpOnly del servidor. Es copy: lo decide el usuario (borrarlo
      o reescribirlo).
- [ ] **La pantalla de características promete lo que el backend no hace.**
      `src/flows/dashboard/general/data/security-features.data.ts:24-46`. Falso o parcial según
      `syntroAuth/_docs/AUDITORIA_SEGURIDAD_2026-09-15.md`: binding IP/UA (PEN-2) y `pv` (PEN-5) no funcionan en el
      binario AOT (AT-9/M16); rate limit "5 intentos por IP" falla abierto y puede ser global (M1–M3); "Auditoría"
      vive solo en logs; "clave en KMS/S3" con la privada cacheada en claro en Redis (K5). Sin verificar: SSO
      cross-app y CSP por app. (Desde el BFF, `/dashboard` ya no se sirve sin sesión.)
- [ ] **Códigos de recuperación de 2FA que no sirven.** `VerifyEmailScreen.tsx` y `AccountMfaSettingsScreen.tsx`
      los muestran y ofrecen descargarlos; el backend los genera pero no los guarda ni los acepta (M13). Un usuario
      sin su teléfono queda afuera aunque los haya guardado.

## Gaps

- [ ] **Rate limit y binding ven la IP del servidor de Next.** El BFF reenvía `X-Forwarded-For`, pero el backend no
      lo usa sin `KnownNetworks` en `ForwardedHeaders` (`syntroAuth/src/SyntroAuth.Api/Program.cs:164-168`). No es
      nuevo: antes veía la IP del proxy de Railway. Pendiente del backend (M1–M3).
- [ ] **Step-up 2FA de la consola de admin sin E2E.** El BFF captura el token elevado (`capture: 'access'` en
      `/api/auth/step-up/verify`), pero `scripts/e2e/bff.sh` no crea un admin global. Verificado en código, no
      ejecutado.
- [ ] **Vulnerabilidades en devDependencies:** `pnpm audit` (sin `--prod`) reporta 16 high y 9 moderate, todas de
      build y lint (2026-09-15). No viajan al servidor ni al navegador. Revisar en cada upgrade.
- [ ] **Sin tests unitarios.** El BFF tiene funciones puras (`toBackendPath`, `matchRoute`, `stripTokens`,
      `refreshFromSetCookie`, `statesMatch`) que conviene cubrir con vitest; hoy las cubre solo el E2E.
- [ ] **`docs/MAPA_PANTALLAS.md` es anterior al BFF**: guards, API y "HTML servido" cambiaron. Actualizarlo con el
      rediseño de estructura.
- [ ] **Sin dominio propio.**

## Sugerencias

- [ ] **Restos de demo en el copy:** placeholder `demo12345678` en la password del login
      (`LoginCredentialForm.tsx:111`), "Cualquier valor no vacío" en registro y reset, "Ejemplo: cualquier
      contraseña no vacía" en `ResetPasswordScreen.tsx`; README "Demo / Maqueta"; `package.json` `frontend_test`.
- [ ] **~30 exports sin uso fuera de su archivo**, casi todos tipos (búsqueda en `src/` y `app/`, 2026-09-15,
      anterior al BFF).

## Hecho

- 2026-09-15 — Ficha del repo (`.claude/rules/00-sf-gate.md`), este TODO y el mapa de pantallas
  (`docs/MAPA_PANTALLAS.md`).
- 2026-09-15 — **Dependencias:** next 16.3.5, react 19.3.0, Node 22, overrides de `browserslist`,
  `baseline-browser-mapping` y `@babel/core`. `pnpm audit --prod`: de 2 critical + 21 high a **0**.
  `packageManager` y `.nvmrc` fijan el toolchain.
- 2026-09-15 — **BFF con el servidor de Next** (`docs/PLAN_BFF.md`). Cierra los Bugs:
  - **Sin headers de seguridad** → CSP con nonce, HSTS, nosniff, `no-referrer`, `X-Frame-Options`,
    `Permissions-Policy` desde `proxy.ts`.
  - **OAuth sin `state`** → `state` aleatorio en cookie HttpOnly, verificado en `/auth/callback` (servidor).
  - **Tokens de un solo uso en la URL** → `proxy.ts` los pasa a cookie y redirige a la URL limpia.
  - **Access token en `sessionStorage`** → todos los tokens en cookies `__Host-` HttpOnly.
  - **Login con 2FA manda a la consola de admin a cualquier rol** y **destinos inconsistentes** →
    `homePathForRole` en 2FA, OAuth, verify-email y 2FA de cuenta.
  - **`console.error` en `VerifyEmailScreen`** → fuera.
  - **Gate en rojo y `Dockerfile` sin lint** → 0 errores y 0 warnings; el `Dockerfile` corre `lint && build`.

  Cierra también estos Gaps:
  - **Refresh entre pestañas** → single-flight por token en el servidor.
  - **Sin CI** → `.github/workflows/ci.yml`.
  - **Toolchain sin fijar.**
  - **Rutas inexistentes con 200** → 404.
  - **Build args** → `NEXT_PUBLIC_TENANT_ID` pasa a `ARG`; `NEXT_PUBLIC_REDIRECT_URI` ya no se usa.
  - **Código muerto** → `users.http.client.ts`, `register-result.mapper.ts`, `postAuthRefresh`, el callback cliente
    y el storage de tokens.

  Evidencia: `scripts/e2e/bff.sh` contra la imagen AOT del backend (resultado en el PR #5).
