type Props = {
    label: string;
    value?: string;
    /** Hint en cursiva al lado del valor (ej: a qué PEN pertenece). */
    hint?: string;
};

/**
 * Why: Fila de claims reutilizable y fácil de testear.
 * Si value es null/undefined/"" no renderiza nada — soporta claims opcionales del JWT.
 */
export function DashboardClaimRow({ label, value, hint }: Props) {
    if (value == null || value === '') return null;
    return (
        <div className="flex gap-2 items-baseline">
            <span className="text-[var(--color-text-dim)] min-w-[140px]">{label}:</span>
            <span className="text-[var(--color-text-strong)] break-all flex-1">
                {value}
                {hint && (
                    <span className="text-[var(--color-text-dim)] text-xs ml-2">
                        — {hint}
                    </span>
                )}
            </span>
        </div>
    );
}
