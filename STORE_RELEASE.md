# RunIQ store release checklist

## 1. One-time backend setup
- [ ] Run `supabase/migrations/20261124_per_user_security.sql` in the Supabase SQL editor (uncomment the two lines with your email first).
- [ ] Stripe: create products **Monthly $9.99** and **Annual $79.99**.
- [ ] Stripe: Settings > Billing > **Customer portal** > save a configuration (cancel + update payment method on). "Manage Subscription" fails until this is saved.
- [ ] Stripe: webhook to `https://runiq-ashen.vercel.app/api/stripe-webhook` for `customer.subscription.created`, `.updated`, `.deleted`.
- [ ] Vercel env vars: `SUPABASE_SERVICE_ROLE_KEY`, `ANTHROPIC_API_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_MONTHLY`, `STRIPE_PRICE_ANNUAL`, `APP_URL`, and `VITE_SUPPORT_EMAIL` (shown on the Privacy/Terms pages).
- [ ] Remove `INGEST_SHARED_SECRET` from Vercel (no longer used).
- [ ] Supabase Auth: set Site URL to the production URL and add `https://runiq-ashen.vercel.app/**` to redirect URLs.

## 2. Test before submitting (signed in)
- [ ] Sign up, scan a screenshot, evaluate an offer, save it, see it in history.
- [ ] Hit the free scan limit (5/day) and confirm the upgrade message.
- [ ] Subscribe with Stripe test card `4242 4242 4242 4242`; confirm the Upgrade button disappears and Manage Subscription opens.
- [ ] Settings > Delete my account removes the login, and the Stripe test subscription is cancelled.
- [ ] Two different accounts cannot see each other's trips.

## 3. Google Play (Trusted Web Activity)
Ship the web app only. Do **not** include the accessibility overlay in the Play build.
1. Play Console developer account ($25). Personal accounts must run a closed test with 12 testers for 14 days before production.
2. Go to pwabuilder.com, enter the site URL, choose Android, and build a signed package. Package id suggestion: `com.dte.runiq.app`.
3. Add the signing key SHA-256 to `public/.well-known/assetlinks.json` (the file does not exist yet; PWABuilder gives you the exact JSON) and redeploy.
4. Upload the AAB. Assets are in `public/icons/`: `play-store-icon-512.png`, `play-feature-graphic-1024x500.png`.
5. Phone screenshots (2 to 8) must be taken from the real signed-in app. They are not generated here.

### Play Console answers
- Category: Productivity.
- Content rating: no violence, no user-generated content, no ads. Complete the IARC questionnaire honestly.
- Privacy policy URL: `https://runiq-ashen.vercel.app/privacy`
- Account deletion URL: same app (Settings > Delete my account). The form asks for a URL or steps; describe those steps.
- Data safety: collects email, user-generated offer data, purchase history (subscription status). Data is encrypted in transit; users can request deletion; nothing sold. Screenshots are shared with a processor (Anthropic) for service functionality and are not stored.
- Ads: none. Target age: 18+.

### Listing copy (starting point)
Title: `RunIQ: Gig Offer Calculator`
Short: `Know if a delivery offer is worth it before you accept.`
Full: Scan or type an offer and see pay per hour and per mile after gas and deadhead, with a clear Great/Good/Fair/Bad rating. Keep every trip with daily and all-time totals. Free to start; subscribe for more scans. RunIQ is independent and not affiliated with Walmart, Spark Driver, DoorDash, Uber, or Instacart.

## 4. Apple App Store (later)
- Needs Apple Developer ($99/yr) and a native shell (Capacitor) with real native features; a plain web wrapper is usually rejected.
- Because the app offers Google sign-in, Apple requires **Sign in with Apple** too.
- Subscriptions sold inside an iOS app must use Apple in-app purchase. Selling only on the website is an option but Apple restricts linking to it.

## 5. Android overlay (direct download only)
Google Play restricts accessibility services, so distribute the `android-ocr` APK yourself (website download), with a clear warning that it needs the accessibility permission. Users paste their key from Settings > Phone Connection Key.
Build: open `android-ocr` in Android Studio > Build > Generate Signed App Bundle / APK.

## 6. Still on you
- Have the Terms and Privacy Policy reviewed by a lawyer; they are a solid draft, not legal advice.
- Check Walmart's Spark Driver terms for limits on third-party tools, especially for the overlay.
