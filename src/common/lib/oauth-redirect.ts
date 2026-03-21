import { buildOAuthUrl } from '@common/lib/oauth';
import { getRedirectUri } from '@common/lib/config';
import { storeOAuthRedirectUri } from '@common/lib/storage/auth-session.storage';

/**
 * Why: Side effect de navegación OAuth centralizado (no en mapeadores).
 */
export function startOAuthRedirect(provider: string, clientId: string): void {
    if (typeof window === 'undefined') {
        throw new Error('startOAuthRedirect solo en cliente');
    }
    const redirectUri = getRedirectUri();
    storeOAuthRedirectUri(redirectUri);
    window.location.href = buildOAuthUrl(provider, clientId, redirectUri, provider);
}
