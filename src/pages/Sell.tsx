import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { CompletenessBadge } from "@/components/CompletenessBadge";
import { MagicImport } from "@/components/MagicImport";
import { Upload, Plus, X, Link as LinkIcon, Github, FileArchive, CheckCircle2, GitFork } from "lucide-react";
import { Navigate } from "react-router-dom";
import { logActivity } from "@/lib/activity-logger";

interface RemixParent {
  id: string;
  title: string;
}

const TECH_SUGGESTIONS = ["React", "Next.js", "Tailwind", "TypeScript", "Python", "Supabase", "OpenAI", "Stripe", "Node.js", "PostgreSQL", "Vue", "Svelte", "FastAPI", "Django"];
const CATEGORIES = [
  { value: "saas_tool", label: "SaaS Tool" },
  { value: "ai_app", label: "AI App" },
  { value: "landing_page", label: "Landing Page" },
  { value: "utility", label: "Utility" },
  { value: "game", label: "Game" },
  { value: "other", label: "Other" },
];

const BUILT_WITH_OPTIONS = [
  { value: "lovable", label: "Lovable" },
  { value: "claude_code", label: "Claude Code" },
  { value: "cursor", label: "Cursor" },
  { value: "bolt", label: "Bolt" },
  { value: "replit", label: "Replit" },
  { value: "other", label: "Other" },
];

type Step = 1 | 2 | 3;

export default function Sell() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [step, setStep] = useState<Step>(1);
  const [submitting, setSubmitting] = useState(false);
  const [remixParent, setRemixParent] = useState<RemixParent | null>(null);

  const remixId = searchParams.get("remix");

  // Load remix parent info
  useEffect(() => {
    if (!remixId) return;
    supabase
      .from("listings")
      .select("id, title")
      .eq("id", remixId)
      .single()
      .then(({ data }) => {
        if (data) setRemixParent(data);
      });
  }, [remixId]);

  const [form, setForm] = useState({
    title: "",
    description: "",
    price: "",
    pricing_type: "one_time" as "one_time" | "monthly",
    completeness_badge: "prototype" as "prototype" | "mvp" | "production_ready",
    category: "other" as string,
    tech_stack: [] as string[],
    github_url: "",
    demo_url: "",
    built_with: "" as string,
    screenshots: [] as string[],
    file_path: null as string | null,
  });
  const [techInput, setTechInput] = useState("");
  const [uploadingScreenshot, setUploadingScreenshot] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);

  if (!loading && !user) return <Navigate to="/login" replace />;

  function update(field: string, value: unknown) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function addTech(tag: string) {
    const t = tag.trim();
    if (t && !form.tech_stack.includes(t)) {
      update("tech_stack", [...form.tech_stack, t]);
    }
    setTechInput("");
  }

  function removeTech(tag: string) {
    update("tech_stack", form.tech_stack.filter((t) => t !== tag));
  }

  async function uploadScreenshot(file: File) {
    if (!user) return;
    setUploadingScreenshot(true);
    const path = `${user.id}/${Date.now()}-${file.name}`;
    const { data, error } = await supabase.storage.from("listing-screenshots").upload(path, file, { upsert: true });
    if (error) {
      toast({ title: "Upload failed", description: error.message, variant: "destructive" });
    } else {
      const { data: urlData } = supabase.storage.from("listing-screenshots").getPublicUrl(data.path);
      update("screenshots", [...form.screenshots, urlData.publicUrl]);
    }
    setUploadingScreenshot(false);
  }

  async function uploadProjectFile(file: File) {
    if (!user) return;
    setUploadingFile(true);
    const path = `${user.id}/${Date.now()}-${file.name}`;
    const { data, error } = await supabase.storage.from("listing-files").upload(path, file, { upsert: true });
    if (error) {
      toast({ title: "Upload failed", description: error.message, variant: "destructive" });
    } else {
      update("file_path", data.path);
      toast({ title: "ZIP uploaded ✓", description: "Buyers will receive this after purchase." });
    }
    setUploadingFile(false);
  }

  async function handleSubmit() {
    if (!user) return;
    setSubmitting(true);
    const priceFloat = parseFloat(form.price);
    if (isNaN(priceFloat) || priceFloat < 0) {
      toast({ title: "Price must be $0.00 or more", variant: "destructive" });
      setSubmitting(false);
      return;
    }
    const priceInCents = Math.round(priceFloat * 100);

    const { data: insertedData, error } = await supabase.from("listings").insert([{
      seller_id: user.id,
      title: form.title,
      description: form.description,
      price: priceInCents,
      pricing_type: form.pricing_type,
      completeness_badge: form.completeness_badge as "prototype" | "mvp" | "production_ready",
      category: form.category as "saas_tool" | "ai_app" | "landing_page" | "utility" | "game" | "other",
      tech_stack: form.tech_stack,
      github_url: form.github_url || null,
      demo_url: form.demo_url || null,
      built_with: form.built_with || null,
      screenshots: form.screenshots,
      file_path: form.file_path,
      status: "pending" as const,
      remixed_from: remixParent?.id || null,
    }]).select("id").single();

    if (error) {
      toast({ title: "Failed to create listing", description: error.message, variant: "destructive" });
    } else {
      // Create remix chain entry if this is a remix
      if (remixParent && insertedData?.id) {
        await supabase.from("remix_chains").insert({
          parent_listing_id: remixParent.id,
          child_listing_id: insertedData.id,
          remixer_id: user.id,
        });
      }
      logActivity({ event_type: "listing_submitted", event_data: { title: form.title, category: form.category, price: form.price, built_with: form.built_with, remixed_from: remixParent?.id }, page: "/sell" });
      toast({ title: remixParent ? "Remix submitted! 🔄" : "Listing submitted! 🎉", description: "Your listing is pending review and will go live soon." });
      navigate("/dashboard");
    }
    setSubmitting(false);
  }

  const isStep1Valid = form.title && form.description && form.price !== "" && parseFloat(form.price) >= 0;
  const isStep2Valid = form.completeness_badge && form.category && form.built_with;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-10 max-w-2xl">

        {/* Remix banner */}
        {remixParent && (
          <div className="mb-6 rounded-xl border border-primary/30 bg-primary/5 p-4 flex items-center gap-3">
            <GitFork className="h-5 w-5 text-primary shrink-0" />
            <div>
              <p className="text-sm font-bold text-primary">Remixing: {remixParent.title}</p>
              <p className="text-xs text-muted-foreground">Your improved version will link back to the original in the remix chain.</p>
            </div>
          </div>
        )}

        {/* Seller value prop */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary mb-3">
            {remixParent ? "🔄 Remix" : "⚡ Instant payouts"}
          </div>
          <h1 className="text-3xl font-black mb-2">{remixParent ? "Ship your remix" : "Turn your project into income"}</h1>
          <p className="text-muted-foreground">{remixParent ? "Improve it, relist it, earn from your work. 20% platform fee applies." : "List once. Sell forever. The moment someone buys, you get paid — no waiting, no invoices."}</p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-8">
          {([1, 2, 3] as Step[]).map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                step >= s ? "gradient-hero text-white shadow-glow" : "bg-muted text-muted-foreground"
              }`}>
                {s}
              </div>
              {s < 3 && <div className={`h-0.5 w-12 rounded-full transition-all ${step > s ? "bg-primary" : "bg-muted"}`} />}
            </div>
          ))}
          <span className="ml-2 text-sm text-muted-foreground">
            {step === 1 ? "Basic info" : step === 2 ? "Details & tags" : "Files & media"}
          </span>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-card space-y-5">
          {/* Step 1 */}
          {step === 1 && (
            <>
              <MagicImport
                onImport={(data) => {
                  setForm((f) => ({
                    ...f,
                    title: data.title || f.title,
                    description: data.description || f.description,
                    tech_stack: data.tech_stack?.length ? data.tech_stack : f.tech_stack,
                    category: data.category || f.category,
                    completeness_badge: (data.completeness as typeof f.completeness_badge) || f.completeness_badge,
                    demo_url: data.demo_url || f.demo_url,
                    screenshots: data.screenshots?.length ? [...data.screenshots, ...f.screenshots].slice(0, 5) : data.screenshot_url ? [data.screenshot_url, ...f.screenshots].slice(0, 5) : f.screenshots,
                  }));
                  toast({ title: "✨ Project imported!", description: "Review the auto-filled details and adjust as needed." });
                }}
              />
              <div className="relative">
                <div className="absolute inset-x-0 top-1/2 h-px bg-border" />
                <p className="relative bg-card text-xs text-muted-foreground text-center w-fit mx-auto px-3">or fill in manually</p>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1.5">Project title *</label>
                <Input placeholder="e.g. AI Email Writer SaaS" value={form.title} onChange={(e) => update("title", e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1.5">Description *</label>
                <textarea
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring min-h-32 resize-none"
                  placeholder="Describe what this project does, what's included, and what stage it's at..."
                  value={form.description}
                  onChange={(e) => update("description", e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1.5">
                  Price (USD) *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="29.00"
                    value={form.price}
                    onChange={(e) => update("price", e.target.value)}
                    className="pl-7"
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Set to $0.00 to offer it free · Paid out to you instantly on every sale
                </p>
              </div>
            </>
          )}

          {/* Step 2 */}
          {step === 2 && (
            <>
              <div>
                <label className="block text-sm font-semibold mb-3">Completeness badge *</label>
                <div className="grid grid-cols-1 gap-3">
                  {(["prototype", "mvp", "production_ready"] as const).map((b) => (
                    <button
                      key={b}
                      onClick={() => update("completeness_badge", b)}
                      className={`rounded-xl border-2 p-4 text-left transition-all ${
                        form.completeness_badge === b ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground"
                      }`}
                    >
                      <CompletenessBadge level={b} showTooltip={false} />
                      <p className="text-xs text-muted-foreground mt-2">
                        {b === "prototype" && "Early concept, rough edges, core idea present"}
                        {b === "mvp" && "Core features work end-to-end, ready to iterate"}
                        {b === "production_ready" && "Polished, documented, and deployable"}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Built with *</label>
                <div className="flex flex-wrap gap-2">
                  {BUILT_WITH_OPTIONS.map(({ value, label }) => (
                    <button
                      key={value}
                      onClick={() => update("built_with", value)}
                      className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all border ${
                        form.built_with === value
                          ? "gradient-hero text-white border-transparent shadow-sm"
                          : "border-border hover:border-primary text-muted-foreground"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-1.5">Tag which tool was used to build this project</p>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Category *</label>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map(({ value, label }) => (
                    <button
                      key={value}
                      onClick={() => update("category", value)}
                      className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all border ${
                        form.category === value
                          ? "gradient-hero text-white border-transparent shadow-sm"
                          : "border-border hover:border-primary text-muted-foreground"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Tech stack tags</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {form.tech_stack.map((tag) => (
                    <span key={tag} className="flex items-center gap-1 rounded-full bg-primary/10 text-primary px-3 py-1 text-sm font-medium">
                      {tag}
                      <button onClick={() => removeTech(tag)}><X className="h-3 w-3" /></button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Add a tag (e.g. React)"
                    value={techInput}
                    onChange={(e) => setTechInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addTech(techInput)}
                  />
                  <Button variant="outline" size="icon" onClick={() => addTech(techInput)}><Plus className="h-4 w-4" /></Button>
                </div>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {TECH_SUGGESTIONS.filter((t) => !form.tech_stack.includes(t)).slice(0, 8).map((tag) => (
                    <button
                      key={tag}
                      onClick={() => addTech(tag)}
                      className="rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground hover:bg-muted/70 transition-colors"
                    >
                      + {tag}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Step 3 */}
          {step === 3 && (
            <>
              {/* ZIP File Upload */}
              <div>
                <label className="block text-sm font-semibold mb-1.5 flex items-center gap-2">
                  <FileArchive className="h-4 w-4" /> Project ZIP file
                </label>
                {form.file_path ? (
                  <div className="flex items-center gap-3 rounded-xl border border-primary/40 bg-primary/5 p-3">
                    <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-primary">ZIP uploaded</p>
                      <p className="text-xs text-muted-foreground truncate">{form.file_path.split("/").pop()}</p>
                    </div>
                    <button
                      onClick={() => update("file_path", null)}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border hover:border-primary cursor-pointer transition-colors p-8 text-muted-foreground hover:text-primary">
                    {uploadingFile ? (
                      <div className="h-6 w-6 rounded-full border-2 border-primary border-t-transparent animate-spin mb-2" />
                    ) : (
                      <FileArchive className="h-8 w-8 mb-2" />
                    )}
                    <span className="text-sm font-medium">{uploadingFile ? "Uploading…" : "Upload project ZIP"}</span>
                    <span className="text-xs mt-1">Max 50MB · .zip files only</span>
                    <input
                      type="file"
                      accept=".zip,application/zip"
                      className="hidden"
                      disabled={uploadingFile}
                      onChange={(e) => e.target.files?.[0] && uploadProjectFile(e.target.files[0])}
                    />
                  </label>
                )}
                <p className="text-xs text-muted-foreground mt-1.5">
                  Buyers receive a secure download link immediately after purchase. You can also use GitHub below.
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1.5 flex items-center gap-2">
                  <Github className="h-4 w-4" /> GitHub repo URL
                </label>
                <Input placeholder="https://github.com/you/your-project" value={form.github_url} onChange={(e) => update("github_url", e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1.5 flex items-center gap-2">
                  <LinkIcon className="h-4 w-4" /> Demo URL
                </label>
                <Input placeholder="https://your-demo.vercel.app" value={form.demo_url} onChange={(e) => update("demo_url", e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1.5">Screenshots (up to 5)</label>
                <div className="flex flex-wrap gap-3 mb-3">
                  {form.screenshots.map((src, i) => (
                    <div key={i} className="relative h-24 w-36 rounded-lg overflow-hidden">
                      <img src={src} alt={`Screenshot ${i + 1}`} className="w-full h-full object-cover" />
                      <button
                        onClick={() => update("screenshots", form.screenshots.filter((_, idx) => idx !== i))}
                        className="absolute top-1 right-1 h-5 w-5 rounded-full bg-black/60 text-white flex items-center justify-center"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                  {form.screenshots.length < 5 && (
                    <label className="h-24 w-36 rounded-lg border-2 border-dashed border-border hover:border-primary flex flex-col items-center justify-center cursor-pointer transition-colors text-muted-foreground hover:text-primary">
                      {uploadingScreenshot ? (
                        <div className="h-5 w-5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                      ) : (
                        <>
                          <Upload className="h-5 w-5 mb-1" />
                          <span className="text-xs">Upload</span>
                        </>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => e.target.files?.[0] && uploadScreenshot(e.target.files[0])}
                      />
                    </label>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">JPG, PNG, or WebP. Max 5 screenshots.</p>
              </div>
            </>
          )}

          {/* Navigation */}
          <div className="flex justify-between pt-2">
            {step > 1 ? (
              <Button variant="outline" onClick={() => setStep((s) => (s - 1) as Step)}>Back</Button>
            ) : <div />}
            {step < 3 ? (
              <Button
                onClick={() => setStep((s) => (s + 1) as Step)}
                disabled={step === 1 ? !isStep1Valid : !isStep2Valid}
                className="gradient-hero text-white border-0 shadow-glow hover:opacity-90"
              >
                Next step
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={submitting}
                className="gradient-hero text-white border-0 shadow-glow hover:opacity-90"
              >
                {submitting ? "Submitting..." : "Submit listing 🚀"}
              </Button>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
