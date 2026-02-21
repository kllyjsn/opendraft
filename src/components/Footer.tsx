import { Link } from "react-router-dom";
import { Zap } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-border/40 bg-background mt-24">
      <div className="container mx-auto px-4 pt-12 pb-8">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-10 mb-12">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 font-black text-lg mb-4">
              <div className="h-7 w-7 rounded-lg gradient-hero flex items-center justify-center shadow-glow">
                <Zap className="h-3.5 w-3.5 text-white" />
              </div>
              <span className="text-gradient">OpenDraft</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
              The marketplace for ready-to-ship projects. Buy, customize, and launch today.
            </p>
          </div>

          {/* Marketplace */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">Marketplace</h4>
            <ul className="space-y-3 text-sm">
              <li><Link to="/" className="text-muted-foreground hover:text-foreground transition-colors">Browse projects</Link></li>
              <li><Link to="/sell" className="text-muted-foreground hover:text-foreground transition-colors">Sell a project</Link></li>
              <li><Link to="/builders" className="text-muted-foreground hover:text-foreground transition-colors">Discover builders</Link></li>
              <li><Link to="/bounties" className="text-muted-foreground hover:text-foreground transition-colors">Bounties</Link></li>
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">Categories</h4>
            <ul className="space-y-3 text-sm">
              <li><Link to="/category/saas-tool" className="text-muted-foreground hover:text-foreground transition-colors">SaaS Tools</Link></li>
              <li><Link to="/category/ai-app" className="text-muted-foreground hover:text-foreground transition-colors">AI Apps</Link></li>
              <li><Link to="/category/landing-page" className="text-muted-foreground hover:text-foreground transition-colors">Landing Pages</Link></li>
              <li><Link to="/category/utility" className="text-muted-foreground hover:text-foreground transition-colors">Utilities</Link></li>
              <li><Link to="/category/game" className="text-muted-foreground hover:text-foreground transition-colors">Games</Link></li>
            </ul>
          </div>

          {/* Built With & Legal */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">Built With</h4>
            <ul className="space-y-3 text-sm">
              <li><Link to="/built-with/lovable" className="text-muted-foreground hover:text-foreground transition-colors">Lovable</Link></li>
              <li><Link to="/built-with/cursor" className="text-muted-foreground hover:text-foreground transition-colors">Cursor</Link></li>
              <li><Link to="/built-with/claude-code" className="text-muted-foreground hover:text-foreground transition-colors">Claude Code</Link></li>
              <li><Link to="/built-with/bolt" className="text-muted-foreground hover:text-foreground transition-colors">Bolt</Link></li>
              <li><Link to="/built-with/replit" className="text-muted-foreground hover:text-foreground transition-colors">Replit</Link></li>
            </ul>
            <h4 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4 mt-6">Legal</h4>
            <ul className="space-y-3 text-sm">
              <li><Link to="/faq" className="text-muted-foreground hover:text-foreground transition-colors">FAQ</Link></li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-border/40 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="text-xs text-muted-foreground">© 2026 OpenDraft. All rights reserved.</span>
          <span className="text-xs text-muted-foreground">Instant delivery · Get paid the moment you sell</span>
        </div>
      </div>
    </footer>
  );
}
