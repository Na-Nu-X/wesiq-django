# Store Fields For Google Play / App Store Subscriptions (Bought In The Native App Through RevenueCat)

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("app", "0079_officialtrainingplan"),
    ]

    operations = [
        migrations.AddField(
            model_name = "subscription",
            name = "store",
            field = models.CharField(blank = True, choices = [("stripe", "Stripe"), ("play_store", "Google Play"), ("app_store", "App Store"), ("promotional", "RevenueCat")], help_text = "Where the subscription was bought (Stripe on the website, Google Play or App Store in the app).", max_length = 20, null = True, verbose_name = "Store"),
        ),
        migrations.AddField(
            model_name = "subscription",
            name = "store_subscription_id",
            field = models.CharField(blank = True, help_text = "Transaction ID of the Google Play / App Store subscription (from RevenueCat).", max_length = 255, null = True, verbose_name = "Store Subscription ID"),
        ),
        migrations.AddField(
            model_name = "subscription",
            name = "store_product_id",
            field = models.CharField(blank = True, help_text = "Google Play / App Store product of the subscription.", max_length = 255, null = True, verbose_name = "Store Product ID"),
        ),
        migrations.AddField(
            model_name = "subscription",
            name = "revenuecat_app_user_id",
            field = models.CharField(blank = True, help_text = "ID of the user in RevenueCat (the Wesiq user ID).", max_length = 255, null = True, verbose_name = "RevenueCat App User ID"),
        ),
        migrations.AddField(
            model_name = "subscription",
            name = "expires_at",
            field = models.DateTimeField(blank = True, help_text = "End of the paid period of a Google Play / App Store subscription.", null = True, verbose_name = "Expires At"),
        ),
    ]
