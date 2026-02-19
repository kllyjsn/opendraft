import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { Zap, Menu, X } from "lucide-react";
import { useState } from "react";

export function Navbar() {
  const { user, signOut, loading } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <nav className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 font-black text-xl tracking-tight">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg gradient-hero shadow-glow">
            <Zap className="h-4 w-4 text-white" />
          </div>
          <span className="text-gradient">OpenDraft</span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-6">
          <Link to="/" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Browse
          </Link>
          {user && (
            <>
              <Link to="/sell" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                Sell
              </Link>
              <Link to="/dashboard" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                Dashboard
              </Link>
            </>
          )}
        </div>

        {/* Auth buttons */}
        <div className="hidden md:flex items-center gap-3">
          {loading ? null : user ? (
            <div className="flex items-center gap-3">
              <Link to="/profile">
                <div className="h-8 w-8 rounded-full gradient-hero flex items-center justify-center text-white text-xs font-bold">
                  {user.email?.[0]?.toUpperCase() ?? "U"}
                </div>
              </Link>
              <Button variant="outline" size="sm" onClick={handleSignOut}>
                Sign out
              </Button>
            </div>
          ) : (
            <>
              <Link to="/login">
                <Button variant="ghost" size="sm">Sign in</Button>
              </Link>
              <Link to="/sell">
                <Button size="sm" className="gradient-hero text-white border-0 shadow-glow hover:opacity-90">
                  Start selling
                </Button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile menu button */}
        <button className="md:hidden" onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-border bg-background px-4 py-4 flex flex-col gap-3">
          <Link to="/" className="text-sm font-medium" onClick={() => setMenuOpen(false)}>Browse</Link>
          {user ? (
            <>
              <Link to="/sell" className="text-sm font-medium" onClick={() => setMenuOpen(false)}>Sell</Link>
              <Link to="/dashboard" className="text-sm font-medium" onClick={() => setMenuOpen(false)}>Dashboard</Link>
              <Link to="/profile" className="text-sm font-medium" onClick={() => setMenuOpen(false)}>Profile</Link>
              <Button variant="outline" size="sm" onClick={handleSignOut}>Sign out</Button>
            </>
          ) : (
            <Link to="/login" onClick={() => setMenuOpen(false)}>
              <Button className="w-full gradient-hero text-white border-0">Sign in with Google</Button>
            </Link>
          )}
        </div>
      )}
    </nav>
  );
}
