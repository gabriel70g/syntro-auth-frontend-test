import { ResetPasswordScreen } from '@flows/reset-password/general/components/ResetPasswordScreen';
import { hasLinkToken } from '@server/link-token';

export default async function ResetPasswordPage() {
    return <ResetPasswordScreen hasToken={await hasLinkToken('reset')} />;
}
