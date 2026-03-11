import { useState, useEffect } from "react";
import { useParams, useNavigate, Navigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { CompletenessBadge } from "@/components/CompletenessBadge";
import { ProjectGoalsEditor } from "@/components/ProjectGoalsEditor";
import { Upload, Plus, X, Link as LinkIcon, Github, FileArchive, CheckCircle2, Loader2, Save } from "lucide-react";

const TECH_SUGGESTIONS = ["React", "Next.js", "Tailwind", "TypeScript", "Python", "Supabase", "OpenAI", "Stripe", "Node.js", "PostgreSQL"];
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

export default function EditListing() {
  const { id } = useParams<{ id: string }>();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [techInput, setTechInput] = useState("");
  const [uploadingScreenshot, setUploadingScreenshot] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);

  const [form, setForm] = useState({
    title: "",
    description: "",
    price: "",
    pricing_type: "one_time" as "one_time" | "monthly",
    completeness_badge: "prototype" as "prototype" | "mvp" | "production_ready",
    category: "other",
    tech_stack: [] as string[],
    github_url: "",
    demo_url: "",
    built_with: "",
    screenshots: [] as string[],
    file_path: null as string | null,
  });

  useEffect(() => {
    if (!user || !id) return;
    supabase
      .from("listings")
      .select("*")
      .eq("id", id)
      .eq("seller_id", user.id)
      .single()
      .then(({ data, error }) => {
        if (error || !data) {
          toast({ title: "Listing not found or not yours", variant: "destructive" });
          navigate("/dashboard");
          return;
        }
        setForm({
          title: data.title,
          description: data.description,
          price: (data.price / 100).toFixed(2),
          pricing_type: data.pricing_type,
          completeness_badge: data.completeness_badge,
          category: data.category,
          tech_stack: data.tech_stack || [],
          github_url: data.github_url || "",
          demo_url: data.demo_url || "",
          built_with: data.built_with || "",
          screenshots: data.screenshots || [],
          file_path: data.file_path,
        });
        setLoading(false);
      });
  }, [user, id]);

  if (!authLoading && !user) return <Navigate to="/login" replace />;

  function update(field: string, value: unknown) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function addTech(tag: string) {
    const t = tag.trim();
    if (t && !form.tech_stack.includes(t)) update("tech_stack", [...form.tech_stack, t]);
    setTechInput("");
  }

  async function uploadScreenshots(files: FileList) {
    if (!user) return;
    setUploadingScreenshot(true);
    const remaining = 10 - form.screenshots.length;
    const toUpload = Array.from(files).slice(0, remaining);
    const newUrls: string[] = [];

    for (const file of toUpload) {
      const path = `${user.id}/${Date.now()}-${file.name}`;
      const { data, error } = await supabase.storage.from("listing-screenshots").upload(path, file, { upsert: true });
      if (!error && data) {
        const { data: urlData } = supabase.storage.from("listing-screenshots").getPublicUrl(data.path);
        newUrls.push(urlData.publicUrl);
      }
    }
    if (newUrls.length) {
      update("screenshots", [...form.screenshots, ...newUrls]);
      toast({ title: `${newUrls.length} image${newUrls.length > 1 ? "s" : ""} uploaded ✓` });
    }
    setUploadingScreenshot(false);
  }

  async function uploadProjectFile(file: File) {
    if (!user) return;
    setUploadingFile(true);
    const path = `${user.id}/${Date.now()}-${file.name}`;
    const { data, error } = await supabase.storage.from("listing-files").upload(path, file, { upsert: true });
    if (!error && data) {
      update("file_path", data.path);
      toast({ title: "ZIP uploaded ✓" });
    }
    setUploadingFile(false);
  }

  async function handleSave() {
    if (!user || !id) return;
    setSaving(true);
    const priceInCents = Math.round(parseFloat(form.price) * 100);
    if (isNaN(priceInCents) || priceInCents < 0) {
      toast({ title: "Invalid price", variant: "destructive" });
      setSaving(false);
      return;
    }

    const { error } = await supabase
      .from("listings")
      .update({
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
      })
      .eq("id", id)
      .eq("seller_id", user.id);

    if (error) {
      toast({ title: "Failed to save", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Listing updated ✓" });
      navigate("/dashboard?tab=listings");
    }
    setSaving(false);
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-10 max-w-2xl">
        <div className="mb-8">
          <h1 className="text-3xl font-black mb-2">Edit Listing</h1>
          <p className="text-muted-foreground text-sm">Update your listing details, screenshots, and files.</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-card space-y-5">
          {/* Title */}
          <div>
            <label className="block text-sm font-semibold mb-1.5">Project title *</label>
            <Input value={form.title} onChange={(e) => update("title", e.target.value)} />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold mb-1.5">Description *</label>
            <textarea
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring min-h-32 resize-none"
              value={form.description}
              onChange={(e) => update("description", e.target.value)}
            />
          </div>

          {/* Pricing */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-2">Pricing type</label>
              <div className="flex gap-2">
                {(["one_time", "monthly"] as const).map((v) => (
                  <button
                    key={v}
                    onClick={() => update("pricing_type", v)}
                    className={`flex-1 rounded-lg border-2 p-2 text-xs font-bold transition-all ${
                      form.pricing_type === v ? "border-primary bg-primary/5" : "border-border"
                    }`}
                  >
                    {v === "one_time" ? "One-time" : "Monthly"}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">Price (USD)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                <Input type="number" min="0" step="0.01" value={form.price} onChange={(e) => update("price", e.target.value)} className="pl-7" />
              </div>
            </div>
          </div>

          {/* Completeness */}
          <div>
            <label className="block text-sm font-semibold mb-3">Completeness badge</label>
            <div className="flex gap-2">
              {(["prototype", "mvp", "production_ready"] as const).map((b) => (
                <button
                  key={b}
                  onClick={() => update("completeness_badge", b)}
                  className={`flex-1 rounded-lg border-2 p-3 text-left transition-all ${
                    form.completeness_badge === b ? "border-primary bg-primary/5" : "border-border"
                  }`}
                >
                  <CompletenessBadge level={b} showTooltip={false} />
                </button>
              ))}
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-semibold mb-2">Category</label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => update("category", value)}
                  className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all border ${
                    form.category === value ? "gradient-hero text-white border-transparent shadow-sm" : "border-border text-muted-foreground"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Built with */}
          <div>
            <label className="block text-sm font-semibold mb-2">Built with</label>
            <div className="flex flex-wrap gap-2">
              {BUILT_WITH_OPTIONS.map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => update("built_with", value)}
                  className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all border ${
                    form.built_with === value ? "gradient-hero text-white border-transparent shadow-sm" : "border-border text-muted-foreground"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Tech stack */}
          <div>
            <label className="block text-sm font-semibold mb-2">Tech stack</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {form.tech_stack.map((tag) => (
                <span key={tag} className="flex items-center gap-1 rounded-full bg-primary/10 text-primary px-3 py-1 text-sm font-medium">
                  {tag}
                  <button onClick={() => update("tech_stack", form.tech_stack.filter((t) => t !== tag))}><X className="h-3 w-3" /></button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <Input placeholder="Add tag" value={techInput} onChange={(e) => setTechInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addTech(techInput)} />
              <Button variant="outline" size="icon" onClick={() => addTech(techInput)}><Plus className="h-4 w-4" /></Button>
            </div>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {TECH_SUGGESTIONS.filter((t) => !form.tech_stack.includes(t)).slice(0, 6).map((tag) => (
                <button key={tag} onClick={() => addTech(tag)} className="rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground hover:bg-muted/70">+ {tag}</button>
              ))}
            </div>
          </div>

          {/* URLs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-1.5 flex items-center gap-2"><Github className="h-4 w-4" /> GitHub URL</label>
              <Input value={form.github_url} onChange={(e) => update("github_url", e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1.5 flex items-center gap-2"><LinkIcon className="h-4 w-4" /> Demo URL</label>
              <Input value={form.demo_url} onChange={(e) => update("demo_url", e.target.value)} />
            </div>
          </div>

          {/* Screenshots — bulk upload */}
          <div>
            <label className="block text-sm font-semibold mb-1.5">Screenshots (up to 10)</label>
            <div className="flex flex-wrap gap-3 mb-3">
              {form.screenshots.map((src, i) => (
                <div key={i} className="relative h-24 w-36 rounded-lg overflow-hidden group">
                  <img src={src} alt={`Screenshot ${i + 1}`} className="w-full h-full object-cover" />
                  <button
                    onClick={() => update("screenshots", form.screenshots.filter((_, idx) => idx !== i))}
                    className="absolute top-1 right-1 h-5 w-5 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
              {form.screenshots.length < 10 && (
                <label className="h-24 w-36 rounded-lg border-2 border-dashed border-border hover:border-primary flex flex-col items-center justify-center cursor-pointer transition-colors text-muted-foreground hover:text-primary">
                  {uploadingScreenshot ? <div className="h-5 w-5 rounded-full border-2 border-primary border-t-transparent animate-spin" /> : <><Upload className="h-5 w-5 mb-1" /><span className="text-xs">Upload images</span></>}
                  <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => e.target.files?.length && uploadScreenshots(e.target.files)} />
                </label>
              )}
            </div>
            <p className="text-xs text-muted-foreground">{form.screenshots.length}/10 — Select multiple files at once</p>
          </div>

          {/* ZIP */}
          <div>
            <label className="block text-sm font-semibold mb-1.5 flex items-center gap-2"><FileArchive className="h-4 w-4" /> Project ZIP</label>
            {form.file_path ? (
              <div className="flex items-center gap-3 rounded-xl border border-primary/40 bg-primary/5 p-3">
                <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                <p className="text-sm font-medium text-primary flex-1 truncate">{form.file_path.split("/").pop()}</p>
                <button onClick={() => update("file_path", null)} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border hover:border-primary cursor-pointer transition-colors p-6 text-muted-foreground hover:text-primary">
                {uploadingFile ? <div className="h-6 w-6 rounded-full border-2 border-primary border-t-transparent animate-spin mb-2" /> : <FileArchive className="h-8 w-8 mb-2" />}
                <span className="text-sm font-medium">{uploadingFile ? "Uploading…" : "Upload ZIP"}</span>
                <input type="file" accept=".zip" className="hidden" disabled={uploadingFile} onChange={(e) => e.target.files?.[0] && uploadProjectFile(e.target.files[0])} />
              </label>
            )}
          </div>

          {/* Project Goals */}
          {id && <ProjectGoalsEditor listingId={id} />}

          {/* Save */}
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => navigate("/dashboard?tab=listings")}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving || !form.title || !form.description} className="gradient-hero text-white border-0 shadow-glow hover:opacity-90 gap-2">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {saving ? "Saving…" : "Save changes"}
            </Button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
