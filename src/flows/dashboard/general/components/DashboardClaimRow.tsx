type Props = { label: string; value?: string };

/**
 * Why: Fila de claims reutilizable y fácil de testear.
 */
export function DashboardClaimRow({ label, value }: Props) {
    if (value == null) return null;
    return (
        <div style={{ display: 'flex', gap: '0.5rem' }}>
            <span style={{ color: '#64748b', minWidth: '120px' }}>{label}:</span>
            <span style={{ color: '#e2e8f0', wordBreak: 'break-all' }}>{value}</span>
        </div>
    );
}
