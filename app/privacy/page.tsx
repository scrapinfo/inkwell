import Link from 'next/link'

export const metadata = { title: 'Privacy Policy' }

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-14 sm:px-6">
      <h1 className="font-display text-3xl text-ink-950">Privacy Policy</h1>
      <p className="mt-2 text-sm text-ink-500">Last updated: July 22, 2026</p>

      <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        <strong>Before you rely on this:</strong> this policy accurately describes what the Inkwell
        codebase actually collects and does — it isn't generic boilerplate. It is <em>not</em> a
        substitute for legal advice. Whether it satisfies your specific obligations depends on facts
        this document can't know — where you're incorporated, where your users are, and what you add
        later (payments, analytics, ads). Have a lawyer review this before you rely on it, and
        definitely before you connect real payouts.
      </div>

      <div className="prose prose-stone mt-8 max-w-none">
        <h2>What we collect</h2>
        <ul>
          <li>
            <strong>Account information.</strong> Your email address and password, handled by Supabase
            Auth. We never see or store your password ourselves.
          </li>
          <li>
            <strong>Content you submit.</strong> Article titles and body content you write, stored so
            we can display and let you edit them.
          </li>
          <li>
            <strong>IP addresses — for anti-fraud purposes only, and only briefly.</strong> When someone
            reads a published article, we record the reader's IP address for up to 90 days, solely to
            detect repeat views from the same address within a 24-hour window and prevent inflated
            per-view earnings. We do not use IP addresses for advertising, profiling, or tracking
            people across sessions, and this data is automatically eligible for deletion after 90 days
            (see <code>purge_old_views()</code> in the project's database schema).
          </li>
          <li>
            <strong>Payout details, if you connect one.</strong> A <code>stripe_account_id</code> field
            exists in the schema for a future payout integration. As shipped, no payment processor is
            actually connected — balances accrue as numbers in the database, not real transferred
            money, until that integration exists.
          </li>
        </ul>

        <h2>Cookies</h2>
        <p>
          We use only the session cookies Supabase Auth needs to keep you signed in. There are no
          advertising cookies, no third-party analytics, and no cross-site tracking. Because these
          cookies are strictly necessary for the service to function, most privacy frameworks (GDPR
          included) don't require a consent banner for them — we still want you to know they're there.
        </p>

        <h2>Who we share data with</h2>
        <p>
          Supabase (our database, authentication, and hosting infrastructure provider) processes data
          on our behalf. We don't sell personal data, and we don't share it with advertisers because we
          don't have any.
        </p>

        <h2>Your rights</h2>
        <p>You can, at any time:</p>
        <ul>
          <li>See what account data we hold about you (your dashboard shows your articles and balance).</li>
          <li>
            Delete your account and everything tied to it — permanently, immediately, and yourself,
            with no need to email anyone — from{' '}
            <Link href="/dashboard/delete-account">your dashboard</Link>. This also removes your
            articles, including published ones.
          </li>
          <li>Contact us to correct inaccurate information.</li>
        </ul>
        <p>
          These map to rights recognized under the EU/UK GDPR, India's Digital Personal Data Protection
          Act 2023, and US state laws like the CCPA — we've tried to implement the underlying rights
          directly rather than just promise them on paper, but we're not claiming certified compliance
          with any specific one of these frameworks.
        </p>

        <h2>Children</h2>
        <p>
          Inkwell is not directed at, and we do not knowingly collect data from, anyone under 18. This
          service involves accruing monetary balances, which generally requires the legal capacity to
          hold a payout account.
        </p>

        <h2>Changes to this policy</h2>
        <p>
          If this changes materially, we'll update the date above. Continued use after a change means
          you accept the update.
        </p>

        <h2>Contact</h2>
        <p>
          Questions about this policy or your data: <em>[add your contact email here before launch]</em>.
        </p>
      </div>
    </div>
  )
}
