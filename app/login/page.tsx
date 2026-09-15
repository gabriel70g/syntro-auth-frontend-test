import { LoginScreen } from '@flows/login/general/components/LoginScreen';
import { oauthErrorMessage } from '@flows/login/general/data/oauth-errors.data';

export default async function LoginPage({
    searchParams,
}: {
    searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
    const { error } = await searchParams;
    return <LoginScreen initialError={oauthErrorMessage(typeof error === 'string' ? error : undefined)} />;
}
