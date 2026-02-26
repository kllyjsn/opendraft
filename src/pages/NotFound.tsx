import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { BrandMascot } from "@/components/BrandMascot";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 flex items-center justify-center px-4 py-20">
        <div className="text-center max-w-md page-enter">
          <div className="relative mb-6">
            <span className="text-[120px] md:text-[160px] font-black leading-none text-gradient opacity-10 select-none">404</span>
            <div className="absolute inset-0 flex items-center justify-center">
              <BrandMascot size={140} variant="confused" />
            </div>
          </div>
          <h1 className="text-2xl font-black mb-3">Oops! Page not found</h1>
          <p className="text-muted-foreground text-sm mb-8 leading-relaxed">
            Our little friend couldn't find what you're looking for. The page may have been moved or doesn't exist.
          </p>
          <Link to="/">
            <Button className="gradient-hero text-white border-0 shadow-glow hover:opacity-90 transition-opacity h-11 px-6">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to marketplace
            </Button>
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default NotFound;
