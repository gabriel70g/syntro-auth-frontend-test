/** Why: vista de acceso denegado, presentacional pura (sin estado). */
export const RestrictedAccess = () => (
    <div className="sec-restricted">
        <p className="sec-restricted__title">Acceso restringido</p>
        <p className="sec-restricted__body">
            Esta es la consola de seguridad de la suite. Requiere rol de administrador.
        </p>
    </div>
);
