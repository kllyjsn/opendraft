import { Link } from "react-router-dom";

export function Footer() {
  return (
    <footer className="border-t border-border bg-background mt-16 md:mt-24">
      <div className="container mx-auto px-4 pt-14 pb-8">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 md:gap-10 mb-14">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 font-bold text-lg mb-4">
              <svg width="24" height="24" viewBox="0 0 28 28" fill="none" className="shrink-0">
                <circle cx="14" cy="14" r="13" stroke="currentColor" strokeWidth="1.5" />
                <circle cx="14" cy="14" r="6" stroke="currentColor" strokeWidth="1.5" />
                <line x1="14" y1="1" x2="14" y2="8" stroke="currentColor" strokeWidth="1.5" />
                <line x1="14" y1="20" x2="14" y2="27" stroke="currentColor" strokeWidth="1.5" />
              </svg>
              <span className="text-foreground">OpenDraft</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
              The platform built for enterprises. Own your software — zero per-seat fees, ever.
            </p>
          </div>

          {/* Product */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground mb-4">Product</h4>
            <ul className="space-y-3 text-sm">
              <li><Link to="/category/saas-tool" className="text-muted-foreground hover:text-foreground transition-colors">Browse</Link></li>
              <li><Link to="/sell" className="text-muted-foreground hover:text-foreground transition-colors">Sell a project</Link></li>
              <li><Link to="/builders" className="text-muted-foreground hover:text-foreground transition-colors">Builders</Link></li>
              <li><Link to="/bounties" className="text-muted-foreground hover:text-foreground transition-colors">Bounties</Link></li>
            </ul>
          </div>

          {/* Solutions */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground mb-4">Solutions</h4>
            <ul className="space-y-3 text-sm">
              <li><Link to="/category/saas-tool" className="text-muted-foreground hover:text-foreground transition-colors">SaaS Tools</Link></li>
              <li><Link to="/category/ai-app" className="text-muted-foreground hover:text-foreground transition-colors">AI Apps</Link></li>
              <li><Link to="/category/landing-page" className="text-muted-foreground hover:text-foreground transition-colors">Landing Pages</Link></li>
              <li><Link to="/category/utility" className="text-muted-foreground hover:text-foreground transition-colors">Utilities</Link></li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground mb-4">Resources</h4>
            <ul className="space-y-3 text-sm">
              <li><Link to="/blog" className="text-muted-foreground hover:text-foreground transition-colors">Blog</Link></li>
              <li><Link to="/guides/sell" className="text-muted-foreground hover:text-foreground transition-colors">Seller Guide</Link></li>
              <li><Link to="/developers" className="text-muted-foreground hover:text-foreground transition-colors">Developers</Link></li>
              <li><Link to="/faq" className="text-muted-foreground hover:text-foreground transition-colors">FAQ</Link></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground mb-4">Company</h4>
            <ul className="space-y-3 text-sm">
              <li><Link to="/security" className="text-muted-foreground hover:text-foreground transition-colors">Security</Link></li>
              <li><Link to="/terms" className="text-muted-foreground hover:text-foreground transition-colors">Terms of Service</Link></li>
              <li><Link to="/privacy" className="text-muted-foreground hover:text-foreground transition-colors">Privacy Policy</Link></li>
              <li><Link to="/pitch" className="text-muted-foreground hover:text-foreground transition-colors">Investors</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border pt-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <span className="text-xs text-muted-foreground">© 2026 OpenDraft. All rights reserved.</span>
            <span className="text-xs text-muted-foreground">Own the code · Zero per-seat fees · Deploy in 90s</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
