import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { CanonicalTag } from "@/components/CanonicalTag";

export default function Privacy() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <CanonicalTag path="/privacy" />

      <article className="container mx-auto px-4 py-14 max-w-2xl flex-1">
        <h1 className="text-3xl font-black tracking-tight mb-2">Privacy Policy</h1>
        <p className="text-sm text-muted-foreground mb-10">Last updated: February 21, 2026</p>

        <div className="space-y-8 text-sm text-muted-foreground leading-relaxed">
          <section>
            <h2 className="text-lg font-black text-foreground mb-3">1. Information We Collect</h2>
            <p><strong className="text-foreground">Account information:</strong> When you create an account, we collect your email address, username, and optional profile details (bio, avatar).</p>
            <p className="mt-2"><strong className="text-foreground">Payment information:</strong> Payment processing is handled by Stripe. We do not store credit card numbers or bank account details on our servers.</p>
            <p className="mt-2"><strong className="text-foreground">Usage data:</strong> We collect anonymous usage data including page views, feature usage, and session duration to improve the Platform.</p>
          </section>

          <section>
            <h2 className="text-lg font-black text-foreground mb-3">2. How We Use Your Information</h2>
            <p>We use your information to: provide and maintain the Platform, process transactions, send notifications about your account and purchases, improve our services, and communicate important updates.</p>
          </section>

          <section>
            <h2 className="text-lg font-black text-foreground mb-3">3. Information Sharing</h2>
            <p>We do not sell your personal information. We share data only with: Stripe (payment processing), email service providers (transactional emails), and as required by law. Seller usernames and profile information are publicly visible on the Platform.</p>
          </section>

          <section>
            <h2 className="text-lg font-black text-foreground mb-3">4. Data Security</h2>
            <p>We implement industry-standard security measures to protect your information, including encryption in transit (TLS/SSL), secure database storage, and access controls. However, no method of transmission over the internet is 100% secure.</p>
          </section>

          <section>
            <h2 className="text-lg font-black text-foreground mb-3">5. Cookies</h2>
            <p>We use essential cookies for authentication and session management. We may use analytics cookies to understand how the Platform is used. You can disable cookies in your browser settings, though some features may not function properly.</p>
          </section>

          <section>
            <h2 className="text-lg font-black text-foreground mb-3">6. Your Rights</h2>
            <p>You have the right to: access your personal data, correct inaccurate data, request deletion of your data, and export your data. To exercise these rights, contact us at hello@opendraft.com.</p>
          </section>

          <section>
            <h2 className="text-lg font-black text-foreground mb-3">7. Data Retention</h2>
            <p>We retain your account information for as long as your account is active. Transaction records are retained for legal and accounting purposes. You may request deletion of your account at any time.</p>
          </section>

          <section>
            <h2 className="text-lg font-black text-foreground mb-3">8. Children's Privacy</h2>
            <p>The Platform is not intended for users under 18. We do not knowingly collect information from children under 18.</p>
          </section>

          <section>
            <h2 className="text-lg font-black text-foreground mb-3">9. Changes to This Policy</h2>
            <p>We may update this Privacy Policy from time to time. We will notify you of material changes by posting the new policy on this page with an updated date.</p>
          </section>

          <section>
            <h2 className="text-lg font-black text-foreground mb-3">Contact</h2>
            <p>Questions about this policy? Contact us at <a href="mailto:hello@opendraft.com" className="text-primary hover:underline">hello@opendraft.com</a>.</p>
          </section>
        </div>
      </article>

      <Footer />
    </div>
  );
}
