import { MfaDisableConfirmScreen } from '@flows/mfa-account-settings/general/components/MfaDisableConfirmScreen';
import { hasLinkToken } from '@server/link-token';

export default async function MfaDisableConfirmPage() {
    return <MfaDisableConfirmScreen hasToken={await hasLinkToken('mfa-disable')} />;
}
