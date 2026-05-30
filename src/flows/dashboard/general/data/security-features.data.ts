/**
 * Why: Datos estáticos del listado de controles aplicados (visible en dashboard).
 * Agrupados por categoría vía `tag` para que la UI los coloree distinto.
 */

export type SecurityFeatureTag =
    | 'Core'
    | 'PEN-1'
    | 'PEN-2'
    | 'PEN-3'
    | 'PEN-4'
    | 'PEN-5'
    | 'PEN-7'
    | 'SSO';

export interface SecurityFeature {
    name: string;
    desc: string;
    tag: SecurityFeatureTag;
}

export const SECURITY_FEATURES: readonly SecurityFeature[] = [
    // ── Core (criptografía + transporte) ────────────────────────────
    { name: 'Cifrado RSA-OAEP', desc: 'Contraseña cifrada con clave pública antes de enviar; nunca viaja en texto plano.', tag: 'Core' },
    { name: 'Validación en cliente (SRP)', desc: 'Contraseña validada antes de enviar; no vacía. Sin gastar CPU del backend.', tag: 'Core' },
    { name: 'Anti-replay (handshake)', desc: 'Seed único por intento, consumido una sola vez vía Redis GETDEL.', tag: 'Core' },
    { name: 'Argon2id', desc: 'Hashing configurable (16/32/64MB) con versionado automático. Cada hash recuerda sus parámetros originales; migración gradual sin re-encriptar.', tag: 'Core' },
    { name: 'Rate limiting', desc: '5 intentos / 15 min por IP en login (Redis sliding window).', tag: 'Core' },
    { name: 'Refresh Token Rotation', desc: 'Rotación de tokens + detección de robo (RTR). El refresh anterior queda inutilizable.', tag: 'Core' },
    { name: 'JWT firmado', desc: 'RS256 con clave en KMS/S3; validación de firma en cada request. JWKS expuesto en /.well-known/jwks.json.', tag: 'Core' },
    { name: 'Multi-tenant', desc: 'Aislamiento por tenant. Cada user pertenece a un tenant_id que se respeta en queries.', tag: 'Core' },
    { name: 'Auditoría', desc: 'Eventos sensibles registrados (login success/failure, revocación, step-up, binding mismatch).', tag: 'Core' },

    // ── Grado bancario (BCRA Com. A 7724/7783, NIST AAL2, OWASP ASVS L2) ─
    { name: 'Step-up authentication (acr=high)', desc: 'PEN-1 — operaciones críticas requieren acr=high vía POST /auth/step-up/verify (password o TOTP). step_up_exp dura 5 min.', tag: 'PEN-1' },
    { name: 'Binding IP/UA por sesión', desc: 'PEN-2 — claim sid atado a user_sessions con IP /24 IPv4 + navegador+major. Mismatch cierra la sesión y audita.', tag: 'PEN-2' },
    { name: 'Denylist instantánea por jti', desc: 'PEN-3 — revocación granular por token. Fail-closed: si Redis cae, /validate rechaza por defecto.', tag: 'PEN-3' },
    { name: 'Revocación de user (3 capas)', desc: 'PEN-4 — POST /admin/users/{id}/revoke marca en Postgres + Redis denylist + limpia refresh tokens. Orden defensivo: Redis primario.', tag: 'PEN-4' },
    { name: 'Permissions version (pv)', desc: 'PEN-5 — claim opt-in per-app vía header X-App-Id. Bumpeable sin re-login forzado; sirve para invalidación granular de permisos.', tag: 'PEN-5' },
    { name: 'CSP per-app con nonce', desc: 'PEN-7 — middleware aplica Content-Security-Policy declarada por app cliente. Nonce único por request; fallback default si app no la declara.', tag: 'PEN-7' },

    // ── SSO de suite ────────────────────────────────────────────────
    { name: 'OIDC Discovery', desc: 'SSO — /.well-known/openid-configuration permite que librerías OIDC (Auth.js, MSAL, oidc-client-ts) autoconfiguren con una sola URL.', tag: 'SSO' },
    { name: 'UserInfo endpoint', desc: 'SSO — GET /api/auth/userinfo devuelve claims en formato OIDC snake_case (sub, email_verified, tenant_id, acr, amr, auth_time, sid, pv).', tag: 'SSO' },
    { name: 'Cookie compartido cross-app', desc: 'SSO — refresh cookie con Domain configurable (.misuite.com) para compartir sesión entre subdominios.', tag: 'SSO' },
    { name: 'JWT compartido', desc: 'SSO — un JWT (aud="misuite", iss común) válido para N apps cliente que validen contra el mismo JWKS. Login una vez, accedés a toda la suite.', tag: 'SSO' },
];

/** Map de tag → clases tailwind para los chips (bg + text). */
export const TAG_STYLES: Record<SecurityFeatureTag, string> = {
    'Core': 'bg-slate-500/20 text-slate-400',
    'PEN-1': 'bg-purple-500/20 text-purple-300',
    'PEN-2': 'bg-blue-500/20 text-blue-300',
    'PEN-3': 'bg-red-500/20 text-red-300',
    'PEN-4': 'bg-amber-500/20 text-amber-300',
    'PEN-5': 'bg-emerald-500/20 text-emerald-300',
    'PEN-7': 'bg-pink-500/20 text-pink-300',
    'SSO': 'bg-yellow-500/20 text-yellow-300',
};
