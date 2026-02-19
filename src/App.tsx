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
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import Success from "./pages/Success";
import Checkout from "./pages/Checkout";
import Admin from "./pages/Admin";
import FAQ from "./pages/FAQ";
import Storefront from "./pages/Storefront";

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
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/success" element={<Success />} />
          <Route path="/checkout/:id" element={<Checkout />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/storefront" element={<Storefront />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
