import { useState, useRef, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Loader2, Circle, ArrowLeft } from "lucide-react";
import { usePubNub, usePresence } from "@/hooks/usePubNub";
import { useAuth } from "@/hooks/useAuth";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

interface ChatDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conversationId: string | null;
  listingId?: string;
  sellerId?: string;
  recipientId?: string;
  listingTitle?: string;
  otherUsername?: string;
  otherUserId?: string;
}

export function ChatDrawer({
  open,
  onOpenChange,
  conversationId,
  listingId,
  sellerId,
  recipientId,
  listingTitle,
  otherUsername,
  otherUserId,
}: ChatDrawerProps) {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const { messages, sendMessage } = usePubNub(open ? conversationId : null);
  const { isOnline } = usePresence();
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [localConvoId, setLocalConvoId] = useState(conversationId);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const otherOnline = otherUserId ? isOnline(otherUserId) : false;

  useEffect(() => {
    setLocalConvoId(conversationId);
  }, [conversationId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Auto-focus input on open (desktop only, avoids keyboard pop on mobile)
  useEffect(() => {
    if (open && !isMobile) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [open, isMobile]);

  async function handleSend() {
    if (!input.trim() || sending) return;
    setSending(true);
    try {
      const result = await sendMessage(input.trim(), listingId, sellerId, recipientId);
      if (result.conversationId && !localConvoId) {
        setLocalConvoId(result.conversationId);
      }
      setInput("");
    } catch {
      // toast would go here
    } finally {
      setSending(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        className={cn(
          "flex flex-col p-0",
          isMobile
            ? "w-full max-w-full h-full inset-0 rounded-none border-0"
            : "w-full sm:max-w-md"
        )}
        side={isMobile ? "bottom" : "right"}
      >
        {/* Header */}
        <div className={cn(
          "flex items-center gap-3 border-b border-border/40",
          isMobile ? "px-3 pt-[env(safe-area-inset-top,12px)] pb-3" : "px-5 pt-5 pb-3"
        )}>
          {isMobile && (
            <Button
              variant="ghost"
              size="icon"
              className="shrink-0 -ml-1 h-9 w-9"
              onClick={() => onOpenChange(false)}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}
          <div className="min-w-0 flex-1">
            <SheetHeader className="p-0 space-y-0">
              <SheetTitle className="text-base font-bold truncate flex items-center gap-2 text-left">
                {otherUsername ? otherUsername : "Chat"}
                {otherUserId && (
                  <Circle
                    className={cn(
                      "h-2.5 w-2.5 shrink-0",
                      otherOnline ? "fill-emerald-500 text-emerald-500" : "fill-muted-foreground/30 text-muted-foreground/30"
                    )}
                  />
                )}
              </SheetTitle>
            </SheetHeader>
            {listingTitle && (
              <p className="text-xs text-muted-foreground truncate">Re: {listingTitle}</p>
            )}
            {otherUserId && !listingTitle && (
              <p className="text-[11px] text-muted-foreground">
                {otherOnline ? "Online now" : "Offline"}
              </p>
            )}
          </div>
        </div>

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto px-3 sm:px-4 py-4 space-y-2">
          {messages.length === 0 && (
            <div className="flex-1 flex items-center justify-center py-16">
              <p className="text-sm text-muted-foreground text-center">
                No messages yet. Say hello! 👋
              </p>
            </div>
          )}
          {messages.map((msg, i) => {
            const isMe = msg.sender_id === user?.id;
            const prevMsg = messages[i - 1];
            const sameSender = prevMsg?.sender_id === msg.sender_id;
            const timeDiff = prevMsg
              ? new Date(msg.created_at).getTime() - new Date(prevMsg.created_at).getTime()
              : Infinity;
            const grouped = sameSender && timeDiff < 60_000;

            return (
              <div
                key={msg.id}
                className={cn(
                  "flex",
                  isMe ? "justify-end" : "justify-start",
                  grouped ? "mt-0.5" : "mt-2"
                )}
              >
                <div
                  className={cn(
                    "max-w-[85%] sm:max-w-[80%] px-3.5 py-2 text-sm leading-relaxed",
                    isMe
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-foreground",
                    // Rounded corners with grouping awareness
                    isMe
                      ? grouped ? "rounded-2xl rounded-br-md rounded-tr-md" : "rounded-2xl rounded-br-md"
                      : grouped ? "rounded-2xl rounded-bl-md rounded-tl-md" : "rounded-2xl rounded-bl-md"
                  )}
                >
                  <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                  {!grouped && (
                    <p
                      className={cn(
                        "text-[10px] mt-1",
                        isMe ? "text-primary-foreground/60" : "text-muted-foreground"
                      )}
                    >
                      {new Date(msg.created_at).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        {/* Input - with safe area for mobile */}
        <div className={cn(
          "border-t border-border/40 flex gap-2",
          isMobile
            ? "px-3 pt-2 pb-[max(env(safe-area-inset-bottom,8px),8px)]"
            : "px-4 py-3"
        )}>
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
            placeholder="Type a message…"
            maxLength={2000}
            className={cn("flex-1", isMobile && "h-11 text-base")}
            disabled={sending}
          />
          <Button
            size="icon"
            onClick={handleSend}
            disabled={!input.trim() || sending}
            className={cn(
              "shrink-0 gradient-hero text-white border-0",
              isMobile && "h-11 w-11"
            )}
          >
            {sending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
