import { motion } from "framer-motion";
import { ExternalLink, CheckCircle, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

const FEATURED = {
  id: "ff8ba198-8a29-4ae0-9738-cbb8293bee8b",
  title: "Imagine Fuel",
  subtitle: "AI Calorie Tracking App",
  description: "Describe your meal in plain English — AI estimates calories and macros instantly. No barcode scanning.",
  demoUrl: "https://Imaginefuel.lovable.app",
  screenshot: "https://xwumrdcagsuwqeelyxih.supabase.co/storage/v1/object/public/listing-screenshots/ai-generated/imagine-fuel-1772899637913.png",
  techStack: ["AI", "Natural Language Processing"],
  badge: "Production-Ready",
};

export function HeroCaseStudy() {
  return (
    <section className="py-12 md:py-16">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative rounded-2xl border border-border/50 bg-card overflow-hidden shadow-card"
        >
          <div className="grid md:grid-cols-2 gap-0">
            {/* Screenshot */}
            <div className="relative h-56 md:h-auto overflow-hidden bg-muted">
              <img
                src={FEATURED.screenshot}
                alt={FEATURED.title}
                className="w-full h-full object-cover object-top"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-transparent to-card/80 hidden md:block" />
              <div className="absolute inset-0 bg-gradient-to-t from-card/80 to-transparent md:hidden" />
            </div>

            {/* Content */}
            <div className="p-6 md:p-10 flex flex-col justify-center relative z-10">
              <div className="flex items-center gap-2 mb-3">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 border border-primary/20 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
                  <Sparkles className="h-3 w-3" />
                  Featured build
                </span>
                <span className="rounded-full bg-accent/10 border border-accent/20 px-2 py-0.5 text-[10px] font-bold text-accent">
                  {FEATURED.badge}
                </span>
              </div>

              <h3 className="text-xl md:text-2xl font-black tracking-tight mb-1">
                {FEATURED.title}
              </h3>
              <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                {FEATURED.description}
              </p>

              <ul className="space-y-2 mb-6">
                {["Full source code included", "One-click cloud deploy", "Security audited"].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-xs text-muted-foreground">
                    <CheckCircle className="h-3.5 w-3.5 text-primary shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>

              <div className="flex flex-wrap gap-2">
                <Link
                  to={`/listing/${FEATURED.id}`}
                  className="inline-flex items-center gap-2 rounded-full gradient-hero text-primary-foreground px-5 py-2.5 text-sm font-bold shadow-glow hover:opacity-90 transition-opacity"
                >
                  View this build
                </Link>
                <a
                  href={FEATURED.demoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-card px-5 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Live demo
                </a>
              </div>

              {/* Tech tags */}
              <div className="flex flex-wrap gap-1.5 mt-4">
                {FEATURED.techStack.map((tag) => (
                  <span key={tag} className="rounded-md bg-muted px-2 py-0.5 text-[10px] text-muted-foreground font-medium">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
