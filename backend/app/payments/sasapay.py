"""
Thin wrapper around the SasaPay WaaS/C2B API.

Credentials come from the PaymentSettings singleton row (set via the admin
Settings tab), not environment variables — this is intentional, so the store
owner can wire up payments from the dashboard without redeploying.

Docs referenced: https://docs.sasapay.app/docs/authentication/
                  https://docs.sasapay.app/docs/customerTobusiness/
"""
import base64
import requests

SASAPAY_BASE_URL = "https://sandbox.sasapay.app/api/v1"  # switch to the production
                                                            # host once you're off sandbox


class SasaPayError(Exception):
    pass


def get_access_token(client_id, client_secret):
    """Exchanges client_id/client_secret for a bearer token.
    Raises SasaPayError on any failure — used both for real payment requests
    and as a 'test connection' check when the admin saves settings."""
    credentials = base64.b64encode(f"{client_id}:{client_secret}".encode()).decode()
    url = f"{SASAPAY_BASE_URL}/auth/token/?grant_type=client_credentials"

    try:
        resp = requests.get(url, headers={"Authorization": f"Basic {credentials}"}, timeout=15)
    except requests.RequestException as e:
        raise SasaPayError(f"Could not reach SasaPay: {e}")

    if resp.status_code != 200:
        raise SasaPayError(f"SasaPay rejected these credentials (HTTP {resp.status_code}): {resp.text[:200]}")

    data = resp.json()
    token = data.get("access_token")
    if not token:
        raise SasaPayError("SasaPay did not return an access token — check your Client ID/Secret.")
    return token


def request_payment(settings, phone_number, amount, account_reference, callback_url, description="Order payment"):
    """Triggers an STK-style prompt (for mobile money) or OTP flow (for the
    SasaPay wallet) to the customer's phone. Returns the raw SasaPay response
    dict, which includes CheckoutRequestID — store that on the Order so the
    callback can be matched back to it."""
    token = get_access_token(settings.sasapay_client_id, settings.sasapay_client_secret)

    url = f"{SASAPAY_BASE_URL}/payments/request-payment/"
    payload = {
        "MerchantCode": settings.sasapay_merchant_code,
        "NetworkCode": settings.sasapay_network_code or "63902",
        "Currency": "KES",
        "Amount": str(amount),
        "CallBackURL": callback_url,
        "PhoneNumber": phone_number,
        "TransactionDesc": description,
        "AccountReference": account_reference,
    }

    try:
        resp = requests.post(url, json=payload, headers={"Authorization": f"Bearer {token}"}, timeout=20)
    except requests.RequestException as e:
        raise SasaPayError(f"Could not reach SasaPay: {e}")

    data = resp.json() if resp.content else {}
    if resp.status_code not in (200, 201) or data.get("status") is False:
        raise SasaPayError(data.get("detail") or f"SasaPay request failed (HTTP {resp.status_code})")

    return data
