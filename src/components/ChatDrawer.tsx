import { useState, useRef, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Loader2 } from "lucide-react";
import { usePubNub } from "@/hooks/usePubNub";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

interface ChatDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conversationId: string | null;
  listingId?: string;
  sellerId?: string;
  listingTitle?: string;
  otherUsername?: string;
}

export function ChatDrawer({
  open,
  onOpenChange,
  conversationId,
  listingId,
  sellerId,
  listingTitle,
  otherUsername,
}: ChatDrawerProps) {
  const { user } = useAuth();
  const { messages, sendMessage } = usePubNub(open ? conversationId : null);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [localConvoId, setLocalConvoId] = useState(conversationId);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLocalConvoId(conversationId);
  }, [conversationId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend() {
    if (!input.trim() || sending) return;
    setSending(true);
    try {
      const result = await sendMessage(input.trim(), listingId, sellerId);
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
      <SheetContent className="flex flex-col p-0 w-full sm:max-w-md">
        <SheetHeader className="px-5 pt-5 pb-3 border-b border-border/40">
          <SheetTitle className="text-base font-bold truncate">
            {otherUsername ? `Chat with ${otherUsername}` : "Chat"}
          </SheetTitle>
          {listingTitle && (
            <p className="text-xs text-muted-foreground truncate">Re: {listingTitle}</p>
          )}
        </SheetHeader>

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          {messages.length === 0 && (
            <div className="flex-1 flex items-center justify-center py-16">
              <p className="text-sm text-muted-foreground text-center">
                No messages yet. Say hello! 👋
              </p>
            </div>
          )}
          {messages.map((msg) => {
            const isMe = msg.sender_id === user?.id;
            return (
              <div
                key={msg.id}
                className={cn("flex", isMe ? "justify-end" : "justify-start")}
              >
                <div
                  className={cn(
                    "max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
                    isMe
                      ? "bg-primary text-primary-foreground rounded-br-md"
                      : "bg-muted text-foreground rounded-bl-md"
                  )}
                >
                  <p className="whitespace-pre-wrap break-words">{msg.content}</p>
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
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="border-t border-border/40 px-4 py-3 flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
            placeholder="Type a message…"
            maxLength={2000}
            className="flex-1"
            disabled={sending}
          />
          <Button
            size="icon"
            onClick={handleSend}
            disabled={!input.trim() || sending}
            className="shrink-0 gradient-hero text-white border-0"
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
