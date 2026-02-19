import { Link } from "react-router-dom";
import { Zap } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-border/40 bg-background mt-24">
      <div className="container mx-auto px-4 pt-12 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
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
              <li><Link to="/dashboard" className="text-muted-foreground hover:text-foreground transition-colors">Seller dashboard</Link></li>
            </ul>
          </div>

          {/* Account */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">Account</h4>
            <ul className="space-y-3 text-sm">
              <li><Link to="/login" className="text-muted-foreground hover:text-foreground transition-colors">Sign in</Link></li>
              <li><Link to="/profile" className="text-muted-foreground hover:text-foreground transition-colors">My library</Link></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">Legal</h4>
            <ul className="space-y-3 text-sm">
              <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Terms of Service</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">DMCA Policy</a></li>
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
