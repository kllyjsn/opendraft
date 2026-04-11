import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
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

    api.get<{ followers: number; following: number }>(`/follows/count/${targetUserId}`)
      .then(({ followers, following }) => {
        setFollowersCount(followers ?? 0);
        setFollowingCount(following ?? 0);
      })
      .catch(() => {});

    if (user && !isSelf) {
      api.get<{ isFollowing: boolean }>(`/follows/check?following_id=${targetUserId}`)
        .then(({ isFollowing: f }) => setIsFollowing(f))
        .catch(() => {});
    }
  }, [user, targetUserId, isSelf]);

  const toggleFollow = useCallback(async () => {
    if (!user || !targetUserId || isSelf || loading) return;
    setLoading(true);

    try {
      if (isFollowing) {
        await api.delete(`/follows/${targetUserId}`);
        setIsFollowing(false);
        setFollowersCount((c) => Math.max(0, c - 1));
      } else {
        await api.post("/follows", { following_id: targetUserId });
        setIsFollowing(true);
        setFollowersCount((c) => c + 1);
        api.post("/functions/notify-follow", { followingId: targetUserId }).catch(() => {});
      }
    } catch {
      // ignore
    }

    setLoading(false);
  }, [user, targetUserId, isFollowing, isSelf, loading]);

  return { isFollowing, toggleFollow, loading, followersCount, followingCount, isSelf };
}
