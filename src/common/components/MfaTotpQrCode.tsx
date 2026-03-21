'use client';

import Image from 'next/image';
import QRCode from 'react-qr-code';

/**
 * Why: Mismo activo que en syntropysoft.com (`/syntropylog-logo.png`), versionado en `/public` para export estático.
 */
export const SYNTROPYLOG_QR_LOGO_SRC = '/branding/syntropysoft-logo.png';

type Props = {
    value: string;
    size?: number;
};

/**
 * Why: QR TOTP con marca SyntropyLog centrada; nivel H compensa el área tapada (esta versión de react-qr-code no trae imageSettings).
 */
export function MfaTotpQrCode({ value, size = 200 }: Props) {
    const inner = Math.round(size * 0.24);
    const imgW = Math.round(inner * 0.88);
    const imgH = Math.round(imgW * (837 / 1005));

    return (
        <div
            style={{
                position: 'relative',
                width: size,
                height: size,
                display: 'inline-block',
                lineHeight: 0,
            }}
        >
            <QRCode value={value} size={size} level="H" />
            <div
                style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: inner,
                    height: inner,
                    background: '#ffffff',
                    borderRadius: 8,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 0 0 3px #ffffff',
                }}
            >
                <Image
                    src={SYNTROPYLOG_QR_LOGO_SRC}
                    alt=""
                    width={imgW}
                    height={imgH}
                    className="object-contain"
                    style={{ maxWidth: '88%', maxHeight: '88%' }}
                />
            </div>
        </div>
    );
}
