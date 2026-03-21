import { useEffect, lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";

import { useFunnelTracker } from "@/hooks/useFunnelTracker";

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

function FunnelTracker() {
  useFunnelTracker();
  return null;
}

// Critical path — loaded eagerly
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

// Lazy-loaded routes for better Core Web Vitals (code splitting)
const Login = lazy(() => import("./pages/Login"));
const ListingDetail = lazy(() => import("./pages/ListingDetail"));
const Sell = lazy(() => import("./pages/Sell"));
const EditListing = lazy(() => import("./pages/EditListing"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Profile = lazy(() => import("./pages/Profile"));
const Success = lazy(() => import("./pages/Success"));
const Checkout = lazy(() => import("./pages/Checkout"));
const Admin = lazy(() => import("./pages/Admin"));
const FAQ = lazy(() => import("./pages/FAQ"));
const Storefront = lazy(() => import("./pages/Storefront"));
const CloudPage = lazy(() => import("./pages/Cloud"));
const Messages = lazy(() => import("./pages/Messages"));
const Bounties = lazy(() => import("./pages/Bounties"));
const BountyDetail = lazy(() => import("./pages/BountyDetail"));
const Builders = lazy(() => import("./pages/Builders"));
const BuilderProfile = lazy(() => import("./pages/BuilderProfile"));
const Category = lazy(() => import("./pages/Category"));
const LifestyleCategory = lazy(() => import("./pages/LifestyleCategory"));
const BuiltWith = lazy(() => import("./pages/BuiltWith"));
const GuideSell = lazy(() => import("./pages/GuideSell"));
// Blog uses named exports — handled via BlogIndexLazy / BlogPostLazy below
const Terms = lazy(() => import("./pages/Terms"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Developers = lazy(() => import("./pages/Developers"));
const Agents = lazy(() => import("./pages/Agents"));
const Pitch = lazy(() => import("./pages/Pitch"));
const OpenClawPage = lazy(() => import("./pages/OpenClaw"));
const SwarmPage = lazy(() => import("./pages/Swarm"));
const BoardRoomPage = lazy(() => import("./pages/BoardRoom"));
const MascotExport = lazy(() => import("./pages/MascotExport"));
const ForPersona = lazy(() => import("./pages/ForPersona"));
const Founders = lazy(() => import("./pages/Founders"));
const CreatorHandbook = lazy(() => import("./pages/CreatorHandbook"));
const Credits = lazy(() => import("./pages/Credits"));
const Onboarding = lazy(() => import("./pages/Onboarding"));
const Security = lazy(() => import("./pages/Security"));
const AdminOutreach = lazy(() => import("./pages/AdminOutreach"));
const AdminRevenue = lazy(() => import("./pages/AdminRevenue"));
const GremlinsAtWork = lazy(() => import("./pages/GremlinsAtWork"));
const AppsVertical = lazy(() => import("./pages/AppsVertical"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Ideas = lazy(() => import("./pages/Ideas"));


import { SignupPrompt } from "./components/SignupPrompt";
import { StickyMobileCTA } from "./components/StickyMobileCTA";

const queryClient = new QueryClient();

// Minimal loading fallback for lazy routes
function RouteLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
    </div>
  );
}

// Wrapper to render Blog named exports via lazy
function BlogIndexPage() {
  return <Suspense fallback={<RouteLoader />}><BlogIndexLazy /></Suspense>;
}
function BlogPostPage() {
  return <Suspense fallback={<RouteLoader />}><BlogPostLazy /></Suspense>;
}

const BlogIndexLazy = lazy(() => import("./pages/Blog").then(m => ({ default: m.BlogIndex })));
const BlogPostLazy = lazy(() => import("./pages/Blog").then(m => ({ default: m.BlogPost })));

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <ScrollToTop />
        <FunnelTracker />
        <Suspense fallback={<RouteLoader />}>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/listing/:id" element={<ListingDetail />} />
            <Route path="/sell" element={<Sell />} />
            <Route path="/listing/:id/edit" element={<EditListing />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/success" element={<Success />} />
            <Route path="/checkout/:id" element={<Checkout />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/admin/outreach" element={<AdminOutreach />} />
            <Route path="/admin/revenue" element={<AdminRevenue />} />
            <Route path="/faq" element={<FAQ />} />
            <Route path="/storefront" element={<Storefront />} />
            <Route path="/cloud" element={<CloudPage />} />
            <Route path="/messages" element={<Messages />} />
            <Route path="/bounties" element={<Bounties />} />
            <Route path="/bounty/:id" element={<BountyDetail />} />
            <Route path="/builders" element={<Builders />} />
            <Route path="/builder/:userId" element={<BuilderProfile />} />
            <Route path="/category/:slug" element={<Category />} />
            <Route path="/lifestyle/:slug" element={<LifestyleCategory />} />
            <Route path="/built-with/:tool" element={<BuiltWith />} />
            <Route path="/guides/sell" element={<GuideSell />} />
            <Route path="/guides/creators" element={<CreatorHandbook />} />
            <Route path="/blog" element={<BlogIndexPage />} />
            <Route path="/blog/:slug" element={<BlogPostPage />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/developers" element={<Developers />} />
            <Route path="/agents" element={<Agents />} />
            <Route path="/pitch" element={<Pitch />} />
            <Route path="/openclaw" element={<OpenClawPage />} />
            <Route path="/swarm" element={<SwarmPage />} />
            <Route path="/boardroom" element={<BoardRoomPage />} />
            <Route path="/mascot-export" element={<MascotExport />} />
            <Route path="/for/:persona" element={<ForPersona />} />
            <Route path="/founders" element={<Founders />} />
            <Route path="/credits" element={<Credits />} />
            <Route path="/onboarding" element={<Onboarding />} />
            <Route path="/security" element={<Security />} />
            <Route path="/gremlins" element={<GremlinsAtWork />} />
            <Route path="/apps/:vertical" element={<AppsVertical />} />
            <Route path="/ideas" element={<Ideas />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
        
        <SignupPrompt />
        <StickyMobileCTA />
        
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
