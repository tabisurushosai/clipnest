# Stripe Webhook Contract

This document describes the server-side contract for Clipnest license verification.
The Chrome extension does not receive Stripe webhooks directly.

## License key generation

- Generate a unique `license_key` after successful payment.
- Bind the key to a single `extension_id` on first successful verification.
- Store `premium_activated_ts` as Unix milliseconds.

## Verify endpoint

`POST /api/verify-license`

Request body:

```json
{
  "license_key": "XXXX-XXXX",
  "extension_id": "chrome-extension-id"
}
```

Success response:

```json
{
  "valid": true,
  "premium_activated_ts": 1710000000000
}
```

Invalid response:

```json
{
  "valid": false
}
```

## Webhook expectations

- Stripe webhook handler should mark payment as completed.
- Issue or activate the license key tied to the purchaser email or metadata.
- Reject verification when `extension_id` does not match the bound extension.
