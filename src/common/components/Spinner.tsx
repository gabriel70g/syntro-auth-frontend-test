/**
 * Spinner — inline loading indicator. Usa la keyframe spin del theme.
 * Tamaño por default = inline (20px); pasar size para customizar.
 */
interface SpinnerProps {
    size?: string;
    /** Color del trazo. Default: hereda currentColor (sirve en botones gold/blue/etc). */
    color?: string;
    className?: string;
}

export function Spinner({ size = '20px', color, className = '' }: SpinnerProps) {
    return (
        <svg
            className={`spinner ${className}`.trim()}
            style={{ width: size, height: size, color: color ?? 'currentColor' }}
            viewBox="0 0 24 24"
            aria-label="Cargando"
        >
            <circle
                cx="12" cy="12" r="10"
                stroke="currentColor" strokeWidth="4" fill="none"
                opacity="0.25"
            />
            <path
                fill="currentColor"
                opacity="0.75"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
        </svg>
    );
}
