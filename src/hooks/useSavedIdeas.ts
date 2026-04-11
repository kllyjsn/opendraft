import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
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
    try {
      const { data } = await api.get<{ data: SavedIdea[] }>("/saved-ideas");
      if (data) setIdeas(data);
    } catch {
      // ignore
    }
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
    try {
      await api.post("/saved-ideas", {
        name: idea.name,
        description: idea.description,
        category: idea.category,
        priority: idea.priority,
        search_query: idea.search_query,
        source_url: idea.source_url || null,
      });
      toast.success("Idea saved!");
      fetchIdeas();
      return true;
    } catch {
      toast.error("Failed to save idea");
      return false;
    }
  }, [user, fetchIdeas]);

  const updateIdea = useCallback(async (id: string, updates: Partial<Pick<SavedIdea, "notes" | "status" | "name" | "description">>) => {
    try {
      await api.patch(`/saved-ideas/${id}`, updates);
      fetchIdeas();
    } catch {
      toast.error("Update failed");
    }
  }, [fetchIdeas]);

  const deleteIdea = useCallback(async (id: string) => {
    try {
      await api.delete(`/saved-ideas/${id}`);
      toast.success("Idea removed");
      fetchIdeas();
    } catch {
      toast.error("Delete failed");
    }
  }, [fetchIdeas]);

  return { ideas, loading, saveIdea, updateIdea, deleteIdea, refetch: fetchIdeas };
}
