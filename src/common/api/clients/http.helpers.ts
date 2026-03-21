/**
 * Why: Parseo JSON tolerante para capa HTTP.
 */
export async function readJsonSafe(response: Response): Promise<unknown> {
    try {
        return await response.json();
    } catch {
        return null;
    }
}
