import { useEffect, useState } from "react";
import { useParams, Link, Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Target, ChevronLeft, Clock, Users, DollarSign, CheckCircle, XCircle } from "lucide-react";

const CATEGORY_LABELS: Record<string, string> = {
  saas_tool: "SaaS Tool", ai_app: "AI App", landing_page: "Landing Page",
  utility: "Utility", game: "Game", other: "Other",
};

interface Bounty {
  id: string; title: string; description: string; budget: number;
  category: string; tech_stack: string[]; status: string;
  submissions_count: number; created_at: string; poster_id: string;
  winner_listing_id: string | null; winner_id: string | null;
}

interface Submission {
  id: string; seller_id: string; listing_id: string; message: string | null;
  status: string; created_at: string;
  listing_title?: string; seller_username?: string;
}

export default function BountyDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const [bounty, setBounty] = useState<Bounty | null>(null);
  const [poster, setPoster] = useState<{ username: string | null } | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [myListings, setMyListings] = useState<{ id: string; title: string }[]>([]);
  const [selectedListing, setSelectedListing] = useState("");
  const [submitMessage, setSubmitMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetchBounty();
  }, [id, user]);

  async function fetchBounty() {
    setLoading(true);
    const { data } = await supabase.from("bounties").select("*").eq("id", id).single();
    if (!data) { setLoading(false); return; }
    setBounty(data as any);

    // Fetch poster profile
    const { data: profile } = await supabase.from("public_profiles").select("username").eq("user_id", data.poster_id).single();
    setPoster(profile);

    // Fetch submissions if poster or submitter
    if (user && (data.poster_id === user.id)) {
      const { data: subs } = await supabase
        .from("bounty_submissions")
        .select("*")
        .eq("bounty_id", id)
        .order("created_at", { ascending: false });

      if (subs && subs.length > 0) {
        // Enrich with listing titles and seller names
        const listingIds = [...new Set(subs.map((s) => s.listing_id))];
        const sellerIds = [...new Set(subs.map((s) => s.seller_id))];

        const [{ data: listings }, { data: profiles }] = await Promise.all([
          supabase.from("listings").select("id, title").in("id", listingIds),
          supabase.from("public_profiles").select("user_id, username").in("user_id", sellerIds),
        ]);

        const listingMap = Object.fromEntries((listings ?? []).map((l) => [l.id, l.title]));
        const profileMap = Object.fromEntries((profiles ?? []).map((p) => [p.user_id, p.username]));

        setSubmissions(subs.map((s) => ({
          ...s,
          listing_title: listingMap[s.listing_id] ?? "Unknown",
          seller_username: profileMap[s.seller_id] ?? "Anonymous",
        })));
      }
    }

    // Check if current user already submitted
    if (user) {
      const { data: mySub } = await supabase
        .from("bounty_submissions")
        .select("id")
        .eq("bounty_id", id)
        .eq("seller_id", user.id)
        .maybeSingle();
      setHasSubmitted(!!mySub);

      // Fetch user's live listings for submission
      if (data.poster_id !== user.id) {
        const { data: listings } = await supabase
          .from("listings")
          .select("id, title")
          .eq("seller_id", user.id)
          .eq("status", "live");
        setMyListings(listings ?? []);
      }
    }

    setLoading(false);
  }

  async function handleSubmit() {
    if (!user || !bounty || !selectedListing) return;
    setSubmitting(true);

    const { error } = await supabase.from("bounty_submissions").insert({
      bounty_id: bounty.id,
      seller_id: user.id,
      listing_id: selectedListing,
      message: submitMessage.trim() || null,
    });

    if (error) {
      toast({ title: "Submission failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Submitted! 🎯", description: "The bounty poster will review your project." });
      setHasSubmitted(true);
      fetchBounty();
    }
    setSubmitting(false);
  }

  async function handleAward(submissionId: string, listingId: string, sellerId: string) {
    if (!bounty) return;
    const { error } = await supabase
      .from("bounties")
      .update({ status: "completed", winner_listing_id: listingId, winner_id: sellerId })
      .eq("id", bounty.id);

    if (error) {
      toast({ title: "Failed to award", description: error.message, variant: "destructive" });
      return;
    }

    await supabase.from("bounty_submissions").update({ status: "accepted" }).eq("id", submissionId);
    // Reject others
    await supabase
      .from("bounty_submissions")
      .update({ status: "rejected" })
      .eq("bounty_id", bounty.id)
      .neq("id", submissionId);

    // Notify winner
    await supabase.from("notifications").insert({
      user_id: sellerId,
      type: "bounty_won",
      title: "You won a bounty! 🏆",
      message: `Your submission for "${bounty.title}" was selected! Budget: $${(bounty.budget / 100).toFixed(2)}`,
      link: `/listing/${listingId}`,
      metadata: { bounty_id: bounty.id },
    });

    toast({ title: "Bounty awarded! 🏆" });
    fetchBounty();
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="h-10 w-10 rounded-full gradient-hero animate-spin mx-auto" />
        </div>
      </div>
    );
  }

  if (!bounty) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center text-center">
          <div>
            <div className="text-5xl mb-4">🤔</div>
            <h2 className="text-xl font-bold mb-2">Bounty not found</h2>
            <Link to="/bounties"><Button>Back to bounties</Button></Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const isPoster = user?.id === bounty.poster_id;
  const isCompleted = bounty.status === "completed";

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-10">
        <Link to="/bounties" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8 group">
          <ChevronLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" /> Back to bounties
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Target className="h-5 w-5 text-primary" />
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider ${
                  isCompleted ? "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300" : "bg-primary/10 text-primary"
                }`}>
                  {isCompleted ? "Completed" : "Open Bounty"}
                </span>
                <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                  {CATEGORY_LABELS[bounty.category] || bounty.category}
                </span>
              </div>
              <h1 className="text-3xl md:text-4xl font-black leading-tight mb-3">{bounty.title}</h1>
              <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground mb-4">
                <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" /> {bounty.submissions_count} submissions</span>
                <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {new Date(bounty.created_at).toLocaleDateString()}</span>
                {poster && <span>Posted by <strong className="text-foreground">{poster.username ?? "Anonymous"}</strong></span>}
              </div>
              <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">{bounty.description}</p>
            </div>

            {bounty.tech_stack.length > 0 && (
              <div>
                <h3 className="font-bold mb-3 text-sm uppercase tracking-wider text-muted-foreground">Preferred Tech</h3>
                <div className="flex flex-wrap gap-2">
                  {bounty.tech_stack.map((tag) => (
                    <span key={tag} className="rounded-lg bg-muted border border-border/40 px-3 py-1 text-sm font-medium text-muted-foreground">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Submissions (visible to poster) */}
            {isPoster && submissions.length > 0 && (
              <div>
                <h3 className="font-bold text-lg mb-4">Submissions ({submissions.length})</h3>
                <div className="space-y-3">
                  {submissions.map((sub) => (
                    <div key={sub.id} className="rounded-2xl border border-border/60 bg-card p-4 shadow-card">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <Link to={`/listing/${sub.listing_id}`} className="font-bold hover:text-primary transition-colors">
                            {sub.listing_title}
                          </Link>
                          <p className="text-xs text-muted-foreground mt-0.5">by {sub.seller_username}</p>
                          {sub.message && <p className="text-sm text-muted-foreground mt-2 border-l-2 border-border pl-3">{sub.message}</p>}
                        </div>
                        <div className="flex items-center gap-2">
                          {sub.status === "pending" && !isCompleted && (
                            <Button
                              size="sm"
                              onClick={() => handleAward(sub.id, sub.listing_id, sub.seller_id)}
                              className="gradient-hero text-white border-0 text-xs"
                            >
                              <CheckCircle className="h-3 w-3 mr-1" /> Award
                            </Button>
                          )}
                          {sub.status === "accepted" && (
                            <span className="text-xs font-bold text-green-600 dark:text-green-400 flex items-center gap-1">
                              <CheckCircle className="h-3.5 w-3.5" /> Winner
                            </span>
                          )}
                          {sub.status === "rejected" && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <XCircle className="h-3.5 w-3.5" /> Not selected
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-card sticky top-20">
              <div className="mb-5">
                <div className="text-4xl font-black text-primary mb-0.5">${(bounty.budget / 100).toFixed(0)}</div>
                <p className="text-xs text-muted-foreground">Budget · Paid to the winning builder</p>
              </div>

              {isCompleted ? (
                <div className="rounded-xl bg-green-500/10 border border-green-500/20 px-4 py-3 text-center">
                  <p className="font-bold text-green-600 dark:text-green-400 text-sm">🏆 Bounty completed</p>
                  {bounty.winner_listing_id && (
                    <Link to={`/listing/${bounty.winner_listing_id}`} className="text-xs text-primary hover:underline mt-1 inline-block">
                      View winning project →
                    </Link>
                  )}
                </div>
              ) : isPoster ? (
                <div className="rounded-xl bg-primary/8 border border-primary/20 px-4 py-3 text-center">
                  <p className="font-bold text-primary text-sm">Your bounty</p>
                  <p className="text-xs text-muted-foreground mt-1">Review submissions below to award a winner</p>
                </div>
              ) : !user ? (
                <Link to="/login">
                  <Button className="w-full gradient-hero text-white border-0 shadow-glow hover:opacity-90 h-11 font-bold">
                    Sign in to submit
                  </Button>
                </Link>
              ) : hasSubmitted ? (
                <div className="rounded-xl bg-primary/8 border border-primary/20 px-4 py-3 text-center">
                  <p className="font-bold text-primary text-sm">✓ You've submitted</p>
                  <p className="text-xs text-muted-foreground mt-1">The poster will review your project</p>
                </div>
              ) : myListings.length === 0 ? (
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-3">You need a live listing to submit</p>
                  <Link to="/sell">
                    <Button variant="outline" className="w-full">Create a listing first</Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">Your project</label>
                    <Select value={selectedListing} onValueChange={setSelectedListing}>
                      <SelectTrigger><SelectValue placeholder="Select a listing" /></SelectTrigger>
                      <SelectContent>
                        {myListings.map((l) => (
                          <SelectItem key={l.id} value={l.id}>{l.title}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">Message (optional)</label>
                    <Textarea
                      placeholder="Why is your project a great fit?"
                      value={submitMessage}
                      onChange={(e) => setSubmitMessage(e.target.value)}
                      rows={3}
                      maxLength={500}
                    />
                  </div>
                  <Button
                    onClick={handleSubmit}
                    disabled={!selectedListing || submitting}
                    className="w-full gradient-hero text-white border-0 shadow-glow hover:opacity-90 h-11 font-bold"
                  >
                    {submitting ? "Submitting…" : "Submit Your Project"}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
