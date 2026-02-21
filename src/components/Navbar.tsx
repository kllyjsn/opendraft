import { Link, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useAdmin } from "@/hooks/useAdmin";
import { useUnreadMessages } from "@/hooks/useUnreadMessages";
import { Zap, Menu, X, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { NotificationBell } from "@/components/NotificationBell";

function NavItem({ to, children, onClick }: { to: string; children: React.ReactNode; onClick?: () => void }) {
  const { pathname } = useLocation();
  const active = pathname === to || (to !== "/" && pathname.startsWith(to));
  return (
    <Link
      to={to}
      onClick={onClick}
      className={cn(
        "relative text-sm font-medium transition-colors",
        active
          ? "text-foreground after:absolute after:-bottom-0.5 after:left-0 after:right-0 after:h-px after:rounded-full after:bg-primary after:content-[''] after:block"
          : "text-muted-foreground hover:text-foreground"
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
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const initial = user?.email?.[0]?.toUpperCase() ?? "U";

  return (
    <nav className="sticky top-0 z-50 border-b border-border/40 bg-background/85 backdrop-blur-xl">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 font-black text-xl tracking-tight shrink-0">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg gradient-hero shadow-glow">
            <Zap className="h-4 w-4 text-white" />
          </div>
          <span className="text-gradient">OpenDraft</span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-7">
          <NavItem to="/">Browse</NavItem>
          <NavItem to="/bounties">Bounties</NavItem>
          <NavItem to="/cloud">Cloud</NavItem>
          {user && (
            <>
              <NavItem to="/sell">Sell</NavItem>
              <NavItem to="/dashboard">Dashboard</NavItem>
              <NavItem to="/messages">
                <span className="relative inline-flex items-center">
                  Messages
                  {unreadCount > 0 && (
                    <span className="ml-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold leading-none text-primary-foreground">
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                  )}
                </span>
              </NavItem>
            </>
          )}
          {isAdmin && (
            <Link to="/admin" className="text-sm font-medium text-primary hover:opacity-80 transition-colors flex items-center gap-1">
              <ShieldCheck className="h-3.5 w-3.5" /> Admin
            </Link>
          )}
        </div>

        {/* Auth buttons */}
        <div className="hidden md:flex items-center gap-3">
          {loading ? (
            <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
          ) : user ? (
            <div className="flex items-center gap-3">
              <NotificationBell />
              <Link to="/profile" className="group relative">
                <div className="h-8 w-8 rounded-full gradient-hero flex items-center justify-center text-white text-xs font-bold ring-2 ring-transparent group-hover:ring-primary/40 transition-all">
                  {initial}
                </div>
              </Link>
              <Button
                variant="outline"
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
              <Link to="/sell">
                <Button size="sm" className="gradient-hero text-white border-0 shadow-glow hover:opacity-90 transition-opacity">
                  Start selling
                </Button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile menu button */}
        <button
          className="md:hidden rounded-lg p-1.5 hover:bg-muted transition-colors"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-border/40 bg-background/95 backdrop-blur-xl px-4 py-5 flex flex-col gap-4">
          <NavItem to="/" onClick={() => setMenuOpen(false)}>Browse</NavItem>
          <NavItem to="/bounties" onClick={() => setMenuOpen(false)}>Bounties</NavItem>
          <NavItem to="/cloud" onClick={() => setMenuOpen(false)}>Cloud</NavItem>
          {user ? (
            <>
              <NavItem to="/sell" onClick={() => setMenuOpen(false)}>Sell</NavItem>
              <NavItem to="/dashboard" onClick={() => setMenuOpen(false)}>Dashboard</NavItem>
              <NavItem to="/messages" onClick={() => setMenuOpen(false)}>
                <span className="relative inline-flex items-center">
                  Messages
                  {unreadCount > 0 && (
                    <span className="ml-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold leading-none text-primary-foreground">
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                  )}
                </span>
              </NavItem>
              <NavItem to="/profile" onClick={() => setMenuOpen(false)}>Profile</NavItem>
              {isAdmin && (
                <Link to="/admin" className="text-sm font-medium text-primary flex items-center gap-1" onClick={() => setMenuOpen(false)}>
                  <ShieldCheck className="h-3.5 w-3.5" /> Admin
                </Link>
              )}
              <div className="pt-2 border-t border-border">
                <Button variant="outline" size="sm" onClick={handleSignOut} className="w-full">
                  Sign out
                </Button>
              </div>
            </>
          ) : (
            <Link to="/login" onClick={() => setMenuOpen(false)}>
              <Button className="w-full gradient-hero text-white border-0 shadow-glow">
                Sign in with Google
              </Button>
            </Link>
          )}
        </div>
      )}
    </nav>
  );
}
