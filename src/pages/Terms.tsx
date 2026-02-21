import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { CanonicalTag } from "@/components/CanonicalTag";

export default function Terms() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <CanonicalTag path="/terms" />

      <article className="container mx-auto px-4 py-14 max-w-2xl flex-1">
        <h1 className="text-3xl font-black tracking-tight mb-2">Terms of Service</h1>
        <p className="text-sm text-muted-foreground mb-10">Last updated: February 21, 2026</p>

        <div className="space-y-8 text-sm text-muted-foreground leading-relaxed">
          <section>
            <h2 className="text-lg font-black text-foreground mb-3">1. Acceptance of Terms</h2>
            <p>By accessing or using OpenDraft ("the Platform"), you agree to be bound by these Terms of Service. If you do not agree, do not use the Platform.</p>
          </section>

          <section>
            <h2 className="text-lg font-black text-foreground mb-3">2. Description of Service</h2>
            <p>OpenDraft is a marketplace where users can buy and sell software projects. Sellers list projects for one-time purchase or monthly subscription. Buyers gain access to project code and, for subscriptions, ongoing support from the builder.</p>
          </section>

          <section>
            <h2 className="text-lg font-black text-foreground mb-3">3. User Accounts</h2>
            <p>You must create an account to buy or sell on the Platform. You are responsible for maintaining the confidentiality of your account credentials. You must be at least 18 years old to use the Platform.</p>
          </section>

          <section>
            <h2 className="text-lg font-black text-foreground mb-3">4. Seller Obligations</h2>
            <p>Sellers represent that they own or have the right to sell the projects they list. Sellers must accurately describe their projects, including completeness level. Subscription sellers are expected to provide ongoing support, bug fixes, and periodic updates to subscribers.</p>
          </section>

          <section>
            <h2 className="text-lg font-black text-foreground mb-3">5. Buyer Rights</h2>
            <p>Upon purchase, buyers receive a license to use the project code. One-time purchases grant a perpetual license. Subscriptions grant access for the duration of the active subscription. Buyers may modify the code for their own use.</p>
          </section>

          <section>
            <h2 className="text-lg font-black text-foreground mb-3">6. Fees & Payments</h2>
            <p>OpenDraft charges a 20% platform fee on all transactions. Sellers receive 80% of each sale or subscription payment. Payments are processed by Stripe. Refund policies are at the discretion of the seller, though OpenDraft may intervene in cases of misrepresentation.</p>
          </section>

          <section>
            <h2 className="text-lg font-black text-foreground mb-3">7. Prohibited Content</h2>
            <p>You may not list projects that contain malware, violate third-party intellectual property rights, or are primarily designed for illegal activities. OpenDraft reserves the right to remove any listing at its discretion.</p>
          </section>

          <section>
            <h2 className="text-lg font-black text-foreground mb-3">8. DMCA Policy</h2>
            <p>We respect intellectual property rights. If you believe your copyrighted work has been infringed on the Platform, please contact us at hello@opendraft.com with a detailed description of the alleged infringement.</p>
          </section>

          <section>
            <h2 className="text-lg font-black text-foreground mb-3">9. Limitation of Liability</h2>
            <p>OpenDraft is provided "as is" without warranties of any kind. We are not liable for disputes between buyers and sellers, the quality of listed projects, or any damages arising from use of the Platform.</p>
          </section>

          <section>
            <h2 className="text-lg font-black text-foreground mb-3">10. Changes to Terms</h2>
            <p>We may update these Terms at any time. Continued use of the Platform after changes constitutes acceptance of the updated Terms. Material changes will be communicated via the Platform.</p>
          </section>

          <section>
            <h2 className="text-lg font-black text-foreground mb-3">Contact</h2>
            <p>Questions about these Terms? Contact us at <a href="mailto:hello@opendraft.com" className="text-primary hover:underline">hello@opendraft.com</a>.</p>
          </section>
        </div>
      </article>

      <Footer />
    </div>
  );
}
