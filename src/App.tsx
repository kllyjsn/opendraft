import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import ListingDetail from "./pages/ListingDetail";
import Sell from "./pages/Sell";
import EditListing from "./pages/EditListing";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import Success from "./pages/Success";
import Checkout from "./pages/Checkout";
import Admin from "./pages/Admin";
import FAQ from "./pages/FAQ";
import Storefront from "./pages/Storefront";
import CloudPage from "./pages/Cloud";
import Messages from "./pages/Messages";
import Bounties from "./pages/Bounties";
import BountyDetail from "./pages/BountyDetail";
import Builders from "./pages/Builders";
import BuilderProfile from "./pages/BuilderProfile";
import Category from "./pages/Category";
import BuiltWith from "./pages/BuiltWith";
import GuideSell from "./pages/GuideSell";
import { BlogIndex, BlogPost } from "./pages/Blog";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import Developers from "./pages/Developers";
import Agents from "./pages/Agents";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<Login />} />
          <Route path="/listing/:id" element={<ListingDetail />} />
          <Route path="/sell" element={<Sell />} />
          <Route path="/listing/:id/edit" element={<EditListing />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/success" element={<Success />} />
          <Route path="/checkout/:id" element={<Checkout />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/storefront" element={<Storefront />} />
          <Route path="/cloud" element={<CloudPage />} />
          <Route path="/messages" element={<Messages />} />
          <Route path="/bounties" element={<Bounties />} />
          <Route path="/bounty/:id" element={<BountyDetail />} />
          <Route path="/builders" element={<Builders />} />
          <Route path="/builder/:userId" element={<BuilderProfile />} />
          <Route path="/category/:slug" element={<Category />} />
          <Route path="/built-with/:tool" element={<BuiltWith />} />
          <Route path="/guides/sell" element={<GuideSell />} />
          <Route path="/blog" element={<BlogIndex />} />
          <Route path="/blog/:slug" element={<BlogPost />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/developers" element={<Developers />} />
          <Route path="/agents" element={<Agents />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
