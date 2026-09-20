#!/usr/bin/env bash
# E2E del BFF: imagen del front (syntro-front:bff) contra la imagen Native AOT del backend (PG17 + Redis7).
# Requisitos: Docker; `docker build -t syntro-front:bff .` en este repo; imagen del backend construida con
# `source $SYNTROAUTH_REPO/scripts/e2e/entorno.sh && e2e_build`. Procedimiento: .claude/rules/00-sf-gate.md.
# Un chequeo por fail-path de docs/PLAN_BFF.md. Uso: bash scripts/e2e/bff.sh  (E2E_KEEP=1 deja el entorno arriba)
set -u
SYNTROAUTH_REPO=${SYNTROAUTH_REPO:-$(cd "$(dirname "${BASH_SOURCE[0]}")/../../../syntroAuth" && pwd)}
source "$SYNTROAUTH_REPO/scripts/e2e/entorno.sh"

F=http://localhost:3000
FC=sa-e2e-front
ORIGIN='Origin: http://localhost:3000'
SAME='Sec-Fetch-Site: same-origin'
W=$(mktemp -d)
PASS=0; FAIL=0

check(){ if [ "$2" = "$3" ]; then echo "OK   $1"; PASS=$((PASS+1)); else echo "FAIL $1 — esperado: [$2] obtenido: [$3]"; FAIL=$((FAIL+1)); fi; }
hdr(){ grep -i "^$1:" | head -1 | cut -d' ' -f2- | tr -d '\r'; }
jarval(){ awk -v n="$2" '$6==n{print $7}' "$1"; }
enc(){ # RSA-OAEP SHA-256 de "password:seed" con la clave pública que sirve el BFF.
  # El entorno E2E no configura la clave (404 ASYMMETRIC_ENCRYPTION_NOT_CONFIGURED): ahí el backend acepta la
  # password tal cual, igual que el helper `login` de smoke.sh.
  local seed code
  code=$(curl -s -D "$W/pk.h" -o "$W/pk.pem" -w '%{http_code}' "$F/api/auth/security/public-key")
  if [ "$code" != 200 ]; then printf '%s' "$1"; return; fi
  seed=$(hdr X-Correlation-Id < "$W/pk.h")
  docker run --rm -e PEM="$(cat "$W/pk.pem")" -e MSG="$1:$seed" node:22-alpine node -e \
    'const c=require("crypto");process.stdout.write(c.publicEncrypt({key:process.env.PEM,padding:c.constants.RSA_PKCS1_OAEP_PADDING,oaepHash:"sha256"},Buffer.from(process.env.MSG)).toString("base64"))'
}
bff_login(){ # bff_login tenantId email jar → body
  local p; p=$(enc "$E2E_PASSWORD")
  curl -s -c "$3" -b "$3" -X POST "$F/api/auth/login" -H "$J" -H "$ORIGIN" -H "$SAME" -H "X-Tenant-Id: $1" \
    -d "{\"email\":\"$2\",\"password\":\"$p\"}"
}

say "Entorno: backend AOT con Google OAuth configurado + front BFF"
docker rm -f "$FC" "$FC-sin-origen" >/dev/null 2>&1 # conectados a la red: sin esto e2e_down no puede borrarla
# La red de Docker hace de red privada de Railway: el backend acepta de ahí la IP y el navegador que reenvía el BFF (M3).
e2e_up -e OAUTH_GOOGLE_CLIENT_ID=e2e-client-id -e OAUTH_GOOGLE_CLIENT_SECRET=e2e-client-secret \
  -e ClientIp__TrustedNetworks__0=172.16.0.0/12 || exit 1
docker run -d --name "$FC" --network "$NET" -p 3000:8080 \
  -e SYNTROAUTH_API_URL="http://$API:8080" -e APP_ORIGIN=http://localhost:3000 syntro-front:bff >/dev/null || exit 1
for _ in $(seq 1 30); do [ "$(status "$F/health")" = 200 ] && break; sleep 1; done
check "health del front" 200 "$(status "$F/health")"

say "Headers de seguridad y CSP con nonce"
curl -s -D "$W/login.h" "$F/login" -o "$W/login.html"
CSP=$(hdr Content-Security-Policy < "$W/login.h")
SCRIPT_SRC=$(echo "$CSP" | tr ';' '\n' | grep 'script-src')
check "CSP con nonce en script-src" yes "$(echo "$SCRIPT_SRC" | grep -q "'nonce-" && echo yes || echo no)"
check "script-src sin unsafe-inline" no "$(echo "$SCRIPT_SRC" | grep -q "unsafe-inline" && echo yes || echo no)"
check "frame-ancestors none" yes "$(echo "$CSP" | grep -q "frame-ancestors 'none'" && echo yes || echo no)"
check "X-Frame-Options" DENY "$(hdr X-Frame-Options < "$W/login.h")"
check "nosniff" nosniff "$(hdr X-Content-Type-Options < "$W/login.h")"
check "Referrer-Policy" no-referrer "$(hdr Referrer-Policy < "$W/login.h")"
check "HSTS presente" yes "$([ -n "$(hdr Strict-Transport-Security < "$W/login.h")" ] && echo yes || echo no)"
check "Permissions-Policy presente" yes "$([ -n "$(hdr Permissions-Policy < "$W/login.h")" ] && echo yes || echo no)"
NONCE=$(echo "$SCRIPT_SRC" | sed -E "s/.*'nonce-([^']+)'.*/\1/")
TOTAL_SCRIPTS=$(grep -o '<script' "$W/login.html" | wc -l | tr -d ' ')
NONCED=$(grep -o "<script[^>]*nonce=\"$NONCE\"" "$W/login.html" | wc -l | tr -d ' ')
check "todos los <script> ($TOTAL_SCRIPTS) llevan el nonce del pedido" "$TOTAL_SCRIPTS" "$NONCED"
NONCE2=$(curl -sI "$F/login" | hdr Content-Security-Policy | sed -E "s/.*'nonce-([^']+)'.*/\1/")
check "nonce distinto por pedido" yes "$([ "$NONCE" != "$NONCE2" ] && echo yes || echo no)"
check "headers también en /api" DENY "$(curl -s -D - -o /dev/null "$F/api/auth/oauth/config" | hdr X-Frame-Options)"

say "Rutas: guards de servidor y 404 real"
for p in /tenant /admin/users /dashboard /settings/security/mfa /login/2fa /mfa/setup; do
  check "sin sesión $p → 307 /login" "307 http://localhost:3000/login" "$(curl -s -o /dev/null -w '%{http_code} %{redirect_url}' "$F$p")"
done
check "ruta inexistente → 404" 404 "$(status "$F/no-existe-xyz")"

say "Proxy /api: allowlist, sin proxy abierto"
check "GET /api/auth/refresh → 404" 404 "$(status "$F/api/auth/refresh")"
check "POST /api/auth/refresh same-origin → 404" 404 "$(status -X POST -H "$ORIGIN" -H "$SAME" "$F/api/auth/refresh")"
check "POST /api/auth/oauth/login → 404" 404 "$(status -X POST -H "$ORIGIN" -H "$SAME" "$F/api/auth/oauth/login")"
check "path traversal %2e%2e → 404" 404 "$(status --path-as-is "$F/api/tenants/%2e%2e/mine")"
check "ruta del backend fuera de la lista → 404" 404 "$(status "$F/api/auth/validate")"

say "CSRF"
check "POST cross-site → 403" 403 "$(status -X POST -H 'Origin: https://evil.example' -H 'Sec-Fetch-Site: cross-site' -H "$J" -d '{}' "$F/api/auth/login")"
check "POST sin Origin ni Sec-Fetch-Site → 403" 403 "$(status -X POST -H "$J" -d '{}' "$F/api/auth/login")"
check "POST Origin ajeno sin Sec-Fetch-Site → 403" 403 "$(status -X POST -H 'Origin: https://evil.example' -H "$J" -d '{}' "$F/api/bff/logout")"

say "Tokens de un solo uso fuera de la URL"
curl -s -D "$W/link.h" -o /dev/null "$F/reset-password?token=tok-e2e-123"
check "?token= → 303" 303 "$(head -1 "$W/link.h" | awk '{print $2}')"
check "Location sin query" http://localhost:3000/reset-password "$(hdr Location < "$W/link.h")"
check "cookie de link HttpOnly" yes "$(grep -i '^set-cookie: __Host-sa_link=' "$W/link.h" | grep -qi httponly && echo yes || echo no)"
check "el token no está en ningún header de respuesta salvo la cookie codificada" 0 "$(grep -v -i '^set-cookie' "$W/link.h" | grep -c 'tok-e2e-123')"
check "reset sin cookie de link → 400 LINK_TOKEN_MISSING" "400 LINK_TOKEN_MISSING" "$(curl -s -X POST -H "$ORIGIN" -H "$SAME" -H "$J" -d '{"newPassword":"x"}' "$F/api/auth/reset-password" | python3 -c 'import sys,json;d=json.load(sys.stdin);print(d["statusCode"],d["error"]["code"])')"

say "OAuth: state del servidor"
curl -s -D "$W/oa.h" -o /dev/null -H 'Host: evil.example' "$F/api/bff/oauth/start?provider=google"
LOC=$(hdr Location < "$W/oa.h")
check "start redirige a Google" yes "$(echo "$LOC" | grep -q '^https://accounts.google.com/' && echo yes || echo no)"
check "redirect_uri desde APP_ORIGIN aunque Host sea falso" yes "$(echo "$LOC" | grep -q 'redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Fauth%2Fcallback' && echo yes || echo no)"
STATE=$(echo "$LOC" | sed -E 's/.*[?&]state=([^&]+).*/\1/')
check "state aleatorio de 43 chars" 43 "${#STATE}"
check "cookie de state HttpOnly" yes "$(grep -i '^set-cookie: __Host-sa_oauth=' "$W/oa.h" | grep -qi httponly && echo yes || echo no)"
SC=$(grep -i '^set-cookie: __Host-sa_oauth=' "$W/oa.h" | sed -E 's/^[^=]+=([^;]+).*/\1/')
check "callback con state distinto → /login?error=oauth_state" "303 http://localhost:3000/login?error=oauth_state" \
  "$(curl -s -o /dev/null -w '%{http_code} %{redirect_url}' -b "__Host-sa_oauth=$SC" "$F/auth/callback?code=abc&state=otro")"
check "callback sin cookie de state → oauth_state" "303 http://localhost:3000/login?error=oauth_state" \
  "$(curl -s -o /dev/null -w '%{http_code} %{redirect_url}' "$F/auth/callback?code=abc&state=$STATE")"
check "callback con error del proveedor → oauth" "303 http://localhost:3000/login?error=oauth" \
  "$(curl -s -o /dev/null -w '%{http_code} %{redirect_url}' -b "__Host-sa_oauth=$SC" "$F/auth/callback?error=access_denied&state=$STATE")"
check "callback con state correcto pero code falso → oauth (el backend rechaza)" "303 http://localhost:3000/login?error=oauth" \
  "$(curl -s -o /dev/null -w '%{http_code} %{redirect_url}' -b "__Host-sa_oauth=$SC" "$F/auth/callback?code=fake-code&state=$STATE")"

say "Login con password por el BFF"
EMAIL="bff-$(date +%s)@e2e.test"
TENANT=$(register "BffCo$(date +%s)" "$EMAIL"); verify_all
JAR=$W/jar
LOGIN=$(bff_login "$TENANT" "$EMAIL" "$JAR")
check "login → authenticated" True "$(echo "$LOGIN" | field '["data"].get("authenticated")')"
check "respuesta de login sin tokens (eyJ)" 0 "$(echo "$LOGIN" | grep -c 'eyJ')"
check "respuesta sin claves accessToken/refreshToken/tempToken" 0 "$(echo "$LOGIN" | grep -c '"accessToken"\|"refreshToken"\|"tempToken"')"
check "cookie de access HttpOnly" yes "$(grep -q '^#HttpOnly_localhost.*__Host-sa_at' "$JAR" && echo yes || echo no)"
check "cookie de refresh HttpOnly" yes "$(grep -q '^#HttpOnly_localhost.*__Host-sa_rt' "$JAR" && echo yes || echo no)"
check "GET /api/tenants/mine con sesión" 200 "$(status -b "$JAR" -H "X-Tenant-Id: $TENANT" "$F/api/tenants/mine")"
SESSION=$(curl -s -b "$JAR" "$F/api/bff/session")
check "session devuelve claims sin token" "yes 0" "$(echo "$SESSION" | python3 -c 'import sys,json;d=json.load(sys.stdin)["data"];print("yes" if d.get("sub") else "no",end=" ")')$(echo "$SESSION" | grep -c eyJ)"
check "con sesión /tenant → 200" 200 "$(status -b "$JAR" "$F/tenant")"

say "IP y navegador del usuario hasta el backend (M3)"
IP_EMAIL="ip-$(date +%s)@e2e.test"
IP_TENANT=$(register "IpCo$(date +%s)" "$IP_EMAIL"); verify_all
IP_JAR=$W/ipjar
CHROME='Mozilla/5.0 (Macintosh) AppleWebKit/537.36 Chrome/126.0.6478.55 Safari/537.36'
ipcall(){ curl -s "$@" -H "User-Agent: $CHROME" -H "X-Real-IP: 203.0.113.55" -H "X-Forwarded-For: 6.6.6.6"; }
IP_PASS=$(enc "$E2E_PASSWORD")
ipcall -o /dev/null -c "$IP_JAR" -b "$IP_JAR" -X POST "$F/api/auth/login" -H "$J" -H "$ORIGIN" -H "$SAME" -H "X-Tenant-Id: $IP_TENANT" \
  -d "{\"email\":\"$IP_EMAIL\",\"password\":\"$IP_PASS\"}"
IP_ROW=$(sql "SELECT host(ip_address)||' '||ua_browser FROM syntro_auth.user_sessions WHERE user_id='$(uid "$IP_EMAIL")' ORDER BY created_at DESC LIMIT 1")
check "la sesión guarda la IP de X-Real-IP (no el X-Forwarded-For del cliente) y el navegador" "203.0.113.55 Chrome" "$IP_ROW"
sed -i '' '/__Host-sa_at/d' "$IP_JAR"
check "refresh desde la misma IP → 200" 200 "$(ipcall -o /dev/null -w '%{http_code}' -b "$IP_JAR" -c "$IP_JAR" -H "X-Tenant-Id: $IP_TENANT" "$F/api/tenants/mine")"
sed -i '' '/__Host-sa_at/d' "$IP_JAR"
check "refresh desde otra red → sin sesión" 401 "$(curl -s -o /dev/null -w '%{http_code}' -b "$IP_JAR" -H "User-Agent: $CHROME" -H "X-Real-IP: 198.51.100.8" -H "X-Tenant-Id: $IP_TENANT" "$F/api/tenants/mine")"

say "Refresh coordinado: access vencido + 5 pedidos en paralelo"
OLD_AT=$(jarval "$JAR" __Host-sa_at); OLD_RT=$(jarval "$JAR" __Host-sa_rt)
sed -i '' '/__Host-sa_at/d' "$JAR"
for i in 1 2 3 4 5; do cp "$JAR" "$W/jar$i"; done
for i in 1 2 3 4 5; do curl -s -o "$W/par$i" -w '%{http_code}\n' -b "$W/jar$i" -c "$W/jar$i" -H "X-Tenant-Id: $TENANT" "$F/api/tenants/mine" > "$W/code$i" & done; wait
check "los 5 pedidos → 200" "200 200 200 200 200" "$(cat "$W"/code1 "$W"/code2 "$W"/code3 "$W"/code4 "$W"/code5 | tr '\n' ' ' | sed 's/ $//')"
NEW=$(for i in 1 2 3 4 5; do jarval "$W/jar$i" __Host-sa_rt; done | sort -u | wc -l | tr -d ' ')
check "una sola rotación (mismo refresh nuevo en los 5)" 1 "$NEW"
check "el refresh rotó" yes "$([ "$(jarval "$W/jar1" __Host-sa_rt)" != "$OLD_RT" ] && echo yes || echo no)"
check "sin TOKEN_THEFT_DETECTED en el backend" 0 "$(docker logs "$API" 2>&1 | grep -c TOKEN_THEFT_DETECTED)"
check "la sesión rotada sigue viva" 200 "$(status -b "$W/jar1" -H "X-Tenant-Id: $TENANT" "$F/api/tenants/mine")"

say "2FA de cuenta y login con 2FA por el BFF"
cp "$W/jar1" "$JAR"
SETUP=$(curl -s -b "$JAR" -c "$JAR" -X POST -H "$ORIGIN" -H "$SAME" "$F/api/account/mfa/setup")
SECRET=$(echo "$SETUP" | field '["data"]["secret"]')
sleep $((31 - $(date +%s) % 30))
CONFIRM=$(curl -s -b "$JAR" -c "$JAR" -X POST -H "$ORIGIN" -H "$SAME" -H "$J" -d "{\"code\":\"$(totp "$SECRET")\"}" "$F/api/account/mfa/confirm-sync")
check "confirm-sync con TOTP" yes "$(echo "$CONFIRM" | grep -q '"success": *true\|"success":true' && echo yes || echo no)"
RECOVERY=$(echo "$CONFIRM" | python3 -c 'import sys,json; print(json.load(sys.stdin)["data"]["recoveryCodes"][0])' 2>/dev/null)
check "confirm-sync devuelve códigos de recuperación" yes "$([ -n "$RECOVERY" ] && echo yes || echo no)"
check "logout BFF → 200" 200 "$(status -b "$JAR" -c "$JAR" -X POST -H "$ORIGIN" -H "$SAME" "$F/api/bff/logout")"
check "logout borra la cookie de refresh" "" "$(jarval "$JAR" __Host-sa_rt)"
: > "$W/jar2fa"
LOGIN2=$(bff_login "$TENANT" "$EMAIL" "$W/jar2fa")
check "login con 2FA → mfa_required" mfa_required "$(echo "$LOGIN2" | field '["data"].get("result")')"
check "sin tempToken en la respuesta" 0 "$(echo "$LOGIN2" | grep -c 'tempToken\|eyJ')"
check "cookie de 2FA HttpOnly" yes "$(grep -q '^#HttpOnly_localhost.*__Host-sa_mfa' "$W/jar2fa" && echo yes || echo no)"
sleep $((31 - $(date +%s) % 30))
L2FA=$(curl -s -b "$W/jar2fa" -c "$W/jar2fa" -X POST -H "$ORIGIN" -H "$SAME" -H "$J" -d "{\"code\":\"$(totp "$SECRET")\"}" "$F/api/auth/login/2fa")
check "login/2fa → authenticated" True "$(echo "$L2FA" | field '["data"].get("authenticated")')"
check "login/2fa sin tokens en la respuesta" 0 "$(echo "$L2FA" | grep -c 'eyJ')"
check "tras 2FA hay sesión y no queda cookie de 2FA" "yes no" "$([ -n "$(jarval "$W/jar2fa" __Host-sa_rt)" ] && echo yes || echo no) $([ -n "$(jarval "$W/jar2fa" __Host-sa_mfa)" ] && echo yes || echo no)"
check "código TOTP incorrecto no se reintenta (401 de negocio pasa tal cual)" 401 "$(status -b "$W/jar2fa" -X POST -H "$ORIGIN" -H "$SAME" -H "$J" -d '{"code":"000000"}' "$F/api/account/mfa/verify")"

say "Código de recuperación por el BFF (M13)"
: > "$W/jarrec"
bff_login "$TENANT" "$EMAIL" "$W/jarrec" >/dev/null
REC=$(curl -s -b "$W/jarrec" -c "$W/jarrec" -X POST -H "$ORIGIN" -H "$SAME" -H "$J" -d "{\"code\":\"$RECOVERY\"}" "$F/api/auth/login/2fa")
check "login/2fa con código de recuperación → authenticated" True "$(echo "$REC" | field '["data"].get("authenticated")')"
: > "$W/jarrec2"
bff_login "$TENANT" "$EMAIL" "$W/jarrec2" >/dev/null
check "el mismo código ya no sirve" 401 "$(status -b "$W/jarrec2" -X POST -H "$ORIGIN" -H "$SAME" -H "$J" -d "{\"code\":\"$RECOVERY\"}" "$F/api/auth/login/2fa")"

say "Sesión revocada → SESSION_EXPIRED"
cp "$W/jar2fa" "$W/stale"
check "logout" 200 "$(status -b "$W/jar2fa" -c "$W/jar2fa" -X POST -H "$ORIGIN" -H "$SAME" "$F/api/bff/logout")"
sed -i '' '/__Host-sa_at/d' "$W/stale"
EXP=$(curl -s -D "$W/exp.h" -b "$W/stale" -H "X-Tenant-Id: $TENANT" "$F/api/tenants/mine")
check "refresh revocado → 401 SESSION_EXPIRED" "401 SESSION_EXPIRED" "$(echo "$EXP" | python3 -c 'import sys,json;d=json.load(sys.stdin);print(d["statusCode"],d["error"]["code"])')"
check "y borra las cookies" yes "$(grep -i '^set-cookie: __Host-sa_rt=;' "$W/exp.h" >/dev/null && echo yes || echo no)"

say "Backend caído"
docker pause "$API" >/dev/null
DOWN=$(curl -s --max-time 30 "$F/api/auth/oauth/config")
docker unpause "$API" >/dev/null
check "→ 502 BACKEND_UNAVAILABLE" "502 BACKEND_UNAVAILABLE" "$(echo "$DOWN" | python3 -c 'import sys,json;d=json.load(sys.stdin);print(d["statusCode"],d["error"]["code"])')"
check "sin URL interna en la respuesta" 0 "$(echo "$DOWN" | grep -c "$API\|8080")"

say "Sin APP_ORIGIN: las redirecciones no exponen el origen interno (0.0.0.0:8080 en producción, 2026-09-15)"
docker run -d --name "$FC-sin-origen" --network "$NET" -p 3001:8080 -e SYNTROAUTH_API_URL="http://$API:8080" syntro-front:bff >/dev/null
for _ in $(seq 1 30); do [ "$(status http://localhost:3001/health)" = 200 ] && break; sleep 1; done
check "oauth start → Location relativa a /login?error=oauth_config" "/login?error=oauth_config" \
  "$(curl -s -D - -o /dev/null 'http://localhost:3001/api/bff/oauth/start?provider=google' | hdr Location)"
check "callback → Location relativa a /login?error=oauth_config" "/login?error=oauth_config" \
  "$(curl -s -D - -o /dev/null 'http://localhost:3001/auth/callback?code=x&state=y' | hdr Location)"
check "guard de página → Location relativa a /login" "/login" \
  "$(curl -s -D - -o /dev/null 'http://localhost:3001/tenant' | hdr Location)"
docker rm -f "$FC-sin-origen" >/dev/null 2>&1

say "Logs"
check "logs del front sin JWT" 0 "$(docker logs "$FC" 2>&1 | grep -c 'eyJ')"
check "logs del front sin el email" 0 "$(docker logs "$FC" 2>&1 | grep -c "$EMAIL")"
check "logs del backend sin el email" 0 "$(e2e_log_count "$EMAIL")"

echo; echo "RESULTADO: $PASS OK, $FAIL FAIL"
[ "${E2E_KEEP:-0}" = 1 ] || { docker rm -f "$FC" >/dev/null 2>&1; e2e_down; }
rm -rf "$W"
[ "$FAIL" = 0 ]
