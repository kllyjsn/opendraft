import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  Wrench,
  UtensilsCrossed,
  Briefcase,
  HeartPulse,
  GraduationCap,
  Home,
  Scissors,
  Camera,
  Dumbbell,
  Car,
  ShieldCheck,
  Palette,
} from "lucide-react";

const verticals = [
  { icon: Wrench, name: "Home Services", example: "Plumbing, HVAC, cleaning", search: "home services" },
  { icon: UtensilsCrossed, name: "Restaurants", example: "Ordering, reservations, loyalty", search: "restaurant" },
  { icon: Briefcase, name: "Professional Services", example: "Legal, accounting, consulting", search: "professional" },
  { icon: HeartPulse, name: "Health & Wellness", example: "Clinics, dental, therapy", search: "health" },
  { icon: Scissors, name: "Salons & Spas", example: "Booking, client management", search: "salon" },
  { icon: Dumbbell, name: "Fitness & Gyms", example: "Memberships, scheduling, tracking", search: "fitness" },
  { icon: GraduationCap, name: "Education", example: "Tutoring, courses, LMS", search: "education" },
  { icon: Home, name: "Real Estate", example: "Listings, CRM, virtual tours", search: "real estate" },
  { icon: Camera, name: "Photography", example: "Portfolios, booking, galleries", search: "photography" },
  { icon: Car, name: "Auto & Repair", example: "Scheduling, invoicing, fleet", search: "auto" },
  { icon: ShieldCheck, name: "Insurance", example: "Quotes, claims, portals", search: "insurance" },
  { icon: Palette, name: "Creative Agencies", example: "Project mgmt, proposals, billing", search: "agency" },
];

const cardVariant = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  }),
};

export function IndustryVerticals() {
  return (
    <section className="py-16 md:py-20 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[800px] rounded-full bg-primary/5 blur-[140px] pointer-events-none" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-10">
          <p className="text-xs font-bold uppercase tracking-widest text-primary mb-2">Built for your industry</p>
          <h2 className="text-2xl md:text-4xl font-black tracking-tighter leading-[1.05] mb-3">
            Apps tailored to what you do
          </h2>
          <p className="text-sm md:text-base text-muted-foreground max-w-lg mx-auto">
            Ready-made apps for <span className="text-foreground font-semibold">12+ industries</span>. 
            Pick one, customize it, and launch — no development wait times.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 max-w-4xl mx-auto">
          {verticals.map((v, i) => {
            const Icon = v.icon;
            return (
              <motion.div
                key={v.name}
                custom={i}
                variants={cardVariant}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-40px" }}
              >
                <Link
                  to={`/?q=${encodeURIComponent(v.search)}`}
                  onClick={(e) => {
                    e.preventDefault();
                    // Scroll to search and pre-fill
                    const searchInput = document.querySelector<HTMLInputElement>('#browse input[type="text"]');
                    if (searchInput) {
                      searchInput.value = v.search;
                      searchInput.dispatchEvent(new Event("input", { bubbles: true }));
                    }
                    document.getElementById("browse")?.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="group flex flex-col items-center gap-2.5 rounded-2xl glass p-5 text-center hover:border-primary/30 hover:bg-primary/5 hover:shadow-glow transition-all duration-300 cursor-pointer h-full"
                >
                  <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 group-hover:scale-110 transition-all duration-300">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground mb-0.5">{v.name}</p>
                    <p className="text-[11px] text-muted-foreground leading-snug">{v.example}</p>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>

        <div className="text-center mt-8">
          <p className="text-xs text-muted-foreground">
            Don't see yours? <Link to="/sell" className="text-primary font-semibold hover:underline underline-offset-2">Tell us what you need →</Link>
          </p>
        </div>
      </div>
    </section>
  );
}
