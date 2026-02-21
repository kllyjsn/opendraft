import { Button } from "@/components/ui/button";
import { useFollow } from "@/hooks/useFollow";
import { UserPlus, UserCheck, Loader2 } from "lucide-react";

interface FollowButtonProps {
  targetUserId: string;
  size?: "sm" | "default";
}

export function FollowButton({ targetUserId, size = "default" }: FollowButtonProps) {
  const { isFollowing, toggleFollow, loading, isSelf } = useFollow(targetUserId);

  if (isSelf) return null;

  return (
    <Button
      variant={isFollowing ? "outline" : "default"}
      size={size}
      onClick={toggleFollow}
      disabled={loading}
      className={
        isFollowing
          ? "border-border/60 hover:border-destructive hover:text-destructive hover:bg-destructive/5 transition-colors"
          : "gradient-hero text-white border-0 shadow-glow hover:opacity-90"
      }
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : isFollowing ? (
        <>
          <UserCheck className="h-4 w-4 mr-1.5" /> Following
        </>
      ) : (
        <>
          <UserPlus className="h-4 w-4 mr-1.5" /> Follow
        </>
      )}
    </Button>
  );
}
