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
        <div style={{ marginTop: '1.5rem' }}>
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    marginBottom: '1rem',
                }}
            >
                <div style={{ flex: 1, height: '1px', background: 'rgba(148, 163, 184, 0.2)' }} />
                <span style={{ color: '#94a3b8', fontSize: '0.875rem' }}>o</span>
                <div style={{ flex: 1, height: '1px', background: 'rgba(148, 163, 184, 0.2)' }} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {enabled.map(([key]) => (
                    <button
                        key={key}
                        type="button"
                        onClick={() => onOAuthLogin(key)}
                        disabled={isLoading}
                        style={{
                            width: '100%',
                            padding: '0.75rem',
                            background: 'white',
                            color: '#1f2937',
                            border: '1px solid rgba(148, 163, 184, 0.2)',
                            borderRadius: '8px',
                            fontWeight: '500',
                            cursor: isLoading ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.5rem',
                        }}
                    >
                        {OAUTH_PROVIDER_ICONS[key] ?? null}
                        Continuar con {displayName(key)}
                    </button>
                ))}
            </div>
        </div>
    );
}
