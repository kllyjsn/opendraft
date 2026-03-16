import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, MicOff, X, Volume2, Loader2, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BrandMascot } from "@/components/BrandMascot";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useLocation, useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface ListingContext {
  id: string;
  title: string;
  description: string;
  category: string;
  tech_stack: string[];
  completeness_badge: string;
  price: number;
  demo_url: string | null;
}

// Browser SpeechRecognition types
interface SpeechRecognitionEvent {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent {
  error: string;
}

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export function GremlinVoiceAgent() {
  const { user } = useAuth();
  const { toast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();

  const isHomePage = location.pathname === "/";

  const [open, setOpen] = useState(false);
  const [listening, setListening] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [transcript, setTranscript] = useState("");
  const [listingContext, setListingContext] = useState<ListingContext | null>(null);
  const [pulseIntensity, setPulseIntensity] = useState(0);

  const recognitionRef = useRef<any>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const pulseInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  // Detect listing context from URL
  useEffect(() => {
    const match = location.pathname.match(/^\/listing\/([^/]+)$/);
    if (match) {
      const listingId = match[1];
      supabase
        .from("listings")
        .select("id, title, description, category, tech_stack, completeness_badge, price, demo_url")
        .eq("id", listingId)
        .single()
        .then(({ data }) => {
          if (data) setListingContext(data as ListingContext);
        });
    } else {
      setListingContext(null);
    }
  }, [location.pathname]);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, transcript]);

  // Check for browser speech recognition support
  const hasSpeechRecognition = typeof window !== "undefined" && 
    (window.SpeechRecognition || window.webkitSpeechRecognition);

  const startListening = useCallback(() => {
    if (!hasSpeechRecognition) {
      toast({
        title: "Voice not supported",
        description: "Your browser doesn't support speech recognition. Try Chrome or Edge.",
        variant: "destructive",
      });
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    let finalTranscript = "";

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = "";
      for (let i = 0; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript;
        } else {
          interim += result[0].transcript;
        }
      }
      setTranscript(finalTranscript + (interim ? interim : ""));
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error("Speech recognition error:", event.error);
      if (event.error !== "no-speech") {
        setListening(false);
      }
    };

    recognition.onend = () => {
      setListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
    setTranscript("");

    // Simulate pulse animation
    pulseInterval.current = setInterval(() => {
      setPulseIntensity(Math.random());
    }, 150);
  }, [hasSpeechRecognition, toast]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setListening(false);
    if (pulseInterval.current) {
      clearInterval(pulseInterval.current);
      pulseInterval.current = null;
    }
    setPulseIntensity(0);
  }, []);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim()) return;

    const userMsg: ChatMessage = { role: "user", content: text.trim() };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setTranscript("");
    setProcessing(true);

    try {
      // Get AI response
      const { data, error } = await supabase.functions.invoke("gremlin-voice-chat", {
        body: {
          messages: updatedMessages.map((m) => ({ role: m.role, content: m.content })),
          listingContext,
        },
      });

      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);

      const assistantContent = data?.content || "The Gremlins are speechless. Try again!";
      const assistantMsg: ChatMessage = { role: "assistant", content: assistantContent };
      setMessages((prev) => [...prev, assistantMsg]);
      setProcessing(false);

      // Generate and play TTS
      await playTTS(assistantContent);
    } catch (err) {
      console.error("Gremlin chat error:", err);
      setProcessing(false);
      const errorContent = err instanceof Error ? err.message : "Something went wrong";
      toast({ title: "Gremlin hiccup", description: errorContent, variant: "destructive" });
    }
  }, [messages, listingContext, toast]);

  const playTTS = async (text: string) => {
    setSpeaking(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/gremlin-tts`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ text }),
        }
      );

      if (!response.ok) {
        console.error("TTS failed:", response.status);
        setSpeaking(false);
        return;
      }

      const data = await response.json();
      if (data?.audioContent) {
        const audioUrl = `data:audio/mpeg;base64,${data.audioContent}`;
        const audio = new Audio(audioUrl);
        audioRef.current = audio;
        audio.onended = () => setSpeaking(false);
        audio.onerror = () => setSpeaking(false);
        await audio.play();
      } else {
        setSpeaking(false);
      }
    } catch (err) {
      console.error("TTS playback error:", err);
      setSpeaking(false);
    }
  };

  const stopSpeaking = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setSpeaking(false);
  };

  const handleMicToggle = () => {
    if (listening) {
      stopListening();
      // If there's a transcript, send it
      if (transcript.trim()) {
        sendMessage(transcript);
      }
    } else {
      if (speaking) stopSpeaking();
      startListening();
    }
  };

  const handleOpen = () => {
    if (!user) {
      navigate("/login");
      return;
    }
    setOpen(true);
    // Auto-greet if no messages
    if (messages.length === 0) {
      const greeting = listingContext
        ? `Hey! I'm looking at "${listingContext.title}" — want me to suggest some improvements? Just tap the mic and tell me what you're thinking!`
        : "Hey there! I'm your Gremlin™ assistant. Tap the mic and tell me what you want to build or improve!";
      setMessages([{ role: "assistant", content: greeting }]);
      playTTS(greeting);
    }
  };

  const handleClose = () => {
    stopListening();
    stopSpeaking();
    setOpen(false);
  };

  return (
    <>
      {/* Floating mic button */}
      <AnimatePresence>
        {!open && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ delay: 1.5, type: "spring", stiffness: 200 }}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleOpen}
            className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-2xl bg-card border border-border/60 shadow-lg hover:shadow-xl px-3 py-2.5 transition-shadow group"
            aria-label="Talk to a Gremlin"
          >
            <div className="relative">
              <BrandMascot size={36} variant="wave" />
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-xs font-bold leading-tight">Talk to a Gremlin™</p>
              <p className="text-[10px] text-muted-foreground">
                {listingContext ? `About: ${listingContext.title}` : "Voice-powered improvements"}
              </p>
            </div>
            <div className="h-6 w-6 rounded-full gradient-hero flex items-center justify-center">
              <Mic className="h-3 w-3 text-white" />
            </div>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Voice chat overlay */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="fixed bottom-4 right-4 z-50 w-[calc(100vw-2rem)] max-w-sm bg-card border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col"
            style={{ maxHeight: "min(80vh, 560px)" }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border/50 bg-muted/30">
              <div className="flex items-center gap-2.5">
                <BrandMascot size={28} variant={speaking ? "thinking" : "wave"} />
                <div>
                  <p className="text-sm font-bold">Gremlin™ Voice Agent</p>
                  <p className="text-[10px] text-muted-foreground">
                    {speaking ? "Speaking…" : listening ? "Listening…" : processing ? "Thinking…" : "Ready"}
                  </p>
                </div>
              </div>
              <button onClick={handleClose} className="text-muted-foreground hover:text-foreground transition-colors p-1">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Context badge */}
            {listingContext && (
              <div className="px-4 py-1.5 bg-primary/5 border-b border-border/30 flex items-center gap-1.5">
                <span className="text-[10px] text-primary font-semibold">🎯 Context:</span>
                <span className="text-[10px] text-muted-foreground truncate">{listingContext.title}</span>
              </div>
            )}

            {/* Chat messages */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-[200px]">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground rounded-br-sm"
                        : "bg-muted text-foreground rounded-bl-sm"
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}

              {/* Live transcript */}
              {transcript && (
                <div className="flex justify-end">
                  <div className="max-w-[85%] rounded-2xl rounded-br-sm px-3 py-2 text-sm bg-primary/20 text-primary border border-primary/30 italic">
                    {transcript}
                    <span className="inline-block w-1 h-4 bg-primary/50 ml-0.5 animate-pulse" />
                  </div>
                </div>
              )}

              {/* Processing indicator */}
              {processing && (
                <div className="flex justify-start">
                  <div className="rounded-2xl rounded-bl-sm px-3 py-2 bg-muted text-muted-foreground text-sm flex items-center gap-2">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Gremlins are thinking…
                  </div>
                </div>
              )}

              <div ref={chatEndRef} />
            </div>

            {/* Mic control area */}
            <div className="border-t border-border/50 bg-muted/20 px-4 py-4">
              <div className="flex items-center justify-center gap-4">
                {/* Mic button with pulse animation */}
                <div className="relative">
                  {/* Pulse rings when listening */}
                  {listening && (
                    <>
                      <motion.div
                        animate={{ scale: [1, 1.5 + pulseIntensity * 0.5], opacity: [0.4, 0] }}
                        transition={{ duration: 1, repeat: Infinity, ease: "easeOut" }}
                        className="absolute inset-0 rounded-full bg-primary/30"
                      />
                      <motion.div
                        animate={{ scale: [1, 1.3 + pulseIntensity * 0.3], opacity: [0.3, 0] }}
                        transition={{ duration: 1.2, repeat: Infinity, ease: "easeOut", delay: 0.2 }}
                        className="absolute inset-0 rounded-full bg-primary/20"
                      />
                    </>
                  )}

                  <Button
                    size="lg"
                    onClick={handleMicToggle}
                    disabled={processing}
                    className={`relative h-14 w-14 rounded-full ${
                      listening
                        ? "bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                        : "gradient-hero text-white hover:opacity-90"
                    } shadow-lg transition-all`}
                  >
                    {listening ? (
                      <MicOff className="h-6 w-6" />
                    ) : (
                      <Mic className="h-6 w-6" />
                    )}
                  </Button>
                </div>

                {/* Stop speaking button */}
                {speaking && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={stopSpeaking}
                    className="gap-1.5"
                  >
                    <Volume2 className="h-3.5 w-3.5" />
                    Stop
                  </Button>
                )}
              </div>

              <p className="text-center text-[10px] text-muted-foreground mt-2">
                {listening
                  ? "Listening… tap to stop & send"
                  : speaking
                  ? "Gremlin is speaking…"
                  : processing
                  ? "Processing your request…"
                  : "Tap the mic to speak"}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
