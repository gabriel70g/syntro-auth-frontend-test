import type { OAuthProviderView } from '@common/domain/auth.domain';
import { isRecord } from '@common/api/mappers/json-guards';

/**
 * Why: Normaliza /api/auth/oauth/config a mapa usable por la UI.
 */
export function mapOAuthConfigBodyToProviders(body: unknown): Record<string, OAuthProviderView> {
    if (!isRecord(body) || body.success !== true || !isRecord(body.data)) {
        return {};
    }

    const providersRaw = body.data.providers;
    if (!isRecord(providersRaw)) return {};

    const out: Record<string, OAuthProviderView> = {};

    for (const key of Object.keys(providersRaw)) {
        const p = providersRaw[key];
        if (!isRecord(p)) continue;
        const enabled = p.enabled === true;
        const clientId = typeof p.clientId === 'string' ? p.clientId : null;
        out[key.toLowerCase()] = { enabled, clientId };
    }

    return out;
}
