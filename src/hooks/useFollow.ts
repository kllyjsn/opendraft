import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export function useFollow(targetUserId: string | undefined) {
  const { user } = useAuth();
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);

  const isSelf = user?.id === targetUserId;

  useEffect(() => {
    if (!targetUserId) return;

    // Fetch follower/following counts from profile
    supabase
      .from("profiles")
      .select("followers_count, following_count")
      .eq("user_id", targetUserId)
      .single()
      .then(({ data }) => {
        if (data) {
          setFollowersCount((data as any).followers_count ?? 0);
          setFollowingCount((data as any).following_count ?? 0);
        }
      });

    // Check if current user follows this target
    if (user && !isSelf) {
      supabase
        .from("follows")
        .select("id")
        .eq("follower_id", user.id)
        .eq("following_id", targetUserId)
        .maybeSingle()
        .then(({ data }) => {
          setIsFollowing(!!data);
        });
    }
  }, [user, targetUserId, isSelf]);

  const toggleFollow = useCallback(async () => {
    if (!user || !targetUserId || isSelf || loading) return;
    setLoading(true);

    if (isFollowing) {
      const { error } = await supabase
        .from("follows")
        .delete()
        .eq("follower_id", user.id)
        .eq("following_id", targetUserId);
      if (!error) {
        setIsFollowing(false);
        setFollowersCount((c) => Math.max(0, c - 1));
      }
    } else {
      const { error } = await supabase
        .from("follows")
        .insert({ follower_id: user.id, following_id: targetUserId });
      if (!error) {
        setIsFollowing(true);
        setFollowersCount((c) => c + 1);
        // Send follow notification (fire-and-forget)
        supabase.functions.invoke("notify-follow", {
          body: { followingId: targetUserId },
        }).catch(() => {});
      }
    }

    setLoading(false);
  }, [user, targetUserId, isFollowing, isSelf, loading]);

  return { isFollowing, toggleFollow, loading, followersCount, followingCount, isSelf };
}
