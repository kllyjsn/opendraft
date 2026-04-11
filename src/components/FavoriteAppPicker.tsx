/**
 * FavoriteAppPicker — post-signup "Pick your favorite" overlay.
 * Shows 6 staff-pick / top listings. Tapping one goes to listing detail.
 * Shown once per user via localStorage.
 */
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { logActivity } from "@/lib/activity-logger";
import { X } from "lucide-react";
import { api } from "@/lib/api";

const PICKER_STORAGE_KEY = "opendraft_fav_picker_shown";

interface PickerListing {
  id: string;
  title: string;
  screenshots: string[];
  description: string;
}

export function FavoriteAppPicker() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [listings, setListings] = useState<PickerListing[]>([]);
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!user) return;
    if (localStorage.getItem(PICKER_STORAGE_KEY)) return;

    // Small delay so the page loads first
    const timer = setTimeout(() => {
      loadPicks();
    }, 1500);
    return () => clearTimeout(timer);
  }, [user]);

  async function loadPicks() {
    // Get staff picks or top listings with screenshots
    const { data } = await api.from("listings")
      .select("id, title, screenshots, description")
      .eq("status", "live")
      .not("screenshots", "is", null)
      .order("sales_count", { ascending: false })
      .limit(12);

    const withImages = (data ?? []).filter(
      (l) => l.screenshots?.length > 0 && l.screenshots[0] !== "" && !l.screenshots[0].endsWith(".svg")
    ).slice(0, 6);

    if (withImages.length >= 4) {
      setListings(withImages);
      setShow(true);
    }
  }

  function handlePick(listing: PickerListing) {
    localStorage.setItem(PICKER_STORAGE_KEY, "1");
    logActivity({
      event_type: "funnel:favorite_picked",
      event_data: { listing_id: listing.id, listing_title: listing.title },
    });
    setShow(false);
    navigate(`/listing/${listing.id}`);
  }

  function handleDismiss() {
    localStorage.setItem(PICKER_STORAGE_KEY, "1");
    logActivity({ event_type: "funnel:favorite_picker_dismissed" });
    setShow(false);
  }

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] flex items-center justify-center bg-background/80 backdrop-blur-sm p-4"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="relative w-full max-w-lg rounded-2xl border border-border/60 bg-card shadow-xl p-6"
          >
            <button
              onClick={handleDismiss}
              className="absolute top-3 right-3 p-1.5 rounded-full hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="text-center mb-5">
              <p className="text-2xl mb-1">👋</p>
              <h2 className="text-lg font-bold text-foreground">Welcome! What catches your eye?</h2>
              <p className="text-xs text-muted-foreground mt-1">
                Tap an app to explore it — you can always browse more later.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {listings.map((listing) => (
                <button
                  key={listing.id}
                  onClick={() => handlePick(listing)}
                  className="group rounded-xl border border-border/40 bg-muted/30 overflow-hidden hover:border-primary/50 hover:shadow-md transition-all text-left"
                >
                  <div className="aspect-[4/3] overflow-hidden bg-muted">
                    <img
                      src={listing.screenshots[0]}
                      alt={listing.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                  </div>
                  <div className="p-2">
                    <p className="text-xs font-semibold text-foreground truncate">{listing.title}</p>
                  </div>
                </button>
              ))}
            </div>

            <button
              onClick={handleDismiss}
              className="mt-4 w-full text-center text-xs text-muted-foreground hover:text-foreground transition-colors py-1"
            >
              Skip — I'll browse on my own
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
