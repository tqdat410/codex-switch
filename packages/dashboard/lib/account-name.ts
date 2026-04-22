const accountNamePattern = /^[a-z0-9_-]{1,32}$/i;

export function validateAccountName(value: unknown) {
  if (typeof value !== 'string' || !accountNamePattern.test(value.trim())) {
    return null;
  }

  return value.trim();
}
