import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ListingCard } from "./ListingCard";
import { Star, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel";

interface FeaturedListing {
  id: string;
  title: string;
  description: string;
  price: number;
  pricing_type: "one_time" | "monthly";
  completeness_badge: "prototype" | "mvp" | "production_ready";
  tech_stack: string[];
  screenshots: string[];
  sales_count: number;
  view_count: number;
  built_with: string | null;
  seller_id: string;
  seller_username?: string;
  purchase_count: number;
}

export function FeaturedCarousel() {
  const [listings, setListings] = useState<FeaturedListing[]>([]);
  const [api, setApi] = useState<CarouselApi>();
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase.rpc("get_featured_listings");
      if (error || !data?.length) return;

      const sellerIds = [...new Set(data.map((l: any) => l.seller_id))];
      const { data: profiles } = await supabase
        .from("public_profiles")
        .select("user_id, username")
        .in("user_id", sellerIds);
      const map = Object.fromEntries(
        (profiles ?? []).map((p) => [p.user_id, p.username ?? "Anonymous"])
      );

      setListings(
        data.map((l: any) => ({ ...l, seller_username: map[l.seller_id] }))
      );
    }
    load();
  }, []);

  useEffect(() => {
    if (!api) return;
    const onSelect = () => {
      setCanPrev(api.canScrollPrev());
      setCanNext(api.canScrollNext());
    };
    onSelect();
    api.on("select", onSelect);
    api.on("reInit", onSelect);
    return () => {
      api.off("select", onSelect);
    };
  }, [api]);

  if (listings.length === 0) return null;

  return (
    <section className="container mx-auto px-4 pb-12">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded-lg gradient-hero flex items-center justify-center">
            <Star className="h-3.5 w-3.5 text-white" />
          </div>
          <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
            Featured
          </h2>
        </div>
        <div className="flex gap-1.5">
          <Button
            variant="outline"
            size="icon"
            className="h-7 w-7 rounded-full border-border/40"
            disabled={!canPrev}
            onClick={() => api?.scrollPrev()}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-7 w-7 rounded-full border-border/40"
            disabled={!canNext}
            onClick={() => api?.scrollNext()}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Carousel
        setApi={setApi}
        opts={{ align: "start", loop: false }}
        className="w-full"
      >
        <CarouselContent className="-ml-3">
          {listings.map((l) => (
            <CarouselItem
              key={l.id}
              className="pl-3 basis-1/2 md:basis-1/3 lg:basis-1/4"
            >
              <ListingCard {...l} />
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
    </section>
  );
}
