import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { CheckCircle, ShoppingBag, ArrowRight } from "lucide-react";

export default function Success() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 flex items-center justify-center px-4 py-20">
        <div className="text-center max-w-md">
          <div className="inline-flex h-20 w-20 items-center justify-center rounded-full gradient-hero shadow-glow mb-6">
            <CheckCircle className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-3xl font-black mb-3">Purchase successful! 🎉</h1>
          <p className="text-muted-foreground mb-8">
            Your project is ready. Head to your profile to access the download link or GitHub repo.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/profile">
              <Button className="gradient-hero text-white border-0 shadow-glow hover:opacity-90">
                <ShoppingBag className="h-4 w-4 mr-2" />
                View my purchases
              </Button>
            </Link>
            <Link to="/">
              <Button variant="outline">
                Browse more <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
