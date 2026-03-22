/**
 * Why: Contenido del archivo .txt (puro); el usuario puede guardarlo en gestor/carpeta cifrada sin pasar por servidores.
 */
export function buildRecoveryCodesFileBody(codes: string[], preambleLines: string[]): string {
    const body = [...preambleLines, '', '---', '', ...codes, ''].join('\n');
    return body;
}

/**
 * Why: Cabecera fija con aviso de seguridad y marca de tiempo UTC.
 */
export function defaultRecoveryCodesPreamble(): string[] {
    const iso = new Date().toISOString();
    return [
        'SyntroAuth — Códigos de recuperación 2FA',
        `Generado (UTC): ${iso}`,
        '',
        'Guardá este archivo en un lugar seguro (gestor de contraseñas, carpeta cifrada del sistema, cofre).',
        'Cada código suele poder usarse una sola vez; no lo compartas.',
    ];
}

/**
 * Why: Descarga en el navegador; no sube el contenido a ningún backend.
 */
export function downloadTextFile(filename: string, content: string): void {
    if (typeof window === 'undefined') return;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.rel = 'noopener';
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
}

/**
 * Why: Un solo click tras validar MFA; nombre con fecha para archivar.
 */
export function downloadRecoveryCodesTxt(codes: string[]): void {
    if (codes.length === 0) return;
    const content = buildRecoveryCodesFileBody(codes, defaultRecoveryCodesPreamble());
    const day = new Date().toISOString().slice(0, 10);
    downloadTextFile(`syntroauth-recovery-codes-${day}.txt`, content);
}
