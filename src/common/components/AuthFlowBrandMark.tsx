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
 * Why: Misma marca en cabeceras compactas (dashboard, etc.) sin el anillo del login.
 */
export function SyntropySoftLogoCompact() {
    return (
        <a
            href={SYNTROPYSOFT_ORIGIN}
            target="_blank"
            rel="noopener noreferrer"
            className="mb-6 flex w-full items-center justify-center gap-2 text-slate-400 transition-colors hover:text-slate-200"
            aria-label="SyntropySoft — abre en una pestaña nueva"
        >
            <Image src={LOGO} alt="" width={32} height={27} className="object-contain" />
            <span className="text-sm font-medium tracking-tight">SyntropySoft</span>
        </a>
    );
}
