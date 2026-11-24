import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const UPDATED = 'November 24, 2026';
const SUPPORT_EMAIL = import.meta.env.VITE_SUPPORT_EMAIL || '';

function Shell({ title, children }) {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-[#050505] text-neutral-300 px-5 py-8">
      <div className="max-w-2xl mx-auto">
        <button
          onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/'))}
          className="mb-6 inline-flex items-center gap-2 text-sm text-neutral-400 hover:text-white"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <h1 className="text-3xl font-extrabold text-white mb-1">{title}</h1>
        <p className="text-xs text-neutral-500 mb-8">Last updated {UPDATED}</p>
        <div className="space-y-6 text-sm leading-relaxed [&_h2]:text-white [&_h2]:font-bold [&_h2]:text-base [&_h2]:mb-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1 [&_a]:text-[#00FF85]">
          {children}
        </div>
        <div className="mt-10 pt-6 border-t border-white/10 flex gap-4 text-xs text-neutral-500">
          <Link to="/privacy" className="hover:text-white">Privacy Policy</Link>
          <Link to="/terms" className="hover:text-white">Terms of Service</Link>
        </div>
      </div>
    </div>
  );
}

const Contact = () => (
  <section>
    <h2>Contact</h2>
    <p>
      Questions or requests about your data or account:{' '}
      {SUPPORT_EMAIL ? <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a> : 'use the contact details on our app store or website listing.'}
    </p>
  </section>
);

export function Privacy() {
  return (
    <Shell title="Privacy Policy">
      <p>
        RunIQ helps delivery drivers decide whether an offer is worth taking. This policy explains what we collect, why, and the choices you have.
        RunIQ is an independent product and is not affiliated with or endorsed by Walmart, Spark Driver, DoorDash, Uber, or Instacart.
      </p>

      <section>
        <h2>What we collect</h2>
        <ul>
          <li><b>Account:</b> your email address and a password (stored hashed), or your Google account email if you sign in with Google.</li>
          <li><b>Offers you save:</b> platform, pay, tips, miles, estimated time, item count, drop-off area text you type or scan, the rating and calculated figures, and the time saved.</li>
          <li><b>Screenshots you scan:</b> the image is sent to our AI provider to read the numbers on it. We do not store the image. Screenshots may show store names or addresses, so avoid scanning anything you would not want processed.</li>
          <li><b>Subscription:</b> your plan and its status. Payments are handled by Stripe. We never see or store your card number.</li>
          <li><b>Usage and device:</b> daily scan counts, your time zone, and a hashed connection key if you link the Android overlay or iPhone Shortcut. Our host also keeps standard server logs.</li>
          <li><b>On your device only:</b> your MPG and gas price, and display preferences, are kept in your browser storage.</li>
        </ul>
      </section>

      <section>
        <h2>Android overlay (optional, installed separately)</h2>
        <p>
          If you install the optional Android overlay and turn on its accessibility service, it looks at the Spark Driver app screen on your phone to find the pay, miles and item count of an offer.
          Text is read on your phone. Only those numbers are sent to your RunIQ account, never the screenshot. It does not tap, type, or change anything in other apps, and you can turn it off at any time in Android Settings.
        </p>
      </section>

      <section>
        <h2>How we use it</h2>
        <ul>
          <li>To show your offer ratings and trip history.</li>
          <li>To run the service: sign-in, subscriptions, usage limits, and preventing abuse.</li>
          <li>To fix problems and improve the app.</li>
        </ul>
        <p>We do not sell your personal information and we do not use it for advertising.</p>
      </section>

      <section>
        <h2>Who processes it for us</h2>
        <ul>
          <li><b>Supabase:</b> database and sign-in.</li>
          <li><b>Vercel:</b> hosting.</li>
          <li><b>Anthropic:</b> reads scanned screenshots and writes offer ratings. Offer details are sent to it with each request. Under its commercial terms it does not train its models on this data; see Anthropic&apos;s own policy for details.</li>
          <li><b>Stripe:</b> payments and subscription management.</li>
          <li><b>Google:</b> only if you choose Google sign-in.</li>
        </ul>
        <p>We may also disclose information if the law requires it.</p>
      </section>

      <section>
        <h2>Keeping and deleting your data</h2>
        <p>
          We keep your data while your account is open. You can delete individual trips, clear all trips, or permanently delete your account in the app under Settings. Deleting your account cancels any active subscription and removes your trips, keys and login.
          Records we must keep for tax or legal reasons (for example payment records held by Stripe) are kept for as long as the law requires.
        </p>
      </section>

      <section>
        <h2>Your choices and rights</h2>
        <p>
          You can access, correct, or delete your information in the app or by contacting us. Depending on where you live you may have additional rights, such as a copy of your data or to object to certain processing.
        </p>
      </section>

      <section>
        <h2>Security</h2>
        <p>
          Data is sent over HTTPS and each account can only read its own trips. No system is perfectly secure, so we cannot guarantee absolute security.
        </p>
      </section>

      <section>
        <h2>Children</h2>
        <p>RunIQ is for people 18 and older. We do not knowingly collect information from anyone under 18.</p>
      </section>

      <section>
        <h2>Changes</h2>
        <p>If we change this policy in a meaningful way we will update the date above and, where appropriate, tell you in the app.</p>
      </section>

      <Contact />
    </Shell>
  );
}

export function Terms() {
  return (
    <Shell title="Terms of Service">
      <p>
        By creating an account or using RunIQ you agree to these terms. If you do not agree, do not use the app.
      </p>

      <section>
        <h2>What RunIQ is</h2>
        <p>
          RunIQ estimates the value of delivery offers from numbers you enter or scan. RunIQ is independent and is not affiliated with, sponsored, or endorsed by Walmart, Spark Driver, DoorDash, Uber, Instacart, or any delivery platform. Those names belong to their owners and are used only to describe what the app works with.
        </p>
      </section>

      <section>
        <h2>Estimates only</h2>
        <p>
          Ratings, pay-per-hour, pay-per-mile and gas figures are estimates based on what you provide and on assumptions such as your MPG and gas price. They can be wrong. Scans can misread a screenshot, so check the numbers before relying on them. You decide whether to accept any offer, and you are responsible for your own driving, expenses, taxes and income.
        </p>
      </section>

      <section>
        <h2>Delivery platform rules</h2>
        <p>
          You are responsible for following the terms of any delivery platform you use. Some platforms limit how third-party tools may be used with their apps. Do not use RunIQ in a way that breaks those terms or the law, and never use your phone in a way that is unsafe while driving.
        </p>
      </section>

      <section>
        <h2>Accounts</h2>
        <p>
          Keep your login and connection key private. You are responsible for activity on your account. You must be at least 18 and provide accurate information.
        </p>
      </section>

      <section>
        <h2>Subscriptions and billing</h2>
        <ul>
          <li>Free accounts include manual entry and a small number of scans per day. Paid plans raise those limits and unlock the features listed on the pricing page.</li>
          <li>Paid plans renew automatically each month or year until cancelled. The monthly plan may begin with a free trial; if you do not cancel before the trial ends you will be charged.</li>
          <li>Manage or cancel any time in Settings, then Manage Subscription. Cancelling stops future renewals, and you keep access until the end of the period you paid for.</li>
          <li>Except where the law requires otherwise, payments already made are not refundable.</li>
          <li>Prices may change for future billing periods. We will give notice before a change affects you.</li>
          <li>Payments are processed by Stripe.</li>
        </ul>
      </section>

      <section>
        <h2>Fair use</h2>
        <p>
          Daily limits apply to scans, checks and uploads to keep the service available and affordable. Do not abuse, overload, reverse engineer, scrape, or resell the service, or try to get around limits or access other users&apos; data.
        </p>
      </section>

      <section>
        <h2>Ending your account</h2>
        <p>
          You can delete your account at any time in Settings. We may suspend or end accounts that break these terms or put the service at risk.
        </p>
      </section>

      <section>
        <h2>No warranty and limit of liability</h2>
        <p>
          RunIQ is provided &quot;as is&quot; and &quot;as available&quot; without warranties of any kind. To the fullest extent the law allows, we are not liable for lost earnings, missed or declined offers, indirect or consequential damages, and our total liability for any claim is limited to the amount you paid us in the 12 months before it arose. Some places do not allow these limits, so they may not apply to you.
        </p>
      </section>

      <section>
        <h2>Changes</h2>
        <p>We may update these terms. If a change is material we will update the date above, and continuing to use RunIQ means you accept the new terms.</p>
      </section>

      <Contact />
    </Shell>
  );
}
