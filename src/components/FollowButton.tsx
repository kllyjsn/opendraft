import { Button } from "@/components/ui/button";
import { useFollow } from "@/hooks/useFollow";
import { useAuth } from "@/hooks/useAuth";
import { UserPlus, UserCheck, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface FollowButtonProps {
  targetUserId: string;
  size?: "sm" | "default";
}

export function FollowButton({ targetUserId, size = "sm" }: FollowButtonProps) {
  const { user } = useAuth();
  const { isFollowing, toggleFollow, loading, isSelf } = useFollow(targetUserId);
  const navigate = useNavigate();

  if (isSelf) return null;

  const handleClick = () => {
    if (!user) {
      navigate("/login");
      return;
    }
    toggleFollow();
  };

  return (
    <Button
      variant={isFollowing ? "outline" : "secondary"}
      size="sm"
      onClick={handleClick}
      disabled={loading}
      className={
        isFollowing
          ? "h-7 px-2.5 text-xs border-border/60 hover:border-destructive hover:text-destructive hover:bg-destructive/5 transition-colors"
          : "h-7 px-2.5 text-xs"
      }
    >
      {loading ? (
        <Loader2 className="h-3 w-3 animate-spin" />
      ) : isFollowing ? (
        <>
          <UserCheck className="h-3 w-3 mr-1" /> Following
        </>
      ) : (
        <>
          <UserPlus className="h-3 w-3 mr-1" /> Follow
        </>
      )}
    </Button>
  );
}
