/**
 * Why: Tenant activo del navegador. syntroAuth busca al usuario DENTRO del tenant del header
 * X-Tenant-Id, así que un usuario de otra empresa no puede loguearse con el tenant default.
 * El id no es secreto; se guarda en localStorage para que sobreviva al cierre de pestaña.
 */

export interface ActiveTenant {
    readonly id: string;
    readonly name: string;
}

const KEY = 'syntroauth_active_tenant';

export function readActiveTenant(): ActiveTenant | null {
    if (typeof window === 'undefined') return null;
    try {
        const raw = window.localStorage.getItem(KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw) as Partial<ActiveTenant>;
        return typeof parsed.id === 'string' && typeof parsed.name === 'string' ? { id: parsed.id, name: parsed.name } : null;
    } catch {
        return null;
    }
}

export function writeActiveTenant(tenant: ActiveTenant | null): void {
    if (typeof window === 'undefined') return;
    try {
        if (tenant) window.localStorage.setItem(KEY, JSON.stringify(tenant));
        else window.localStorage.removeItem(KEY);
    } catch {
        // Storage bloqueado: se sigue con el tenant default.
    }
}
