import { Navigate, Link } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useAdmin } from "@/hooks/useAdmin";
import { OutreachPipeline } from "@/components/outreach/OutreachPipeline";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, Radio } from "lucide-react";
import { motion } from "framer-motion";
import { BrandMascot } from "@/components/BrandMascot";

export default function AdminOutreach() {
  const { isAdmin, loading } = useAdmin();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) return <Navigate to="/" replace />;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-6 max-w-7xl">
        {/* Breadcrumb + title */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <div className="flex items-center gap-4">
            <Link to="/admin">
              <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-muted">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black tracking-tight">Sales Outreach</h1>
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10">
                  <Radio className="h-2.5 w-2.5 text-emerald-500 animate-pulse" />
                  <span className="text-[10px] font-bold text-emerald-600">Live</span>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mt-0.5">
                Autonomous B2B pipeline — discover, qualify, and engage leads
              </p>
            </div>
          </div>
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <BrandMascot size={40} variant="happy" />
          </motion.div>
        </motion.div>

        <OutreachPipeline />
      </main>
      <Footer />
    </div>
  );
}
