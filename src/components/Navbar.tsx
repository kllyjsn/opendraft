import { Link, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useAdmin } from "@/hooks/useAdmin";
import { useUnreadMessages } from "@/hooks/useUnreadMessages";
import { useMyOrg } from "@/hooks/useOrg";
import { Menu, X, ShieldCheck, Bot, Building2 } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { NotificationBell } from "@/components/NotificationBell";
import { MessageAlert } from "@/components/MessageAlert";
import { CreditBadge } from "@/components/CreditBadge";
import { OrgInviteBanner } from "@/components/org/OrgInviteBanner";

function NavItem({ to, children, onClick }: { to: string; children: React.ReactNode; onClick?: () => void }) {
  const { pathname } = useLocation();
  const active = pathname === to || (to !== "/" && pathname.startsWith(to));
  return (
    <Link
      to={to}
      onClick={onClick}
      className={cn(
        "text-sm font-medium transition-colors duration-200",
        active ? "text-foreground" : "text-muted-foreground hover:text-foreground"
      )}
    >
      {children}
    </Link>
  );
}

export function Navbar() {
  const { user, signOut, loading } = useAuth();
  const { isAdmin } = useAdmin();
  const { unreadCount } = useUnreadMessages();
  const { org: myOrg } = useMyOrg();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const initial = user?.email?.[0]?.toUpperCase() ?? "U";

  return (
    <>
    <nav className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 font-bold text-xl tracking-tight shrink-0">
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none" className="shrink-0">
            <circle cx="14" cy="14" r="13" stroke="currentColor" strokeWidth="1.5" />
            <circle cx="14" cy="14" r="6" stroke="currentColor" strokeWidth="1.5" />
            <line x1="14" y1="1" x2="14" y2="8" stroke="currentColor" strokeWidth="1.5" />
            <line x1="14" y1="20" x2="14" y2="27" stroke="currentColor" strokeWidth="1.5" />
          </svg>
          <span className="text-foreground">OpenDraft</span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-8">
          {user && myOrg && (
            <NavItem to={`/org/${myOrg.slug}`}>
              <span className="inline-flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5" /> {myOrg.name}
              </span>
            </NavItem>
          )}
          <NavItem to="/category/saas-tool">Browse</NavItem>
          <NavItem to="/credits">Pricing</NavItem>
          <NavItem to="/builders">Builders</NavItem>
          <NavItem to="/faq">FAQ</NavItem>
          <NavItem to="/enterprise">Enterprise</NavItem>
          {user && (
            <>
              <NavItem to="/ideas">Ideas</NavItem>
              <NavItem to="/dashboard">My Apps</NavItem>
              <NavItem to="/messages">
                <span className="relative inline-flex items-center">
                  Messages
                  {unreadCount > 0 && (
                    <span className="ml-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-foreground px-1 text-[10px] font-bold leading-none text-background animate-scale-up">
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                  )}
                </span>
              </NavItem>
            </>
          )}
          {isAdmin && (
            <>
              <Link to="/admin" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors duration-200 flex items-center gap-1">
                <ShieldCheck className="h-3.5 w-3.5" /> Admin
              </Link>
              <Link to="/swarm" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors duration-200 flex items-center gap-1">
                <Bot className="h-3.5 w-3.5" /> Swarm
              </Link>
            </>
          )}
        </div>

        {/* Auth */}
        <div className="hidden md:flex items-center gap-3">
          {loading ? (
            <div className="h-8 w-8 rounded-full skeleton-shimmer" />
          ) : user ? (
            <div className="flex items-center gap-3">
              <CreditBadge />
              <NotificationBell />
              <Link to="/profile" className="group">
                <div className="h-8 w-8 rounded-full bg-foreground flex items-center justify-center text-background text-xs font-bold">
                  {initial}
                </div>
              </Link>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
                className="text-muted-foreground hover:text-foreground"
              >
                Sign out
              </Button>
            </div>
          ) : (
            <>
              <Link to="/login">
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                  Sign in
                </Button>
              </Link>
              <Link to="/">
                <Button size="sm" className="bg-foreground text-background hover:bg-foreground/90 rounded-full px-5">
                  Get started
                </Button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile toggle */}
        <button
          className="md:hidden rounded-lg p-2 hover:bg-muted transition-colors"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      <div
        className={cn(
          "md:hidden border-t border-border bg-background px-4 overflow-hidden transition-all duration-300 ease-out",
          menuOpen ? "max-h-[500px] py-5 opacity-100" : "max-h-0 py-0 opacity-0"
        )}
      >
        <div className="flex flex-col gap-4">
          <NavItem to="/category/saas-tool" onClick={() => setMenuOpen(false)}>Browse</NavItem>
          <NavItem to="/credits" onClick={() => setMenuOpen(false)}>Pricing</NavItem>
          <NavItem to="/builders" onClick={() => setMenuOpen(false)}>Builders</NavItem>
          <NavItem to="/faq" onClick={() => setMenuOpen(false)}>FAQ</NavItem>
          <NavItem to="/enterprise" onClick={() => setMenuOpen(false)}>Enterprise</NavItem>
          {user ? (
            <>
              {myOrg && (
                <NavItem to={`/org/${myOrg.slug}`} onClick={() => setMenuOpen(false)}>
                  <span className="inline-flex items-center gap-1">
                    <Building2 className="h-3.5 w-3.5" /> {myOrg.name}
                  </span>
                </NavItem>
              )}
              <NavItem to="/ideas" onClick={() => setMenuOpen(false)}>Ideas</NavItem>
              <NavItem to="/dashboard" onClick={() => setMenuOpen(false)}>My Apps</NavItem>
              <NavItem to="/messages" onClick={() => setMenuOpen(false)}>
                <span className="relative inline-flex items-center">
                  Messages
                  {unreadCount > 0 && (
                    <span className="ml-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-foreground px-1 text-[10px] font-bold leading-none text-background">
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                  )}
                </span>
              </NavItem>
              <NavItem to="/profile" onClick={() => setMenuOpen(false)}>Profile</NavItem>
              {isAdmin && (
                <>
                  <Link to="/admin" className="text-sm font-medium text-muted-foreground flex items-center gap-1" onClick={() => setMenuOpen(false)}>
                    <ShieldCheck className="h-3.5 w-3.5" /> Admin
                  </Link>
                  <Link to="/swarm" className="text-sm font-medium text-muted-foreground flex items-center gap-1" onClick={() => setMenuOpen(false)}>
                    <Bot className="h-3.5 w-3.5" /> AI Swarm
                  </Link>
                </>
              )}
              <div className="pt-3 border-t border-border">
                <Button variant="outline" size="sm" onClick={handleSignOut} className="w-full">
                  Sign out
                </Button>
              </div>
            </>
          ) : (
            <Link to="/login" onClick={() => setMenuOpen(false)}>
              <Button className="w-full bg-foreground text-background hover:bg-foreground/90">
                Sign in
              </Button>
            </Link>
          )}
        </div>
      </div>
    </nav>
    <MessageAlert />
    {user && <OrgInviteBanner />}
    </>
  );
}
