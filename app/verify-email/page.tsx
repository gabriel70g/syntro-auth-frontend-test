import { VerifyEmailScreen } from '@flows/verify-email/general/components/VerifyEmailScreen';
import { hasLinkToken } from '@server/link-token';

export default async function VerifyEmailPage() {
    return <VerifyEmailScreen hasToken={await hasLinkToken('verify')} />;
}
