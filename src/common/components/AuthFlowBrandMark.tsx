import Image from 'next/image';

/**
 * Why: Marca [SyntropySoft](https://syntropysoft.com/) en flujos auth; PNG en `/public` para static export sin depender del CDN en runtime.
 */
export const SYNTROPYSOFT_ORIGIN = 'https://syntropysoft.com/';
const LOGO = '/branding/syntropysoft-logo.png';

export function AuthFlowBrandMark() {
    return (
        <a
            href={SYNTROPYSOFT_ORIGIN}
            target="_blank"
            rel="noopener noreferrer"
            className="auth-brand-mark-link"
            aria-label="SyntropySoft — abre en una pestaña nueva"
        >
            <span className="logo-ring">
                <span className="logo-inner logo-inner--syntropy">
                    <Image
                        src={LOGO}
                        alt=""
                        width={72}
                        height={60}
                        className="syntropy-brand-img"
                    />
                </span>
            </span>
        </a>
    );
}

/**
 * Why: Sello de seguridad "syntropysoft" minúsculo, fijo abajo-derecha en toda la app.
 * SyntroAuth va al frente; syntropysoft respalda la seguridad, discreto.
 */
export function SecuredByBadge() {
    return (
        <a
            href={SYNTROPYSOFT_ORIGIN}
            target="_blank"
            rel="noopener noreferrer"
            className="secured-badge"
            aria-label="Seguridad por syntropysoft — abre en una pestaña nueva"
        >
            <Image src={LOGO} alt="" width={16} height={14} className="secured-badge__logo" />
            <span className="secured-badge__text">syntropysoft</span>
        </a>
    );
}

/**
 * Why: Misma marca en cabeceras compactas (dashboard, etc.) sin el anillo del login.
 */
export function SyntropySoftLogoCompact() {
    return (
        <a
            href={SYNTROPYSOFT_ORIGIN}
            target="_blank"
            rel="noopener noreferrer"
            className="mb-6 flex w-full items-center justify-center gap-2 text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text-strong)]"
            aria-label="SyntropySoft — abre en una pestaña nueva"
        >
            <Image src={LOGO} alt="" width={32} height={27} className="object-contain" />
            <span className="text-sm font-medium tracking-tight">SyntropySoft</span>
        </a>
    );
}
