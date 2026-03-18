import { Link } from "react-router-dom";
import { MascotHammock } from "@/components/MascotHammock";

export function Footer() {
  return (
    <footer className="border-t border-border/40 bg-background mt-16 md:mt-24 relative">
      {/* Subtle top gradient */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />

      <div className="container mx-auto px-4 pt-14 pb-8">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-10 mb-14">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 font-black text-lg mb-4">
              <img src="/mascot-icon.png" alt="OpenDraft mascot" className="h-7 w-7 rounded-lg bg-white/90 p-0.5" />
              <span className="text-gradient">OpenDraft</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
              Stop renting SaaS. Paste your site, get a custom app you own — zero per-seat fees, ever.
            </p>
          </div>

          {/* Marketplace */}
          <div>
            <h4 className="text-[11px] font-bold uppercase tracking-widest text-foreground mb-4">Marketplace</h4>
            <ul className="space-y-3 text-sm">
              <li><Link to="/category/saas-tool" className="text-muted-foreground hover:text-foreground transition-colors duration-200">Browse projects</Link></li>
              <li><Link to="/sell" className="text-muted-foreground hover:text-foreground transition-colors duration-200">Sell a project</Link></li>
              <li><Link to="/builders" className="text-muted-foreground hover:text-foreground transition-colors duration-200">Discover builders</Link></li>
              <li><Link to="/bounties" className="text-muted-foreground hover:text-foreground transition-colors duration-200">Bounties</Link></li>
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h4 className="text-[11px] font-bold uppercase tracking-widest text-foreground mb-4">Categories</h4>
            <ul className="space-y-3 text-sm">
              <li><Link to="/category/saas-tool" className="text-muted-foreground hover:text-foreground transition-colors duration-200">SaaS Tools</Link></li>
              <li><Link to="/category/ai-app" className="text-muted-foreground hover:text-foreground transition-colors duration-200">AI Apps</Link></li>
              <li><Link to="/category/landing-page" className="text-muted-foreground hover:text-foreground transition-colors duration-200">Landing Pages</Link></li>
              <li><Link to="/category/utility" className="text-muted-foreground hover:text-foreground transition-colors duration-200">Utilities</Link></li>
              <li><Link to="/category/game" className="text-muted-foreground hover:text-foreground transition-colors duration-200">Games</Link></li>
            </ul>
          </div>

          {/* Built With & Legal */}
          <div>
            <h4 className="text-[11px] font-bold uppercase tracking-widest text-foreground mb-4">Built With</h4>
            <ul className="space-y-3 text-sm">
              <li><Link to="/built-with/lovable" className="text-muted-foreground hover:text-foreground transition-colors duration-200">Lovable</Link></li>
              <li><Link to="/built-with/cursor" className="text-muted-foreground hover:text-foreground transition-colors duration-200">Cursor</Link></li>
              <li><Link to="/built-with/claude-code" className="text-muted-foreground hover:text-foreground transition-colors duration-200">Claude Code</Link></li>
              <li><Link to="/built-with/bolt" className="text-muted-foreground hover:text-foreground transition-colors duration-200">Bolt</Link></li>
              <li><Link to="/built-with/replit" className="text-muted-foreground hover:text-foreground transition-colors duration-200">Replit</Link></li>
            </ul>
            <h4 className="text-[11px] font-bold uppercase tracking-widest text-foreground mb-4 mt-8">Legal</h4>
            <ul className="space-y-3 text-sm">
              <li><Link to="/security" className="text-secondary hover:text-secondary/80 transition-colors duration-200 font-semibold flex items-center gap-1.5">🛡️ Security Standards</Link></li>
              <li><Link to="/terms" className="text-muted-foreground hover:text-foreground transition-colors duration-200">Terms of Service</Link></li>
              <li><Link to="/privacy" className="text-muted-foreground hover:text-foreground transition-colors duration-200">Privacy Policy</Link></li>
              <li><Link to="/faq" className="text-muted-foreground hover:text-foreground transition-colors duration-200">FAQ</Link></li>
              <li><Link to="/blog" className="text-muted-foreground hover:text-foreground transition-colors duration-200">Blog</Link></li>
              <li><Link to="/guides/sell" className="text-muted-foreground hover:text-foreground transition-colors duration-200">Seller Guide</Link></li>
              <li><Link to="/developers" className="text-muted-foreground hover:text-foreground transition-colors duration-200">Developers</Link></li>
              <li><Link to="/openclaw" className="text-muted-foreground hover:text-foreground transition-colors duration-200">OpenClaw</Link></li>
              <li><Link to="/pitch" className="text-muted-foreground hover:text-foreground transition-colors duration-200">Investors</Link></li>
            </ul>
          </div>
        </div>

        {/* Hammock mascot */}
        <div className="flex justify-center mb-8 -mt-2">
          <MascotHammock size={100} />
        </div>

        {/* Bottom bar */}
        <div className="divider-gradient mb-6" />
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="text-xs text-muted-foreground">© 2026 OpenDraft. All rights reserved.</span>
          <span className="text-xs text-muted-foreground">Own the code · Zero per-seat fees · Deploy in 90s</span>
        </div>
      </div>
    </footer>
  );
}