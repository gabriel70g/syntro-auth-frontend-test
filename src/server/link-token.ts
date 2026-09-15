import { cookies } from 'next/headers';
import { COOKIE, decodeLink, type LinkKind } from '@server/cookies';

/** Why: las pantallas de links del correo solo necesitan saber si el token está; nunca reciben el token. */
export async function hasLinkToken(kind: LinkKind): Promise<boolean> {
    const link = decodeLink((await cookies()).get(COOKIE.link)?.value);
    return link?.kind === kind;
}
