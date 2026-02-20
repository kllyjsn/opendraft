import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Trash2, Tag, Percent, DollarSign } from "lucide-react";

interface DiscountCode {
  id: string;
  code: string;
  discount_type: "percentage" | "fixed";
  discount_value: number;
  active: boolean;
  created_at: string;
}

export function AdminDiscountCodes() {
  const { toast } = useToast();
  const [codes, setCodes] = useState<DiscountCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  // Form state
  const [newCode, setNewCode] = useState("");
  const [discountType, setDiscountType] = useState<"percentage" | "fixed">("percentage");
  const [discountValue, setDiscountValue] = useState("");

  useEffect(() => {
    fetchCodes();
  }, []);

  async function fetchCodes() {
    // Admins can see all codes via the admin policy (including inactive)
    const { data } = await supabase
      .from("discount_codes")
      .select("*")
      .order("created_at", { ascending: false });
    setCodes((data as DiscountCode[]) ?? []);
    setLoading(false);
  }

  async function handleCreate() {
    const trimmed = newCode.trim().toUpperCase();
    if (!trimmed) return toast({ title: "Enter a code", variant: "destructive" });

    const val = parseInt(discountValue);
    if (!val || val <= 0) return toast({ title: "Enter a valid value", variant: "destructive" });
    if (discountType === "percentage" && val > 100) return toast({ title: "Percentage can't exceed 100", variant: "destructive" });

    setCreating(true);
    const { error } = await supabase.from("discount_codes").insert({
      code: trimmed,
      discount_type: discountType,
      discount_value: discountType === "fixed" ? val : val, // for fixed, value is in cents
    });

    if (error) {
      toast({ title: "Error", description: error.message.includes("unique") ? "Code already exists" : error.message, variant: "destructive" });
    } else {
      toast({ title: `Code "${trimmed}" created ✓` });
      setNewCode("");
      setDiscountValue("");
      fetchCodes();
    }
    setCreating(false);
  }

  async function toggleActive(id: string, active: boolean) {
    await supabase.from("discount_codes").update({ active: !active }).eq("id", id);
    setCodes((prev) => prev.map((c) => (c.id === id ? { ...c, active: !active } : c)));
  }

  async function deleteCode(id: string) {
    await supabase.from("discount_codes").delete().eq("id", id);
    setCodes((prev) => prev.filter((c) => c.id !== id));
    toast({ title: "Code deleted" });
  }

  function formatValue(code: DiscountCode) {
    return code.discount_type === "percentage"
      ? `${code.discount_value}%`
      : `$${(code.discount_value / 100).toFixed(2)}`;
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-6">
        <Tag className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-bold">Discount Codes</h2>
      </div>

      {/* Create form */}
      <div className="rounded-xl border border-border bg-muted/30 p-4 mb-6">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">New Code</p>
        <div className="flex flex-wrap gap-2">
          <Input
            placeholder="CODE"
            value={newCode}
            onChange={(e) => setNewCode(e.target.value.toUpperCase())}
            className="w-32 uppercase font-mono"
            maxLength={20}
          />
          <div className="flex rounded-lg border border-border overflow-hidden">
            <button
              onClick={() => setDiscountType("percentage")}
              className={`px-3 py-2 text-xs font-semibold flex items-center gap-1 transition-colors ${
                discountType === "percentage" ? "bg-primary text-primary-foreground" : "bg-card hover:bg-muted"
              }`}
            >
              <Percent className="h-3 w-3" /> %
            </button>
            <button
              onClick={() => setDiscountType("fixed")}
              className={`px-3 py-2 text-xs font-semibold flex items-center gap-1 transition-colors ${
                discountType === "fixed" ? "bg-primary text-primary-foreground" : "bg-card hover:bg-muted"
              }`}
            >
              <DollarSign className="h-3 w-3" /> $
            </button>
          </div>
          <Input
            type="number"
            placeholder={discountType === "percentage" ? "e.g. 20" : "e.g. 500 (cents)"}
            value={discountValue}
            onChange={(e) => setDiscountValue(e.target.value)}
            className="w-36"
            min={1}
          />
          <Button onClick={handleCreate} disabled={creating} size="sm">
            {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Plus className="h-4 w-4 mr-1" /> Add</>}
          </Button>
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : codes.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">No discount codes yet.</p>
      ) : (
        <div className="space-y-2">
          {codes.map((code) => (
            <div key={code.id} className="flex items-center gap-3 rounded-xl border border-border bg-card p-3">
              <code className="font-mono font-bold text-sm">{code.code}</code>
              <span className="text-xs text-muted-foreground">{formatValue(code)} off</span>
              <span className={`ml-auto text-xs font-semibold px-2 py-0.5 rounded-full ${
                code.active ? "bg-green-100 text-green-700" : "bg-muted text-muted-foreground"
              }`}>
                {code.active ? "Active" : "Disabled"}
              </span>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs"
                onClick={() => toggleActive(code.id, code.active)}
              >
                {code.active ? "Disable" : "Enable"}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                onClick={() => deleteCode(code.id)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
