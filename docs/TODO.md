# TODO — frontend de SyntroAuth

> Fuente de verdad del estado (ver `.claude/rules/00-sf-gate.md`). Verificado el 2026-09-15.
> **Bug** = impacto observable con fail-path. **Gap** = falta algo que un producto real necesita.
> **Sugerencia** = limpieza sin impacto hoy. Las decisiones de producto se marcan como tales.

## Decisiones de producto abiertas (las toma el usuario)

- [ ] **Qué listado ve cada rol al entrar.** Dirección acordada (2026-09-15): ir directo "al listado".
      Candidatos: admin global → Usuarios (`/admin/users`); dueño de empresa → Aplicaciones (hoy un panel
      dentro de `/tenant`). ¿El dueño ve los usuarios de su empresa? Hoy el backend no lo permite
      (listar usuarios es solo admin global desde C1).
- [ ] **El dashboard pasa a ser una pantalla de características** (acordado). Abierto: ¿pública o detrás
      del login? ¿Solo lo que funciona hoy, o también lo que está en camino marcado como tal?
- [ ] **Identidad:** nombre, dominio propio, nombre del repo (`frontend-test`).
- [ ] **Grupos de aplicaciones** (`syntroAuth/_docs/DISENO_GRUPOS_APLICACIONES.md` §7): `/tenant` pasa a
      grilla de grupos → detalle del grupo → grilla de apps. El rediseño tiene que contemplarlo.

## Bugs

- [ ] **Dependencias de producción vulnerables: 2 critical, 21 high** (`pnpm audit --prod` con Node 20 +
      pnpm 9, 2026-09-15; 43 en total). `next@16.1.6`: 2 critical (parche `>=16.3.3`; una es RCE en
      servidores Windows, que acá no aplica porque sirve nginx) y 12 high (`>=16.2.3`). High transitivas:
      `browserslist`, `nanoid`, `postcss`, `sharp`. Viola "Reglas duras de seguridad".
- [ ] **OAuth sin `state` anti-CSRF.** `buildOAuthUrl` usa el nombre del proveedor como `state`
      (`src/common/lib/oauth.ts:18`), `validateOAuthCallback` no lo compara (`oauth.ts:68-76`) y el callback
      lo lee como proveedor (`useOAuthCallbackController.ts:43`). Fail-path: un atacante inicia un login con
      Google con **su** cuenta, corta en el callback y le hace abrir a la víctima
      `/auth/callback?code=<del atacante>&state=google` → la víctima queda logueada en la cuenta del atacante.
- [ ] **Tokens de un solo uso quedan en la URL.** Reset (`ResetPasswordScreen.tsx:15`), verificación de email
      (`VerifyEmailScreen.tsx:14`) y baja de 2FA (`MfaDisableConfirmScreen.tsx:20`) leen `?token=` y no lo
      sacan (sin `history.replaceState` en `src/`): queda en el historial del navegador.
- [ ] **`console.error(err)` en `VerifyEmailScreen.tsx:62,97`**: vuelca el error completo a la consola.
- [ ] **Login con 2FA manda a la consola de admin a cualquier rol.** `useLogin2faChallenge.ts:41` hace
      `router.push('/admin/users')` fijo, sin `homePathForRole`. Fail-path: dueño de empresa con 2FA →
      código correcto → `/admin/users` → `RestrictedAccess` (`AdminUsersScreen.tsx:20-23`) en vez de su
      empresa. Afecta también al 2FA forzado (`useMfaForcedSetup.ts:60` → `/login/2fa` → mismo destino).
      Verificado en código; no reproducido en navegador.
- [ ] **Destinos después de entrar inconsistentes.** Password y Google usan `homePathForRole`
      (`useLoginPageController.ts:106`, `useOAuthCallbackController.ts:74`); confirmar email y
      configurar 2FA mandan a `/dashboard` (`VerifyEmailScreen.tsx:233`, `AccountMfaSettingsScreen.tsx:328,418,509`).
- [ ] **La pantalla de características promete lo que el backend no hace.**
      `src/flows/dashboard/general/data/security-features.data.ts:24-46`, y el HTML de `/dashboard` la
      sirve sin login. Falso o parcial según `syntroAuth/_docs/AUDITORIA_SEGURIDAD_2026-09-15.md`:
      binding IP/UA (PEN-2) y `pv` (PEN-5) no funcionan en el binario AOT (AT-9/M16); rate limit
      "5 intentos por IP" falla abierto y puede ser global (M1–M3); "Auditoría" vive solo en logs; "clave
      en KMS/S3" con la privada cacheada en claro en Redis (K5). Sin verificar: SSO cross-app y CSP por app.
- [ ] **Códigos de recuperación de 2FA que no sirven.** `VerifyEmailScreen.tsx:93,207` y
      `AccountMfaSettingsScreen.tsx:268` los muestran y ofrecen descargarlos; el backend los genera pero no
      los guarda ni los acepta (M13). Un usuario sin su teléfono queda afuera aunque los haya guardado.
- [ ] **Gate en rojo en `main`.** `pnpm lint`: 2 errores `react-hooks/set-state-in-effect`
      (`src/flows/dashboard/general/hooks/useDashboardSession.ts:21`,
      `src/flows/mfa-account-settings/general/components/MfaDisableConfirmScreen.tsx:22`) y 1 warning
      (`useOAuthCallbackController.ts:90`). El `Dockerfile` no corre lint: se despliega igual.
- [ ] **Sin headers de seguridad.** `nginx.conf` no manda CSP, HSTS ni `X-Frame-Options` (verificado en
      producción). Con el access token en `sessionStorage`, un XSS lo exfiltra. → `/sf-sec`.

## Gaps

- [ ] **Refresh entre pestañas.** `refreshAccessToken` deja un solo refresh en vuelo **por pestaña**; dos
      pestañas que refrescan a la vez (restaurar el navegador) mandan la misma cookie en paralelo y el
      backend lo trata como robo (A11): cierra todas las sesiones. Posible, no reproducido. Coordinar
      entre pestañas (`BroadcastChannel` o Web Locks).
- [ ] **Sin CI ni tests.** Ni workflow ni runner.
- [ ] **Toolchain sin fijar.** Sin `packageManager` en `package.json` ni `.nvmrc`; el local (Node 22,
      pnpm 11) no reproduce el del Dockerfile (Node 20, pnpm 9).
- [ ] **Rutas inexistentes con 200** (fallback de nginx a `index.html`).
- [ ] **`NEXT_PUBLIC_TENANT_ID` y `NEXT_PUBLIC_REDIRECT_URI` no son build args del `Dockerfile`.** Sin
      verificar qué valor toman en Railway.
- [ ] **Sin dominio propio.**

## Sugerencias

- [ ] **Restos de demo en el copy:** placeholder `demo12345678` en la password del login
      (`LoginCredentialForm.tsx:111`) y "Cualquier valor no vacío" en la del registro
      (`RegisterFormFields.tsx:102`); README "Demo / Maqueta"; `package.json` `frontend_test`.
- [ ] **Código muerto** (buscado en `src/` y `app/`, `.ts`/`.tsx`): archivos sin import
      `src/common/api/clients/users.http.client.ts` y `src/common/api/mappers/register-result.mapper.ts`;
      `postAuthRefresh` (`auth.http.client.ts`) sin uso; ~30 exports sin uso fuera de su archivo, casi
      todos tipos.
- [ ] **El script `start` sale con error a propósito** ("Static export…"): correcto para export estático,
      pero confunde.

## Hecho

- 2026-09-15 — Ficha del repo (`.claude/rules/00-sf-gate.md`), este TODO y el mapa de pantallas
  (`docs/MAPA_PANTALLAS.md`).
