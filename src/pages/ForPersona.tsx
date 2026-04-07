import { useParams, Link, Navigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { FeaturedListings } from "@/components/FeaturedListings";
import { HowItWorks } from "@/components/HowItWorks";
import { CanonicalTag } from "@/components/CanonicalTag";
import { JsonLd } from "@/components/JsonLd";
import { MetaTags } from "@/components/MetaTags";
import { Code, Building2, Zap, Rocket, Shield, Users, ArrowRight, Utensils, Scissors, Wrench, Heart, Briefcase, ShoppingBag, GraduationCap, Car, Dog, CalendarDays, Stethoscope } from "lucide-react";

interface SaasReplacement {
  name: string;
  monthlyCost: number; // $/mo per seat
}

interface VerticalConfig {
  title: string;
  headline: string;
  subheadline: string;
  metaDescription: string;
  icon: any;
  painPoint: string;
  benefits: { icon: any; title: string; desc: string }[];
  cta: string;
  searchQuery: string;
  priceAnchor: string;
  replacements?: SaasReplacement[]; // SaaS tools this vertical replaces
}

const personas: Record<string, VerticalConfig> = {
  developers: {
    title: "OpenDraft for Developers",
    headline: "Ship faster.\nBuy the boilerplate.",
    subheadline: "Stop rebuilding auth, dashboards, and CRUD from scratch. Get production-ready source code, own it forever, and launch in hours instead of weeks.",
    metaDescription: "Buy production-ready app templates and source code. Full ownership, one-time fee. SaaS starters, AI apps, dashboards & more for developers.",
    icon: Code,
    painPoint: "Spending weeks building the same boilerplate?",
    benefits: [
      { icon: Code, title: "Full source code", desc: "No lock-in. Fork it, modify it, ship it. You own every line." },
      { icon: Zap, title: "One-click deploy", desc: "Deploy to Vercel or Netlify directly from your purchase dashboard." },
      { icon: Shield, title: "Vetted quality", desc: "Every listing has a completeness badge — Prototype, MVP, or Production Ready." },
      { icon: Rocket, title: "Save weeks of work", desc: "Auth, payments, dashboards — already built. Focus on what makes your app unique." },
    ],
    cta: "Browse developer tools",
    searchQuery: "saas dashboard auth",
    priceAnchor: "Skip the $10K agency. Get it for the price of lunch.",
    replacements: [
      { name: "Retool", monthlyCost: 75 },
      { name: "Vercel Pro", monthlyCost: 20 },
      { name: "Firebase Blaze", monthlyCost: 25 },
    ],
  },
  agencies: {
    title: "OpenDraft for Agencies",
    headline: "White-label apps.\nDeliver faster.",
    subheadline: "Your clients want apps yesterday. Buy production-ready templates, brand them, and deliver projects in days — not months. Keep your margins healthy.",
    metaDescription: "White-label app templates for agencies. Buy once, rebrand, and deliver to clients faster. SaaS tools, landing pages, AI apps & more.",
    icon: Building2,
    painPoint: "Spending $5K–$15K per client project?",
    benefits: [
      { icon: Building2, title: "White-label ready", desc: "Full source code you can rebrand and resell to clients without restrictions." },
      { icon: Users, title: "Scale your team", desc: "Stop hiring for every project. Buy the foundation and customize from there." },
      { icon: Zap, title: "Faster delivery", desc: "Cut project timelines from months to weeks. Deliver more, earn more." },
      { icon: Shield, title: "Flat-fee pricing", desc: "One-time purchase per project. No recurring fees eating into your margins." },
    ],
    cta: "Browse templates",
    searchQuery: "landing page portfolio",
    priceAnchor: "Agency plan: $99/mo for unlimited white-label apps.",
    replacements: [
      { name: "Webflow", monthlyCost: 39 },
      { name: "Figma (per editor)", monthlyCost: 15 },
      { name: "Framer", monthlyCost: 30 },
    ],
  },
  restaurants: {
    title: "Apps for Restaurants",
    headline: "Your restaurant app.\nAlready built.",
    subheadline: "Online ordering, reservations, loyalty programs, and menu management — ready to launch today. No agency needed.",
    metaDescription: "Restaurant apps ready to launch. Online ordering, reservations, loyalty programs. Full source code, deploy in minutes. Skip the $10K agency.",
    icon: Utensils,
    painPoint: "Paying $5K+ for a basic ordering app?",
    benefits: [
      { icon: Utensils, title: "Online ordering", desc: "Accept orders directly — no DoorDash commissions eating your margins." },
      { icon: CalendarDays, title: "Reservations", desc: "Let customers book tables 24/7 without phone calls." },
      { icon: Heart, title: "Loyalty programs", desc: "Keep regulars coming back with points, rewards, and exclusive offers." },
      { icon: Zap, title: "Launch today", desc: "Deploy your restaurant app in minutes, not months. Yours forever." },
    ],
    cta: "Browse restaurant apps",
    searchQuery: "restaurant ordering menu",
    priceAnchor: "Skip the $10K agency. Launch for the price of a dinner.",
    replacements: [
      { name: "Toast POS", monthlyCost: 75 },
      { name: "OpenTable", monthlyCost: 249 },
      { name: "DoorDash (commissions)", monthlyCost: 300 },
    ],
  },
  salons: {
    title: "Apps for Salons & Spas",
    headline: "Book more clients.\nAutomatically.",
    subheadline: "Online booking, client management, portfolio showcases, and automated reminders — everything your salon needs in one app.",
    metaDescription: "Salon and spa booking apps ready to launch. Online appointments, client management, portfolio showcase. Full source code included.",
    icon: Scissors,
    painPoint: "Losing clients to no-shows and phone tag?",
    benefits: [
      { icon: CalendarDays, title: "Online booking", desc: "Clients book 24/7 — no more phone tag during busy hours." },
      { icon: Users, title: "Client management", desc: "Track preferences, history, and notes for every client." },
      { icon: ShoppingBag, title: "Service catalog", desc: "Showcase your services, prices, and team with a professional app." },
      { icon: Zap, title: "Automated reminders", desc: "Reduce no-shows by 60% with automated appointment reminders." },
    ],
    cta: "Browse salon apps",
    searchQuery: "booking appointment salon",
    priceAnchor: "Replace your $200/mo booking software. Own it forever.",
  },
  contractors: {
    title: "Apps for Home Services",
    headline: "Get more jobs.\nLook professional.",
    subheadline: "Scheduling, estimates, invoicing, and customer portals for plumbers, electricians, cleaners, and HVAC pros.",
    metaDescription: "Home service apps for contractors. Scheduling, estimates, invoicing, customer portals. Full source code, deploy today.",
    icon: Wrench,
    painPoint: "Running your business from sticky notes?",
    benefits: [
      { icon: CalendarDays, title: "Job scheduling", desc: "Manage your calendar, crew assignments, and customer appointments in one place." },
      { icon: Briefcase, title: "Instant estimates", desc: "Send professional estimates from your phone. Win more jobs faster." },
      { icon: ShoppingBag, title: "Invoicing", desc: "Bill clients instantly. Accept payments online. Get paid faster." },
      { icon: Shield, title: "Customer portal", desc: "Let customers track job status, view invoices, and book repeat service." },
    ],
    cta: "Browse contractor apps",
    searchQuery: "scheduling invoicing service",
    priceAnchor: "Stop paying $150/mo for Jobber. Own your app forever.",
  },
  fitness: {
    title: "Apps for Fitness & Wellness",
    headline: "Fill every class.\nGrow your studio.",
    subheadline: "Class booking, member portals, workout tracking, and payment processing — built for gyms, yoga studios, and personal trainers.",
    metaDescription: "Fitness and wellness apps ready to launch. Class booking, member portals, workout tracking. Full source code, deploy today.",
    icon: Heart,
    painPoint: "Paying Mindbody $200+/mo?",
    benefits: [
      { icon: CalendarDays, title: "Class booking", desc: "Members book and manage classes from their phone. Waitlists included." },
      { icon: Users, title: "Member portal", desc: "Track memberships, attendance, and progress all in one place." },
      { icon: Heart, title: "Workout tracking", desc: "Log workouts, set goals, and track progress over time." },
      { icon: Zap, title: "Payment processing", desc: "Accept memberships, drop-ins, and class packs with built-in payments." },
    ],
    cta: "Browse fitness apps",
    searchQuery: "fitness booking gym member",
    priceAnchor: "Replace Mindbody for 1/10th the cost. Own it forever.",
  },
  healthcare: {
    title: "Apps for Healthcare & Dental",
    headline: "Modern patient experience.\nBuilt for you.",
    subheadline: "Patient portals, appointment scheduling, intake forms, and telehealth — ready to deploy for clinics, dentists, and practices.",
    metaDescription: "Healthcare and dental apps ready to launch. Patient portals, appointment booking, intake forms. Full source code included.",
    icon: Stethoscope,
    painPoint: "Patients frustrated by outdated systems?",
    benefits: [
      { icon: Users, title: "Patient portal", desc: "Patients view records, appointments, and messages in a modern interface." },
      { icon: CalendarDays, title: "Smart scheduling", desc: "Online booking with insurance verification and automated reminders." },
      { icon: Shield, title: "Digital intake", desc: "Paperless intake forms that save 15 minutes per patient visit." },
      { icon: Zap, title: "Telehealth ready", desc: "Video consultations built in. Expand your practice beyond the waiting room." },
    ],
    cta: "Browse healthcare apps",
    searchQuery: "patient portal healthcare booking",
    priceAnchor: "Skip the $20K custom build. Launch this week.",
  },
  realestate: {
    title: "Apps for Real Estate",
    headline: "Close more deals.\nDigitally.",
    subheadline: "Property listings, virtual tours, CRM, and client portals — everything a modern real estate business needs.",
    metaDescription: "Real estate apps ready to launch. Property listings, virtual tours, CRM, client portals. Full source code, deploy today.",
    icon: Building2,
    painPoint: "Losing leads to agents with better websites?",
    benefits: [
      { icon: Building2, title: "Property listings", desc: "Beautiful, searchable property catalog with maps and photo galleries." },
      { icon: Users, title: "Client CRM", desc: "Track leads, showings, and deals from first contact to closing." },
      { icon: CalendarDays, title: "Showing scheduler", desc: "Clients book showings online. Syncs with your calendar." },
      { icon: Zap, title: "Virtual tours", desc: "Embedded 3D tours and video walkthroughs that sell homes faster." },
    ],
    cta: "Browse real estate apps",
    searchQuery: "real estate listing property",
    priceAnchor: "Look like a top agency. Pay less than one showing dinner.",
  },
  education: {
    title: "Apps for Education & Tutoring",
    headline: "Teach smarter.\nGrow faster.",
    subheadline: "Course platforms, scheduling, student portals, and payment processing for tutors, coaches, and educators.",
    metaDescription: "Education and tutoring apps ready to launch. Course platforms, student portals, scheduling. Full source code included.",
    icon: GraduationCap,
    painPoint: "Cobbling together 5 tools to run your tutoring business?",
    benefits: [
      { icon: GraduationCap, title: "Course platform", desc: "Host video lessons, quizzes, and materials in a branded learning portal." },
      { icon: CalendarDays, title: "Session booking", desc: "Students book and pay for sessions directly through your app." },
      { icon: Users, title: "Student dashboard", desc: "Track progress, grades, and attendance for every student." },
      { icon: Zap, title: "Automated billing", desc: "Recurring payments, packages, and invoicing — all automatic." },
    ],
    cta: "Browse education apps",
    searchQuery: "course platform tutoring education",
    priceAnchor: "Replace Teachable + Calendly for a fraction of the cost.",
  },
  pets: {
    title: "Apps for Pet Services",
    headline: "More bookings.\nHappier pets.",
    subheadline: "Booking, client management, and pet profiles for groomers, walkers, sitters, and veterinary clinics.",
    metaDescription: "Pet service apps ready to launch. Booking, client management, pet profiles. Full source code, deploy today.",
    icon: Dog,
    painPoint: "Managing bookings via text messages?",
    benefits: [
      { icon: CalendarDays, title: "Online booking", desc: "Pet parents book grooming, walking, or sitting sessions 24/7." },
      { icon: Dog, title: "Pet profiles", desc: "Track breed, allergies, preferences, and vet info for every pet." },
      { icon: Users, title: "Client management", desc: "Build relationships with repeat customers and their furry friends." },
      { icon: Zap, title: "Automated reminders", desc: "Vaccination reminders, appointment confirmations, and follow-ups." },
    ],
    cta: "Browse pet service apps",
    searchQuery: "pet grooming booking",
    priceAnchor: "Look pro. Book more. Start for less than a dog wash.",
  },
  auto: {
    title: "Apps for Auto & Repair",
    headline: "More jobs.\nLess paperwork.",
    subheadline: "Service scheduling, estimates, repair tracking, and customer portals for auto shops and repair businesses.",
    metaDescription: "Auto repair and service apps ready to launch. Scheduling, estimates, repair tracking. Full source code, deploy today.",
    icon: Car,
    painPoint: "Still using paper work orders?",
    benefits: [
      { icon: CalendarDays, title: "Service scheduling", desc: "Customers book service appointments online. No more phone hold times." },
      { icon: Briefcase, title: "Digital estimates", desc: "Send itemized estimates with photos. Get approval instantly." },
      { icon: Wrench, title: "Repair tracking", desc: "Customers track repair status in real-time. Fewer 'is it ready?' calls." },
      { icon: Shield, title: "Service history", desc: "Full vehicle service history for every customer. Build trust and loyalty." },
    ],
    cta: "Browse auto service apps",
    searchQuery: "auto repair service scheduling",
    priceAnchor: "Replace your $200/mo shop software. Own it forever.",
  },
};

export default function ForPersona() {
  const { persona } = useParams<{ persona: string }>();
  const config = persona ? personas[persona] : undefined;

  if (!config) return <Navigate to="/" replace />;

  const Icon = config.icon;

  return (
    <div className="min-h-screen flex flex-col">
      <MetaTags
        title={`${config.title} | OpenDraft`}
        description={config.metaDescription}
        path={`/for/${persona}`}
      />
      <CanonicalTag path={`/for/${persona}`} />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: config.title,
          description: config.metaDescription,
          url: `https://opendraft.co/for/${persona}`,
        }}
      />
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden py-20 md:py-32 grain-overlay">
        <div className="absolute -top-40 -right-40 h-[500px] w-[500px] rounded-full bg-primary/15 blur-[120px] pointer-events-none" />
        <div className="absolute -bottom-40 -left-40 h-[400px] w-[400px] rounded-full bg-accent/15 blur-[100px] pointer-events-none" />

        <div className="container mx-auto px-4 text-center relative z-10">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-xs font-semibold text-primary mb-6">
              <Icon className="h-4 w-4" />
              {config.title}
            </div>

            {/* Pain point hook */}
            <p className="text-sm md:text-base font-medium text-muted-foreground mb-4">
              {config.painPoint}
            </p>

            <h1 className="text-4xl md:text-7xl font-black tracking-tighter mb-6 leading-[0.95] whitespace-pre-line">
              {config.headline}
            </h1>

            <p className="text-base md:text-lg text-muted-foreground max-w-xl mx-auto mb-4 leading-relaxed">
              {config.subheadline}
            </p>

            {/* Price anchor */}
            <p className="text-sm font-bold text-primary mb-10">{config.priceAnchor}</p>

            <div className="flex items-center justify-center gap-4">
              <Link to={`/?q=${encodeURIComponent(config.searchQuery)}`}>
                <Button size="lg" className="gradient-hero text-white border-0 shadow-glow hover:opacity-90 gap-2 text-base px-8">
                  {config.cta} <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link to="/credits">
                <Button size="lg" variant="outline" className="gap-2">
                  View plans
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Benefits */}
      <section className="container mx-auto px-4 py-20">
        <h2 className="text-center text-sm font-semibold uppercase tracking-widest text-muted-foreground mb-12">
          Everything you need, ready to launch
        </h2>
        <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {config.benefits.map((b, i) => {
            const BIcon = b.icon;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="rounded-2xl border border-border/40 bg-card p-6"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 mb-4">
                  <BIcon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-bold text-lg mb-1">{b.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{b.desc}</p>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Social proof */}
      <section className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-3 gap-4 max-w-lg mx-auto text-center">
          <div>
            <p className="text-3xl font-black text-primary">100%</p>
            <p className="text-xs text-muted-foreground mt-1">Expert-built</p>
          </div>
          <div>
            <p className="text-3xl font-black text-primary">$0</p>
            <p className="text-xs text-muted-foreground mt-1">First app free</p>
          </div>
          <div>
            <p className="text-3xl font-black text-primary">5min</p>
            <p className="text-xs text-muted-foreground mt-1">To deploy</p>
          </div>
        </div>
      </section>

      {/* Featured */}
      <FeaturedListings />

      {/* How it works */}
      <HowItWorks />

      <Footer />
    </div>
  );
}
