import { Link } from "react-router-dom";
import { Zap } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-border bg-card mt-20">
      <div className="container mx-auto px-4 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 font-black text-lg mb-3">
              <div className="h-7 w-7 rounded-lg gradient-hero flex items-center justify-center">
                <Zap className="h-3.5 w-3.5 text-white" />
              </div>
              <span className="text-gradient">OpenDraft</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              The marketplace for vibe-coded projects. Buy and sell AI-generated apps, tools, and templates.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-sm mb-3">Marketplace</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/" className="hover:text-foreground transition-colors">Browse</Link></li>
              <li><Link to="/sell" className="hover:text-foreground transition-colors">Sell a project</Link></li>
              <li><Link to="/dashboard" className="hover:text-foreground transition-colors">Seller dashboard</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-sm mb-3">Account</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/login" className="hover:text-foreground transition-colors">Sign in</Link></li>
              <li><Link to="/profile" className="hover:text-foreground transition-colors">Purchase history</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-sm mb-3">Legal</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-foreground transition-colors">Terms of Service</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">DMCA Policy</a></li>
              <li><Link to="/faq" className="hover:text-foreground transition-colors">FAQ</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-8 pt-6 border-t border-border flex flex-col md:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
          <span>© 2026 OpenDraft. All rights reserved.</span>
          <span>Instant delivery. Get paid the moment your project sells.</span>
        </div>
      </div>
    </footer>
  );
}
