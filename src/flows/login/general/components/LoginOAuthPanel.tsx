import type { OAuthProviderView } from '@common/domain/auth.domain';
import { OAUTH_PROVIDER_ICONS } from '@flows/login/general/data/oauth-provider-icons.data';

type Props = {
    oauthProviders: Record<string, OAuthProviderView>;
    isLoading: boolean;
    onOAuthLogin: (provider: string) => void;
};

const DISPLAY_NAMES: Readonly<Record<string, string>> = {
    github: 'GitHub',
};

function displayName(key: string): string {
    return DISPLAY_NAMES[key] ?? key.charAt(0).toUpperCase() + key.slice(1);
}

function filterEnabledProviders(
    providers: Record<string, OAuthProviderView>,
): [string, OAuthProviderView][] {
    return Object.entries(providers).filter(([, cfg]) => cfg.enabled && cfg.clientId);
}

/**
 * Why: Bloque OAuth dinámico — renderiza un botón por cada proveedor que el backend reporte.
 */
export function LoginOAuthPanel({ oauthProviders, isLoading, onOAuthLogin }: Props) {
    const enabled = filterEnabledProviders(oauthProviders);
    if (enabled.length === 0) return null;

    return (
        <div className="oauth-section">
            <div className="oauth-divider">
                <div className="oauth-divider-line" />
                <span className="oauth-divider-text">o</span>
                <div className="oauth-divider-line" />
            </div>

            <div className="oauth-list">
                {enabled.map(([key]) => (
                    <button
                        key={key}
                        type="button"
                        onClick={() => onOAuthLogin(key)}
                        disabled={isLoading}
                        className="oauth-button"
                    >
                        <span className="oauth-button-icon">
                            {OAUTH_PROVIDER_ICONS[key] ?? null}
                        </span>
                        Continuar con {displayName(key)}
                    </button>
                ))}
            </div>
        </div>
    );
}
