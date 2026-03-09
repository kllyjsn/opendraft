import { useEffect, useState, useCallback } from "react";
import { Navigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useAdmin } from "@/hooks/useAdmin";
import { OutreachPipeline } from "@/components/outreach/OutreachPipeline";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";

export default function AdminOutreach() {
  const { isAdmin, loading } = useAdmin();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) return <Navigate to="/" replace />;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex items-center gap-3 mb-8">
          <Link to="/admin">
            <Button variant="ghost" size="sm" className="gap-1.5">
              <ArrowLeft className="h-4 w-4" /> Admin
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-black">Outreach Pipeline</h1>
            <p className="text-sm text-muted-foreground">Discover → Score → Draft → Send → Follow Up</p>
          </div>
        </div>
        <OutreachPipeline />
      </main>
      <Footer />
    </div>
  );
}
