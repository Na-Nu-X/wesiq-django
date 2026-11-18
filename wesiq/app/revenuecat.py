# RevenueCat (Google Play / App Store Subscriptions Of The Native App)
# The Current State From RevenueCat's REST API Is The Source Of Truth: Webhook Events Can Arrive Late, Twice Or Out Of
# Order, So Every Event Only Triggers A Fresh Read Of The Customer Instead Of Being Applied On Its Own

from datetime import datetime, timezone as datetime_timezone
from urllib.parse import quote

import requests
from django.conf import settings
from django.db import transaction

from app.models import Subscription

REVENUECAT_SUBSCRIBERS_URL = "https://api.revenuecat.com/v1/subscribers/" # Defines The Customer Endpoint (v1)
REQUEST_TIMEOUT_SECONDS = 10 # Defines The Request Timeout

# Entitlements From The Highest Plan Down (A Premium Product Must Not Be Read As Basic)
PLAN_ENTITLEMENTS = (
    ("premium_access", "premium"),
    ("basic_access", "basic"),
)

STORES = ("play_store", "app_store", "promotional") # Stores Synced From RevenueCat (Stripe Is Handled By The Stripe Webhook)

class RevenueCatError(Exception):
    pass

# Function For Parse A RevenueCat Date (ISO 8601, Null For Lifetime Access)
def parseDate(value):
    if not value:
        return None

    return datetime.fromisoformat(value.replace("Z", "+00:00")) # Parses The Date (UTC)

# Function For Get The Customer From RevenueCat
def fetchSubscriber(app_user_id):
    secret_key = getattr(settings, "REVENUECAT_SECRET_KEY", None) # Gets The Secret Key ("sk_...", Never In The App)

    if not secret_key:
        raise RevenueCatError("REVENUECAT_SECRET_KEY is not set.")

    try:
        response = requests.get(
            REVENUECAT_SUBSCRIBERS_URL + quote(str(app_user_id), safe = ""),
            headers = {"Authorization": f"Bearer {secret_key}", "Accept": "application/json"},
            timeout = REQUEST_TIMEOUT_SECONDS
        )

    except requests.RequestException as error:
        raise RevenueCatError(f"RevenueCat request failed: {error}") from error

    if response.status_code != 200:
        raise RevenueCatError(f"RevenueCat returned {response.status_code}: {response.text[:300]}")

    return response.json().get("subscriber") or {} # Gets The Subscriber

# Function For Get The Active Plan Of A Customer (None When No Entitlement Is Active)
def getActiveEntitlement(subscriber, revoked_product_id = None):
    now = datetime.now(datetime_timezone.utc) # Gets The Current Time
    entitlements = subscriber.get("entitlements") or {} # Gets The Entitlements

    for entitlement_id, plan in PLAN_ENTITLEMENTS:
        entitlement = entitlements.get(entitlement_id)

        if not entitlement:
            continue

        product_id = entitlement.get("product_identifier") # Gets The Product

        # A Refund Revokes Access Right Away, Even Before RevenueCat Moves The Expiration Date
        if revoked_product_id and product_id == revoked_product_id:
            continue

        expires_at = parseDate(entitlement.get("expires_date")) # Gets The End Of The Paid Period
        grace_expires_at = parseDate(entitlement.get("grace_period_expires_date")) # Billing Issue Grace Period
        access_ends_at = max([date for date in (expires_at, grace_expires_at) if date], default = None) # Gets The End Of Access

        # Null Means Lifetime Access; Otherwise The Paid Period (Or Grace Period) Must Still Run
        if entitlement.get("expires_date") is None or (access_ends_at and access_ends_at > now):
            return {
                "plan": plan,
                "product_id": product_id,
                "expires_at": access_ends_at,
            }

    return None

# Function For Update The Subscription Of A User From RevenueCat
def syncUserSubscription(user, revoked_product_id = None):
    subscriber = fetchSubscriber(user.id) # Gets The Customer (The App Logs In To RevenueCat With The Wesiq User ID)
    active = getActiveEntitlement(subscriber, revoked_product_id) # Gets The Active Plan

    with transaction.atomic():
        subscription = Subscription.objects.select_for_update().filter(user = user).first() # Gets The Current Subscription

        # A Running Website (Stripe) Subscription Is Managed By The Stripe Webhook; The Store Never Overwrites It
        has_active_stripe = bool(subscription and subscription.is_active and subscription.stripe_subscription_id and subscription.store in (None, "stripe"))

        if has_active_stripe:
            return subscription

        if not active:
            # Ends Only A Store Subscription (A Free Row Or An Ended Stripe Row Stays As It Is)
            if subscription and subscription.store in STORES and (subscription.is_active or subscription.plan != "free"):
                subscription.plan = "free"
                subscription.is_active = False
                subscription.save()

            return subscription

        store_subscription = (subscriber.get("subscriptions") or {}).get(active["product_id"]) or {} # Gets The Store Details Of The Product
        store = store_subscription.get("store") # "play_store", "app_store", "promotional", ...

        if subscription is None:
            subscription = Subscription(user = user)

        subscription.store = store if store in STORES else "promotional"
        subscription.store_subscription_id = store_subscription.get("store_transaction_id") or subscription.store_subscription_id
        subscription.store_product_id = active["product_id"]
        subscription.revenuecat_app_user_id = str(user.id)
        subscription.expires_at = active["expires_at"]
        subscription.plan = active["plan"]
        subscription.is_active = True
        subscription.is_cancelled = bool(store_subscription.get("unsubscribe_detected_at")) # Auto-Renew Turned Off (Access Stays Until "expires_at")
        subscription.save()

        return subscription
