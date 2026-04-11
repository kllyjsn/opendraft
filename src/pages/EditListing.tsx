import { useState, useEffect, useRef, useMemo } from "react";
import { useParams, useNavigate, Navigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { CompletenessBadge } from "@/components/CompletenessBadge";
import { api } from "@/lib/api";
import {
  Upload, Plus, X, Github, FileArchive, CheckCircle2, Loader2,
  Save, ArrowLeft, Send, Sparkles, Eye, Settings2, Image as ImageIcon,
  Code, Globe, ChevronDown, ChevronRight, Pencil, Bot, ExternalLink,
  Link as LinkIcon,
} from "lucide-react";

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

type Panel = "details" | "media" | "code";

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
  const [activePanel, setActivePanel] = useState<Panel>("details");
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const chatInputRef = useRef<HTMLTextAreaElement>(null);

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
    api.from("listings")
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
    setHasUnsavedChanges(true);
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
      const { data, error } = await api.post<{ path: string }>("/storage/upload", { bucket: "listing-screenshots", path, file }).catch((e: any) => ({ data: null, error: e }));
      if (!error && data) {
        const publicUrl = `${import.meta.env.VITE_API_URL || "http://localhost:3001/api"}/storage/public/listing-screenshots/${data.path}`;
        newUrls.push(publicUrl);
      }
    }
    if (newUrls.length) {
      update("screenshots", [...form.screenshots, ...newUrls]);
      toast({ title: `${newUrls.length} image${newUrls.length > 1 ? "s" : ""} uploaded` });
    }
    setUploadingScreenshot(false);
  }

  async function uploadProjectFile(file: File) {
    if (!user) return;
    setUploadingFile(true);
    const path = `${user.id}/${Date.now()}-${file.name}`;
    const { data, error } = await api.post("/storage/upload", { bucket: "listing-files", path: path, file: file });
    if (!error && data) {
      update("file_path", data.path);
      toast({ title: "ZIP uploaded" });
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

    const { error } = await api.from("listings")
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
      toast({ title: "Changes saved" });
      setHasUnsavedChanges(false);
    }
    setSaving(false);
  }

  async function handleAiRequest() {
    if (!aiPrompt.trim() || !user || !id) return;
    const prompt = aiPrompt.trim();
    setAiPrompt("");
    setAiLoading(true);
    try {
      const { data: data, error } = await api.post<{ data: any }>("/functions/swarm-app-analyzer", { listing_id: id, trigger: "manual", user_id: user.id, focus_prompt: prompt },);
      if (error) throw error;
      toast({ title: `Analysis complete — Score: ${data.score}/100` });
    } catch (e: any) {
      toast({ title: "Analysis failed", description: e.message, variant: "destructive" });
    } finally {
      setAiLoading(false);
    }
  }

  const panels: { key: Panel; label: string; icon: React.ReactNode }[] = [
    { key: "details", label: "Details", icon: <Pencil className="h-3.5 w-3.5" /> },
    { key: "media", label: "Media", icon: <ImageIcon className="h-3.5 w-3.5" /> },
    { key: "code", label: "Source", icon: <Code className="h-3.5 w-3.5" /> },
  ];

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading workspace…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* ─── Minimal Top Bar ─── */}
      <header className="shrink-0 h-14 border-b border-border/50 bg-card/80 backdrop-blur-xl flex items-center justify-between px-4 z-50">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(hasUnsavedChanges ? "#" : `/listing/${id}`)}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Back</span>
          </button>
          <div className="h-5 w-px bg-border/60" />
          <div className="flex items-center gap-2 min-w-0">
            <div className="h-6 w-6 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
              <Pencil className="h-3 w-3 text-primary" />
            </div>
            <span className="text-sm font-bold truncate max-w-[200px] sm:max-w-xs">{form.title || "Untitled"}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {form.demo_url && (
            <a href={form.demo_url} target="_blank" rel="noopener noreferrer">
              <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-xs text-muted-foreground">
                <ExternalLink className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Preview</span>
              </Button>
            </a>
          )}
          <Button
            onClick={handleSave}
            disabled={saving || !form.title || !form.description}
            size="sm"
            className="h-8 gap-1.5 text-xs font-bold gradient-hero text-white border-0 shadow-glow hover:opacity-90"
          >
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            {saving ? "Saving…" : hasUnsavedChanges ? "Save changes" : "Saved"}
          </Button>
        </div>
      </header>

      {/* ─── Main Workspace ─── */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">

        {/* ─── Left: Editor Panel ─── */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Panel tabs */}
          <div className="shrink-0 border-b border-border/40 bg-card/50 px-4">
            <div className="flex gap-1 -mb-px">
              {panels.map((p) => (
                <button
                  key={p.key}
                  onClick={() => setActivePanel(p.key)}
                  className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-semibold transition-colors border-b-2 ${
                    activePanel === p.key
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {p.icon}
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Panel content */}
          <div className="flex-1 overflow-y-auto">
            <div className="max-w-2xl mx-auto p-5 space-y-5">
              <AnimatePresence mode="wait">
                {activePanel === "details" && (
                  <motion.div
                    key="details"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-5"
                  >
                    {/* Title */}
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-2">Title</label>
                      <Input
                        value={form.title}
                        onChange={(e) => update("title", e.target.value)}
                        className="h-11 text-base font-semibold bg-background/50 border-border/60 focus:border-primary/50"
                        placeholder="My awesome app"
                      />
                    </div>

                    {/* Description */}
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-2">Description</label>
                      <textarea
                        className="w-full rounded-lg border border-border/60 bg-background/50 px-3 py-3 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30 focus-visible:border-primary/50 min-h-[140px] resize-none leading-relaxed transition-colors"
                        value={form.description}
                        onChange={(e) => update("description", e.target.value)}
                        placeholder="Describe what your app does, who it's for, and why it's valuable…"
                      />
                    </div>

                    {/* Category + Built With — pill selectors */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-2">Category</label>
                        <div className="flex flex-wrap gap-1.5">
                          {CATEGORIES.map(({ value, label }) => (
                            <button
                              key={value}
                              onClick={() => update("category", value)}
                              className={`rounded-full px-3 py-1 text-xs font-semibold transition-all ${
                                form.category === value
                                  ? "bg-primary text-primary-foreground shadow-sm"
                                  : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
                              }`}
                            >
                              {label}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-2">Built with</label>
                        <div className="flex flex-wrap gap-1.5">
                          {BUILT_WITH_OPTIONS.map(({ value, label }) => (
                            <button
                              key={value}
                              onClick={() => update("built_with", value)}
                              className={`rounded-full px-3 py-1 text-xs font-semibold transition-all ${
                                form.built_with === value
                                  ? "bg-primary text-primary-foreground shadow-sm"
                                  : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
                              }`}
                            >
                              {label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Completeness badge */}
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-2">Completeness</label>
                      <div className="grid grid-cols-3 gap-2">
                        {(["prototype", "mvp", "production_ready"] as const).map((b) => (
                          <button
                            key={b}
                            onClick={() => update("completeness_badge", b)}
                            className={`rounded-xl border-2 p-3 text-center transition-all ${
                              form.completeness_badge === b
                                ? "border-primary bg-primary/5 shadow-sm"
                                : "border-border/40 hover:border-border"
                            }`}
                          >
                            <CompletenessBadge level={b} showTooltip={false} />
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Tech stack */}
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-2">Tech stack</label>
                      {form.tech_stack.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-2.5">
                          {form.tech_stack.map((tag) => (
                            <span key={tag} className="inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary px-2.5 py-0.5 text-xs font-semibold">
                              {tag}
                              <button onClick={() => update("tech_stack", form.tech_stack.filter((t) => t !== tag))} className="hover:text-primary/70">
                                <X className="h-3 w-3" />
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                      <div className="flex gap-2">
                        <Input
                          placeholder="Add technology…"
                          value={techInput}
                          onChange={(e) => setTechInput(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTech(techInput))}
                          className="h-9 text-sm bg-background/50 border-border/60"
                        />
                        <Button variant="outline" size="sm" className="h-9 px-3" onClick={() => addTech(techInput)}>
                          <Plus className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {TECH_SUGGESTIONS.filter((t) => !form.tech_stack.includes(t)).slice(0, 6).map((tag) => (
                          <button
                            key={tag}
                            onClick={() => addTech(tag)}
                            className="rounded-md bg-muted/40 px-2 py-0.5 text-[10px] text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                          >
                            + {tag}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Pricing */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-2">Pricing</label>
                        <div className="flex gap-1.5">
                          {(["one_time", "monthly"] as const).map((v) => (
                            <button
                              key={v}
                              onClick={() => update("pricing_type", v)}
                              className={`flex-1 rounded-lg border-2 py-2 text-xs font-bold transition-all ${
                                form.pricing_type === v ? "border-primary bg-primary/5 text-primary" : "border-border/40 text-muted-foreground"
                              }`}
                            >
                              {v === "one_time" ? "One-time" : "Monthly"}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-2">Price</label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={form.price}
                            onChange={(e) => update("price", e.target.value)}
                            className="pl-7 h-9 bg-background/50 border-border/60"
                          />
                        </div>
                      </div>
                    </div>

                    {/* URLs */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
                          <Github className="h-3.5 w-3.5" /> GitHub URL
                        </label>
                        <Input
                          value={form.github_url}
                          onChange={(e) => update("github_url", e.target.value)}
                          className="h-9 text-sm bg-background/50 border-border/60"
                          placeholder="https://github.com/…"
                        />
                      </div>
                      <div>
                        <label className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
                          <Globe className="h-3.5 w-3.5" /> Demo URL
                        </label>
                        <Input
                          value={form.demo_url}
                          onChange={(e) => update("demo_url", e.target.value)}
                          className="h-9 text-sm bg-background/50 border-border/60"
                          placeholder="https://…"
                        />
                      </div>
                    </div>
                  </motion.div>
                )}

                {activePanel === "media" && (
                  <motion.div
                    key="media"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-5"
                  >
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-3">Screenshots</label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {form.screenshots.map((src, i) => (
                          <div key={i} className="relative aspect-video rounded-xl overflow-hidden group border border-border/40 bg-muted/20">
                            <img src={src} alt={`Screenshot ${i + 1}`} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                              <button
                                onClick={() => update("screenshots", form.screenshots.filter((_, idx) => idx !== i))}
                                className="h-8 w-8 rounded-full bg-background/90 text-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                        {form.screenshots.length < 10 && (
                          <label className="aspect-video rounded-xl border-2 border-dashed border-border/60 hover:border-primary/50 flex flex-col items-center justify-center cursor-pointer transition-colors text-muted-foreground hover:text-primary bg-muted/10">
                            {uploadingScreenshot ? (
                              <Loader2 className="h-5 w-5 animate-spin" />
                            ) : (
                              <>
                                <Upload className="h-5 w-5 mb-1" />
                                <span className="text-[10px] font-semibold">Add images</span>
                              </>
                            )}
                            <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => e.target.files?.length && uploadScreenshots(e.target.files)} />
                          </label>
                        )}
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-2">{form.screenshots.length}/10 · Select multiple files</p>
                    </div>
                  </motion.div>
                )}

                {activePanel === "code" && (
                  <motion.div
                    key="code"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-5"
                  >
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-3">Project ZIP</label>
                      {form.file_path ? (
                        <div className="flex items-center gap-3 rounded-xl border border-primary/30 bg-primary/5 p-4">
                          <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-primary truncate">{form.file_path.split("/").pop()}</p>
                            <p className="text-[10px] text-muted-foreground">ZIP file uploaded</p>
                          </div>
                          <button onClick={() => update("file_path", null)} className="text-muted-foreground hover:text-foreground transition-colors">
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <label className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border/60 hover:border-primary/50 cursor-pointer transition-colors p-10 text-muted-foreground hover:text-primary bg-muted/10">
                          {uploadingFile ? (
                            <Loader2 className="h-6 w-6 animate-spin mb-2" />
                          ) : (
                            <FileArchive className="h-8 w-8 mb-2" />
                          )}
                          <span className="text-sm font-semibold">{uploadingFile ? "Uploading…" : "Drop your ZIP here"}</span>
                          <span className="text-[10px] text-muted-foreground mt-1">or click to browse</span>
                          <input type="file" accept=".zip" className="hidden" disabled={uploadingFile} onChange={(e) => e.target.files?.[0] && uploadProjectFile(e.target.files[0])} />
                        </label>
                      )}
                    </div>

                    {/* GitHub link */}
                    <div>
                      <label className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
                        <Github className="h-3.5 w-3.5" /> Repository
                      </label>
                      <Input
                        value={form.github_url}
                        onChange={(e) => update("github_url", e.target.value)}
                        className="h-9 text-sm bg-background/50 border-border/60"
                        placeholder="https://github.com/you/project"
                      />
                      <p className="text-[10px] text-muted-foreground mt-1.5">Buyers get access to the repo or ZIP — your choice</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* ─── AI Chat Input (Lovable-style) ─── */}
          <div className="shrink-0 border-t border-border/40 bg-card/80 backdrop-blur-xl p-3 sm:p-4">
            <div className="max-w-2xl mx-auto">
              <div className="relative">
                <textarea
                  ref={chatInputRef}
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleAiRequest(); }
                  }}
                  rows={1}
                  placeholder="Ask AI to improve your listing…"
                  className="w-full rounded-xl border border-border/60 bg-background/50 pl-4 pr-12 py-3 text-sm placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:border-primary/50 resize-none transition-all"
                />
                <button
                  onClick={handleAiRequest}
                  disabled={!aiPrompt.trim() || aiLoading}
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center hover:opacity-90 disabled:opacity-30 transition-opacity"
                >
                  {aiLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </button>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <Sparkles className="h-3 w-3 text-muted-foreground/50" />
                <p className="text-[10px] text-muted-foreground/60">
                  AI analyzes your live app and suggests improvements
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ─── Right: Live Preview (desktop only) ─── */}
        <div className="hidden lg:flex w-[380px] shrink-0 border-l border-border/40 flex-col bg-background/50">
          <div className="shrink-0 px-4 py-2.5 border-b border-border/40 flex items-center gap-2">
            <Eye className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Preview</span>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            {/* Live card preview */}
            <div className="rounded-2xl border border-border/60 bg-card overflow-hidden shadow-card">
              {form.screenshots.length > 0 ? (
                <div className="aspect-video bg-muted">
                  <img src={form.screenshots[0]} alt="Preview" className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="aspect-video bg-gradient-to-br from-primary/20 via-accent/10 to-secondary/20 flex items-center justify-center">
                  <span className="text-2xl font-black text-foreground/20">{form.title?.[0] || "?"}</span>
                </div>
              )}
              <div className="p-4 space-y-3">
                <div>
                  <h3 className="font-bold text-sm leading-tight">{form.title || "Untitled listing"}</h3>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                    {form.description || "Add a description…"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <CompletenessBadge level={form.completeness_badge} showTooltip={false} />
                  {form.built_with && (
                    <span className="text-[10px] text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-full">
                      {BUILT_WITH_OPTIONS.find((o) => o.value === form.built_with)?.label}
                    </span>
                  )}
                </div>
                {form.tech_stack.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {form.tech_stack.slice(0, 5).map((tag) => (
                      <span key={tag} className="rounded-md bg-muted/50 px-2 py-0.5 text-[10px] text-muted-foreground">{tag}</span>
                    ))}
                    {form.tech_stack.length > 5 && (
                      <span className="text-[10px] text-muted-foreground">+{form.tech_stack.length - 5}</span>
                    )}
                  </div>
                )}
                <div className="pt-2 border-t border-border/40">
                  <span className="text-lg font-black">
                    {parseFloat(form.price) > 0 ? `$${parseFloat(form.price).toFixed(0)}` : "Free"}
                  </span>
                  {form.pricing_type === "monthly" && parseFloat(form.price) > 0 && (
                    <span className="text-xs text-muted-foreground">/mo</span>
                  )}
                </div>
              </div>
            </div>

            {/* Quick links */}
            <div className="mt-4 space-y-2">
              <Link to={`/listing/${id}`}>
                <Button variant="outline" size="sm" className="w-full justify-start gap-2 text-xs h-9 border-border/40">
                  <Eye className="h-3.5 w-3.5" />
                  View live listing
                </Button>
              </Link>
              {form.demo_url && (
                <a href={form.demo_url} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" size="sm" className="w-full justify-start gap-2 text-xs h-9 border-border/40">
                    <ExternalLink className="h-3.5 w-3.5" />
                    Open demo
                  </Button>
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
