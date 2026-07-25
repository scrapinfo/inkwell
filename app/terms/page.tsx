export const metadata = { title: 'Terms of Service' }

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-14 sm:px-6">
      <h1 className="font-display text-3xl text-ink-950">Terms of Service</h1>
      <p className="mt-2 text-sm text-ink-500">Last updated: July 22, 2026</p>

      <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        <strong>Not legal advice.</strong> This is a genuine starting point, not a filled-in template —
        but the bracketed placeholders below (governing law, dispute resolution, contact details) are
        left for you to fill in with an actual lawyer, because those depend on where you're
        incorporated and operate, which we don't know.
      </div>

      <div className="prose prose-stone mt-8 max-w-none">
        <h2>1. Acceptance</h2>
        <p>By creating an account or publishing content on Inkwell, you agree to these terms.</p>

        <h2>2. Eligibility</h2>
        <p>
          You must be at least 18 years old and able to enter a binding contract in your jurisdiction to
          create an account. Balances accrued through this service are not currently withdrawable to a
          real payout method — see Section 5.
        </p>

        <h2>3. Your account</h2>
        <p>
          You're responsible for keeping your login credentials secure and for all activity under your
          account. Tell us if you believe your account has been compromised.
        </p>

        <h2>4. Content you submit</h2>
        <p>
          You keep ownership of what you write. By submitting an article, you grant Inkwell a
          non-exclusive, worldwide license to host, display, and distribute it on the platform. You
          confirm that you have the right to publish everything in your submission — including any
          material you link to or quote — and that it doesn't infringe anyone else's rights.
        </p>
        <p>
          Every article is reviewed by an editor before publication, and we may decline to publish, or
          remove already-published content, at our discretion — including content that violates these
          terms or applicable law.
        </p>

        <h2>5. Revenue share — read this carefully</h2>
        <p>
          Published articles accrue a per-view amount into an internal balance shown on your dashboard.
          Importantly:
        </p>
        <ul>
          <li>This balance is not a guarantee of income, and past accrual doesn't guarantee future accrual.</li>
          <li>The per-view rate and the anti-fraud rules that govern it may change at any time.</li>
          <li>
            As of this version of the service, no payout mechanism is connected — your balance is a
            number in our database, not funds held on your behalf, until a payout integration exists and
            is explicitly announced.
          </li>
          <li>Deleting your account forfeits any accrued, unpaid balance.</li>
        </ul>

        <h2>6. Prohibited conduct</h2>
        <p>You agree not to:</p>
        <ul>
          <li>Post unlawful, infringing, harassing, or fraudulent content;</li>
          <li>
            Attempt to manipulate view counts or the revenue-share mechanism — including automated,
            scripted, or IP-spoofed traffic to your own or anyone else's articles;
          </li>
          <li>Attempt to access another user's account or data without authorization.</li>
        </ul>

        <h2>7. Copyright complaints</h2>
        <p>
          If you believe content on Inkwell infringes your copyright, contact{' '}
          <em>[add a designated copyright contact/email before launch]</em> with enough detail to
          identify the work and its location. We'll review and, where appropriate, remove it.
        </p>

        <h2>8. Termination</h2>
        <p>
          You may delete your account at any time. We may suspend or terminate accounts that violate
          these terms.
        </p>

        <h2>9. Disclaimers and limitation of liability</h2>
        <p>
          The service is provided "as is," without warranties of any kind. To the maximum extent
          permitted by law, Inkwell is not liable for indirect, incidental, or consequential damages
          arising from your use of the service.
        </p>

        <h2>10. Governing law</h2>
        <p>
          <em>[Fill in: these terms are governed by the laws of _______, and disputes will be resolved
          in the courts of _______ / by arbitration in _______.]</em> This section needs to reflect
          where you're actually incorporated — leaving it blank or generic is a common way template
          terms fail to hold up.
        </p>

        <h2>11. Changes</h2>
        <p>We may update these terms; continued use after a change means you accept the update.</p>

        <h2>12. Contact</h2>
        <p><em>[add your contact email here before launch]</em></p>
      </div>
    </div>
  )
}
