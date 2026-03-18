import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export interface SavedIdea {
  id: string;
  name: string;
  description: string;
  category: string;
  priority: string;
  search_query: string;
  source_url: string | null;
  notes: string | null;
  status: string;
  created_at: string;
}

export function useSavedIdeas() {
  const { user } = useAuth();
  const [ideas, setIdeas] = useState<SavedIdea[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchIdeas = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from("saved_ideas")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (data) setIdeas(data as SavedIdea[]);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchIdeas(); }, [fetchIdeas]);

  const saveIdea = useCallback(async (idea: {
    name: string;
    description: string;
    category: string;
    priority: string;
    search_query: string;
    source_url?: string;
  }) => {
    if (!user) { toast.error("Sign in to save ideas"); return false; }
    const { error } = await supabase.from("saved_ideas").insert({
      user_id: user.id,
      name: idea.name,
      description: idea.description,
      category: idea.category,
      priority: idea.priority,
      search_query: idea.search_query,
      source_url: idea.source_url || null,
    });
    if (error) { toast.error("Failed to save idea"); return false; }
    toast.success("Idea saved!");
    fetchIdeas();
    return true;
  }, [user, fetchIdeas]);

  const updateIdea = useCallback(async (id: string, updates: Partial<Pick<SavedIdea, "notes" | "status" | "name" | "description">>) => {
    const { error } = await supabase
      .from("saved_ideas")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) { toast.error("Update failed"); return; }
    fetchIdeas();
  }, [fetchIdeas]);

  const deleteIdea = useCallback(async (id: string) => {
    const { error } = await supabase.from("saved_ideas").delete().eq("id", id);
    if (error) { toast.error("Delete failed"); return; }
    toast.success("Idea removed");
    fetchIdeas();
  }, [fetchIdeas]);

  return { ideas, loading, saveIdea, updateIdea, deleteIdea, refetch: fetchIdeas };
}
