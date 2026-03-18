import { Link, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useAdmin } from "@/hooks/useAdmin";
import { useUnreadMessages } from "@/hooks/useUnreadMessages";
import { Zap, Menu, X, ShieldCheck, Bot, Lightbulb } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { NotificationBell } from "@/components/NotificationBell";
import { MessageAlert } from "@/components/MessageAlert";
import { CreditBadge } from "@/components/CreditBadge";

function NavItem({ to, children, onClick }: { to: string; children: React.ReactNode; onClick?: () => void }) {
  const { pathname } = useLocation();
  const active = pathname === to || (to !== "/" && pathname.startsWith(to));
  return (
    <Link
      to={to}
      onClick={onClick}
      className={cn(
        "relative text-sm font-medium transition-colors duration-200",
        active
          ? "text-foreground after:absolute after:-bottom-0.5 after:left-0 after:right-0 after:h-[2px] after:rounded-full after:bg-primary after:content-[''] after:block"
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
    <>
    <nav className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-2xl supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 font-black text-xl tracking-tight shrink-0 group">
          <motion.img
            src="/mascot-icon.png"
            alt="OpenDraft mascot"
            className="h-8 w-8 rounded-lg"
            whileHover={{ scale: 1.15, rotate: [0, -8, 8, -4, 0] }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
          />
          <span className="text-gradient">OpenDraft</span>
        </Link>

        {/* Desktop Nav — buyer-first */}
        <div className="hidden md:flex items-center gap-7">
          <NavItem to="/category/saas-tool">Browse</NavItem>
          <NavItem to="/credits">Pricing</NavItem>
          <NavItem to="/builders">Builders</NavItem>
          <NavItem to="/faq">FAQ</NavItem>
          {user && (
            <>
              <NavItem to="/ideas">Ideas</NavItem>
              <NavItem to="/dashboard">My Apps</NavItem>
              <NavItem to="/messages">
                <span className="relative inline-flex items-center">
                  Messages
                  {unreadCount > 0 && (
                    <span className="ml-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold leading-none text-primary-foreground animate-scale-up">
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                  )}
                </span>
              </NavItem>
            </>
          )}
          {isAdmin && (
            <>
              <Link to="/admin" className="text-sm font-medium text-primary hover:opacity-80 transition-opacity duration-200 flex items-center gap-1">
                <ShieldCheck className="h-3.5 w-3.5" /> Admin
              </Link>
              <Link to="/swarm" className="text-sm font-medium text-primary hover:opacity-80 transition-opacity duration-200 flex items-center gap-1">
                <Bot className="h-3.5 w-3.5" /> Swarm
              </Link>
            </>
          )}
        </div>

        {/* Auth buttons */}
        <div className="hidden md:flex items-center gap-3">
          {loading ? (
            <div className="h-8 w-8 rounded-full skeleton-shimmer" />
          ) : user ? (
            <div className="flex items-center gap-3">
              <CreditBadge />
              <NotificationBell />
              <Link to="/profile" className="group relative">
                <div className="h-8 w-8 rounded-full gradient-hero flex items-center justify-center text-white text-xs font-bold ring-2 ring-transparent group-hover:ring-primary/40 transition-all duration-200 group-hover:shadow-glow">
                  {initial}
                </div>
              </Link>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
                className="text-muted-foreground hover:text-foreground transition-colors duration-200"
              >
                Sign out
              </Button>
            </div>
          ) : (
            <>
              <Link to="/login">
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground transition-colors duration-200">
                  Sign in
                </Button>
              </Link>
              <Link to="/">
                <Button size="sm" className="gradient-hero text-white border-0 shadow-glow hover:shadow-[0_0_40px_hsl(265_85%_58%_/_0.35)] hover:opacity-90 transition-all duration-300">
                  Find your app
                </Button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile menu button */}
        <button
          className="md:hidden rounded-lg p-2 hover:bg-muted/80 transition-colors duration-200 active:scale-95"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      <div
        className={cn(
          "md:hidden border-t border-border/40 bg-background/95 backdrop-blur-2xl px-4 overflow-hidden transition-all duration-300 ease-out",
          menuOpen ? "max-h-[500px] py-5 opacity-100" : "max-h-0 py-0 opacity-0"
        )}
      >
        <div className="flex flex-col gap-4">
          <NavItem to="/category/saas-tool" onClick={() => setMenuOpen(false)}>Browse</NavItem>
          <NavItem to="/credits" onClick={() => setMenuOpen(false)}>Pricing</NavItem>
          <NavItem to="/builders" onClick={() => setMenuOpen(false)}>Builders</NavItem>
          <NavItem to="/faq" onClick={() => setMenuOpen(false)}>FAQ</NavItem>
          {user ? (
            <>
              <NavItem to="/dashboard" onClick={() => setMenuOpen(false)}>My Apps</NavItem>
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
                <>
                  <Link to="/admin" className="text-sm font-medium text-primary flex items-center gap-1" onClick={() => setMenuOpen(false)}>
                    <ShieldCheck className="h-3.5 w-3.5" /> Admin
                  </Link>
                  <Link to="/swarm" className="text-sm font-medium text-primary flex items-center gap-1" onClick={() => setMenuOpen(false)}>
                    <Bot className="h-3.5 w-3.5" /> AI Swarm
                  </Link>
                </>
              )}
              <div className="pt-3 border-t border-border/40">
                <Button variant="outline" size="sm" onClick={handleSignOut} className="w-full">
                  Sign out
                </Button>
              </div>
            </>
          ) : (
            <Link to="/login" onClick={() => setMenuOpen(false)}>
              <Button className="w-full gradient-hero text-white border-0 shadow-glow">
                Sign in
              </Button>
            </Link>
          )}
        </div>
      </div>
    </nav>
    <MessageAlert />
    </>
  );
}