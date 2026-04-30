import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X, Send, Sparkles, Loader2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useGetSession } from "@workspace/api-client-react";

type ChatRole = "user" | "assistant";

interface ChatMessage {
  role: ChatRole;
  content: string;
}

const SUGGESTED_PROMPTS = [
  "Tôi nên chọn hướng đề tài nào phù hợp với hồ sơ của tôi?",
  "Phân tích kỹ năng còn thiếu của tôi so với đề tài AI/ML.",
  "Quy trình đăng ký đề tài đồ án diễn ra như thế nào?",
  "Làm sao để tìm giảng viên hướng dẫn phù hợp?",
];

const WELCOME_MESSAGE: ChatMessage = {
  role: "assistant",
  content:
    "Xin chào! Tôi là PROMATCH AI — trợ lý ảo của bạn. Tôi có thể giúp bạn:\n• Chọn hướng đề tài phù hợp với năng lực\n• Phân tích kỹ năng còn thiếu dựa trên Hồ sơ năng lực\n• Giải đáp câu hỏi về quy trình đồ án\n\nBạn cần hỗ trợ điều gì hôm nay?",
};

export function ChatbotWidget() {
  const { data: session } = useGetSession();
  const [open, setOpen] = useState(
    typeof window !== "undefined" && window.location.search.includes("chat=open"),
  );
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MESSAGE]);
  const [isStreaming, setIsStreaming] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, open]);

  if (!session || session.role !== "student") return null;

  const sendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isStreaming) return;

    const newMessages: ChatMessage[] = [
      ...messages,
      { role: "user", content: trimmed },
      { role: "assistant", content: "" },
    ];
    setMessages(newMessages);
    setInput("");
    setIsStreaming(true);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const conversation = newMessages
        .slice(0, -1)
        .filter((m) => m.content.trim() !== "");

      const response = await fetch(
        `${import.meta.env.BASE_URL}api/chatbot/message`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: conversation }),
          signal: controller.signal,
        },
      );

      if (!response.ok || !response.body) {
        throw new Error("Network error");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let assistantText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const payload = JSON.parse(line.slice(6));
            if (payload.content) {
              assistantText += payload.content;
              setMessages((prev) => {
                const next = [...prev];
                next[next.length - 1] = {
                  role: "assistant",
                  content: assistantText,
                };
                return next;
              });
            }
            if (payload.error) {
              assistantText = `Xin lỗi, tôi đang gặp sự cố: ${payload.error}`;
              setMessages((prev) => {
                const next = [...prev];
                next[next.length - 1] = {
                  role: "assistant",
                  content: assistantText,
                };
                return next;
              });
            }
          } catch {
            /* ignore parse error */
          }
        }
      }
    } catch (err: any) {
      if (err.name !== "AbortError") {
        setMessages((prev) => {
          const next = [...prev];
          next[next.length - 1] = {
            role: "assistant",
            content:
              "Xin lỗi, tôi không kết nối được tới máy chủ. Vui lòng thử lại sau.",
          };
          return next;
        });
      }
    } finally {
      setIsStreaming(false);
      abortRef.current = null;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleReset = () => {
    abortRef.current?.abort();
    setMessages([WELCOME_MESSAGE]);
    setIsStreaming(false);
  };

  return (
    <>
      {/* Floating Toggle Button */}
      <motion.button
        type="button"
        onClick={() => setOpen((v) => !v)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 flex items-center justify-center hover:shadow-xl transition-shadow"
        aria-label={open ? "Đóng trợ lý" : "Mở trợ lý"}
      >
        <AnimatePresence mode="wait" initial={false}>
          {open ? (
            <motion.span
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <X className="w-6 h-6" />
            </motion.span>
          ) : (
            <motion.span
              key="open"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <MessageCircle className="w-6 h-6" />
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Chat Panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-24 right-6 z-50 w-[min(420px,calc(100vw-3rem))] h-[min(640px,calc(100vh-8rem))] bg-card border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="px-4 py-3 border-b bg-gradient-to-br from-primary to-primary/80 text-primary-foreground flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-semibold text-sm leading-tight">
                    PROMATCH AI
                  </div>
                  <div className="text-xs opacity-90">
                    Trợ lý ảo cho sinh viên
                  </div>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleReset}
                className="h-8 w-8 text-primary-foreground hover:bg-white/20 hover:text-primary-foreground"
                title="Bắt đầu cuộc hội thoại mới"
              >
                <RotateCcw className="w-4 h-4" />
              </Button>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1">
              <div ref={scrollRef} className="p-4 space-y-3">
                {messages.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex ${
                      msg.role === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm whitespace-pre-wrap leading-relaxed ${
                        msg.role === "user"
                          ? "bg-primary text-primary-foreground rounded-br-sm"
                          : "bg-muted text-foreground rounded-bl-sm"
                      }`}
                    >
                      {msg.content || (
                        <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          Đang suy nghĩ...
                        </span>
                      )}
                    </div>
                  </div>
                ))}

                {messages.length === 1 && !isStreaming && (
                  <div className="pt-2 space-y-2">
                    <div className="text-xs text-muted-foreground font-medium px-1">
                      Câu hỏi gợi ý:
                    </div>
                    {SUGGESTED_PROMPTS.map((prompt, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => sendMessage(prompt)}
                        className="w-full text-left text-sm px-3 py-2 rounded-lg border border-border hover:border-primary hover:bg-primary/5 transition-colors text-foreground"
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Input */}
            <form
              onSubmit={handleSubmit}
              className="p-3 border-t bg-card flex items-end gap-2"
            >
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e as any);
                  }
                }}
                placeholder="Hỏi PROMATCH AI bất cứ điều gì..."
                disabled={isStreaming}
                className="resize-none min-h-[44px] max-h-32 text-sm"
                rows={1}
              />
              <Button
                type="submit"
                size="icon"
                disabled={isStreaming || !input.trim()}
                className="h-11 w-11 shrink-0"
              >
                {isStreaming ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
