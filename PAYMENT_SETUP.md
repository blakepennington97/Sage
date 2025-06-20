# Payment Integration Setup Guide

This guide walks you through setting up the complete payment system for Sage AI Cooking Coach using Stripe + RevenueCat.

## 📋 Prerequisites

- Stripe account (for payment processing)
- RevenueCat account (for subscription management)
- App Store Connect account (for iOS)
- Google Play Console account (for Android)
- Supabase project with all database migrations applied

## 🏗️ Architecture Overview

```
User → App Store/Play Store → RevenueCat → Stripe → Bank
                ↓
            Webhooks → Supabase → App State Update
```

**Benefits of this architecture:**
- **RevenueCat** handles complex subscription logic and cross-platform compatibility
- **Stripe** processes payments with industry-leading security
- **Webhooks** ensure subscription status stays synchronized
- **Local tracking** provides immediate UI feedback

## 🔧 Setup Instructions

### 1. RevenueCat Setup

#### Create RevenueCat Project
1. Sign up at [RevenueCat](https://www.revenuecat.com/)
2. Create a new project: **"Sage AI Cooking Coach"**
3. Note your **Public API Keys** (iOS & Android)

#### Configure Products
1. Go to **Products** in RevenueCat dashboard
2. Create product: `sage_premium_monthly`
   - **Identifier**: `sage_premium_monthly`
   - **Type**: Subscription
   - **Duration**: 1 month
3. Create entitlement: `premium`
   - Attach `sage_premium_monthly` to this entitlement

#### Configure Offerings
1. Go to **Offerings** in RevenueCat dashboard
2. Create offering: **"Premium Subscription"**
3. Add `sage_premium_monthly` package to offering
4. Set as **current offering**

### 2. App Store Connect Setup (iOS)

#### Create Subscription Product
1. Go to **App Store Connect** → Your App → **Features** → **In-App Purchases**
2. Create new subscription:
   - **Product ID**: `sage_premium_monthly`
   - **Reference Name**: "Sage Premium Monthly"
   - **Subscription Group**: Create new group "Premium Subscriptions"
   - **Duration**: 1 month
   - **Price**: $9.99 USD
   - **Free Trial**: 7 days

#### Configure App Information
1. Add subscription information to app description
2. Set up privacy policy URL
3. Configure subscription terms

### 3. Google Play Console Setup (Android)

#### Create Subscription Product
1. Go to **Play Console** → Your App → **Monetization** → **Products** → **Subscriptions**
2. Create subscription:
   - **Product ID**: `sage_premium_monthly`
   - **Name**: "Sage Premium Monthly"
   - **Billing period**: 1 month
   - **Price**: $9.99 USD
   - **Free trial**: 7 days

### 4. Stripe Setup

#### Connect to RevenueCat
1. In RevenueCat dashboard, go to **Integrations** → **Stripe**
2. Connect your Stripe account
3. Configure webhook endpoint in Stripe dashboard
4. Copy webhook signing secret

### 5. Update App Configuration

#### Environment Variables
Update your `.env` file:

```env
# Existing variables
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Payment configuration
REVENUECAT_IOS_API_KEY=your_ios_api_key_here
REVENUECAT_ANDROID_API_KEY=your_android_api_key_here
STRIPE_WEBHOOK_SECRET=your_webhook_secret_here
```

#### Update Payment Service
Edit `/src/services/payment.ts`:

```typescript
const REVENUECAT_API_KEY = {
  ios: process.env.REVENUECAT_IOS_API_KEY || 'your_ios_api_key_here',
  android: process.env.REVENUECAT_ANDROID_API_KEY || 'your_android_api_key_here',
};
```

### 6. Database Setup

#### Run Migrations
Ensure all migrations are applied in order:

```sql
-- In Supabase SQL Editor, run these in order:
-- 01_user_preferences.sql
-- 02_meal_planning.sql  
-- 03_cost_analysis.sql
-- 04_app_config.sql
-- 05_usage_tracking.sql
-- 06_webhook_events.sql ← New migration for payment integration
```

#### Verify Tables
Check that these tables exist:
- `user_usage_tracking` (usage limits)
- `webhook_events` (payment event logging)
- `user_profiles` (with subscription columns added)

### 7. Webhook Configuration

#### Supabase Edge Function (Recommended)
Create a Supabase Edge Function to handle RevenueCat webhooks:

```typescript
// supabase/functions/revenuecat-webhook/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { webhookHandlerService } from "../../../src/services/webhookHandler.ts"

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  try {
    const webhookData = await req.json()
    const result = await webhookHandlerService.processWebhook(webhookData)
    
    return new Response(JSON.stringify(result), {
      headers: { 'Content-Type': 'application/json' },
      status: result.success ? 200 : 400
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500
    })
  }
})
```

#### Configure RevenueCat Webhook
1. In RevenueCat dashboard, go to **Project Settings** → **Webhooks**
2. Add webhook URL: `https://your-project.supabase.co/functions/v1/revenuecat-webhook`
3. Select events to send (recommended: all subscription events)

## 🧪 Testing

### Test Mode Setup
1. Use RevenueCat **Sandbox** environment for development
2. Use Stripe **Test** mode
3. Use App Store **Sandbox** accounts
4. Use Google Play **Test** accounts

### Test Scenarios
1. **Free Trial Sign-up**
   - User should get 7 days free access
   - Usage limits should be removed
   - Subscription status should update

2. **Trial Conversion**
   - Trial should convert to paid subscription
   - Billing should start after trial period

3. **Subscription Cancellation**
   - User should retain access until period end
   - Access should be revoked after expiration

4. **Failed Payment**
   - User should enter grace period
   - Retry logic should attempt payment

### Debugging Tools
- **RevenueCat Dashboard**: Monitor subscription events
- **Stripe Dashboard**: Track payments and failures
- **Supabase Logs**: Check webhook processing
- **App Logs**: Monitor client-side payment flows

## 🚀 Production Deployment

### Pre-Launch Checklist
- [ ] Switch RevenueCat to **Production** environment
- [ ] Switch Stripe to **Live** mode
- [ ] Update webhook URLs to production endpoints
- [ ] Test complete purchase flow on real devices
- [ ] Verify App Store/Play Store metadata
- [ ] Test webhook handling under load

### Monitoring
- Set up alerts for failed webhooks
- Monitor subscription conversion rates
- Track failed payment rates
- Monitor customer support tickets

## 🔒 Security Considerations

### Data Protection
- Never store payment card information locally
- Use RevenueCat for all payment processing
- Implement webhook signature verification
- Use HTTPS for all webhook endpoints

### User Privacy
- Clearly communicate subscription terms
- Provide easy cancellation process
- Handle data deletion for cancelled users
- Comply with App Store/Play Store policies

## 📊 Key Metrics to Track

### Subscription Metrics
- **Conversion Rate**: Free trial → Paid subscription
- **Churn Rate**: Monthly subscription cancellations
- **Revenue**: Monthly recurring revenue (MRR)
- **Customer Lifetime Value (CLV)**

### Usage Metrics
- **Free Tier Usage**: How often users hit limits
- **Feature Usage**: Which premium features drive conversions
- **Engagement**: Usage patterns of premium vs free users

## 🆘 Troubleshooting

### Common Issues

**"Purchase failed" errors**
- Check product IDs match exactly
- Verify RevenueCat configuration
- Check App Store/Play Store product status

**Subscription status not updating**
- Check webhook URL is correct
- Verify webhook events are being received
- Check Supabase logs for processing errors

**Free trial not working**
- Verify trial period configured in stores
- Check RevenueCat offering configuration
- Test with fresh test accounts

### Support Resources
- [RevenueCat Documentation](https://docs.revenuecat.com/)
- [Stripe Documentation](https://stripe.com/docs)
- [App Store Connect Help](https://help.apple.com/app-store-connect/)
- [Google Play Console Help](https://support.google.com/googleplay/android-developer/)

## 📝 Next Steps

After payment integration is complete:
1. **A/B Test** different pricing strategies
2. **Implement** yearly subscription option
3. **Add** family sharing support
4. **Create** promotional campaigns
5. **Monitor** and optimize conversion funnel

---

**Note**: This setup enables a production-ready subscription system with proper webhook handling, usage tracking, and cross-platform support. The 7-day free trial and $9.99/month pricing provide a compelling value proposition for users transitioning from free to premium tiers.