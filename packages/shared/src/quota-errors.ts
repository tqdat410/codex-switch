export function formatQuotaErrorMessage(code: string) {
  switch (code) {
    case 'invalid_grant':
      return 'Stored refresh token is no longer valid.';
    case 'endpoint_gone':
      return 'Quota endpoint is no longer available.';
    case 'unauthorized':
      return 'Stored access token was rejected.';
    case 'account_missing':
      return 'Vault snapshot is missing the account id claim.';
    case 'parse':
      return 'Quota response shape was not recognized.';
    case 'network':
      return 'Quota probe could not reach ChatGPT.';
    case 'requires_reauth':
      return 'Re-authenticate this account to restore quota refresh.';
    case 'vault_missing':
      return 'Vault snapshot is missing for this account.';
    case 'vault_invalid':
      return 'Vault snapshot could not be parsed.';
    case 'vault_unavailable':
      return 'Vault snapshot could not be read right now.';
    default:
      return 'Quota refresh failed.';
  }
}
