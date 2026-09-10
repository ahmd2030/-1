"use client";

import { useChat } from "ai/react";
import { useState, useRef, useEffect, useCallback } from "react";
import { Send, ImagePlus, Loader2, Sparkles, Globe, Cpu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function ChatDirectorPage() {
  const { messages, append, isLoading, error } = useChat({
    api: "/api/chat",
    onError: (err) => {
      console.error("Chat error:", err);
      toast.error(`خطأ في المحادثة: ${err.message || "تأكد من إعداد OPENAI_API_KEY في Vercel"}`);
    },
  });
  const [input, setInput] = useState("");
  const [attachments, setAttachments] = useState<File[]>([]);
  const [uploadedUrls, setUploadedUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const uploadFile = async (file: File): Promise<string | null> => {
    // Use FileReader instead of Buffer (Buffer is Node.js only, not available in browser)
    const base64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result.split(",")[1]); // Remove "data:image/...;base64," prefix
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
    const body = new URLSearchParams();
    body.append("key", "6d207e02198a847aa98d0a2a901485a5");
    body.append("action", "upload");
    body.append("source", base64);
    body.append("format", "json");
    try {
      const res = await fetch("https://freeimage.host/api/1/upload", {
        method: "POST",
        body,
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });
      const data = await res.json();
      return data.image?.url ?? null;
    } catch {
      return null;
    }
  };

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);
    setAttachments((prev) => [...prev, ...files]);
    setUploading(true);
    const urls = await Promise.all(files.map(uploadFile));
    const valid = urls.filter(Boolean) as string[];
    setUploadedUrls((prev) => [...prev, ...valid]);
    setUploading(false);
    if (valid.length < files.length) toast.error("فشل رفع بعض الصور");
    e.target.value = "";
  }, []);

  const removeAttachment = (i: number) => {
    setAttachments((p) => p.filter((_, idx) => idx !== i));
    setUploadedUrls((p) => p.filter((_, idx) => idx !== i));
  };

  const handleSend = async () => {
    const text = input.trim();
    if (!text && uploadedUrls.length === 0) return;

    // Build message content with vision support
    const contentParts: any[] = [];
    if (text) contentParts.push({ type: "text", text });
    uploadedUrls.forEach((url) =>
      contentParts.push({ type: "image_url", image_url: { url } })
    );

    const content = contentParts.length === 1 && contentParts[0].type === "text"
      ? text
      : contentParts;

    setInput("");
    setAttachments([]);
    setUploadedUrls([]);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await append({ role: "user", content: content as any });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const getToolLabel = (toolName: string) => {
    if (toolName === "webSearch") return { icon: Globe, label: "يبحث في الإنترنت...", color: "text-blue-500" };
    if (toolName === "generateFashionImages") return { icon: Cpu, label: "يجهز التوليد...", color: "text-violet-500" };
    return { icon: Loader2, label: "يعمل...", color: "text-slate-500" };
  };

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)] max-w-4xl mx-auto rounded-2xl overflow-hidden border bg-white shadow-lg">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b bg-gradient-to-r from-slate-900 to-slate-800 text-white">
        <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-amber-400" />
        </div>
        <div>
          <h2 className="font-bold text-sm">المخرج الذكي · AI Director</h2>
          <p className="text-xs text-slate-400">متخصص في الأزياء والموضة · يبحث على الإنترنت · يتذكر المحادثة</p>
        </div>
        <div className="mr-auto flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs text-slateald-400">GPT-4o</span>
        </div>
      </div>
      {/* Error Banner */}
      {error && (
        <div className="px-5 py-3 bg-red-50 border-b border-red-200 text-red-700 text-sm flex items-center gap-2" dir="rtl">
          <span>⚠️</span>
          <span>{error.message.includes("API key") || error.message.includes("401") 
            ? "مفتاح OpenAI غير صحيح أو غير موجود. تأكد من إضافة OPENAI_API_KEY في إعدادات Vercel."
            : `خطأ: ${error.message}`}</span>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5 bg-slate-50" dir="rtl">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center p-8">
            <div className="w-20 h-20 rounded-full bg-slate-900 flex items-center justify-center mb-5 shadow-xl">
              <Sparkles className="w-9 h-9 text-amber-400" />
            </div>
            <h3 className="text-2xl font-bold mb-2 text-slate-800">أهلاً، أنا المخرج الذكي</h3>
            <p className="text-slate-500 max-w-sm text-sm leading-relaxed">
              ارفع صور منتجاتك وأخبرني كيف تريد إخراجها. يمكنني تحليل الصور، البحث عن أحدث صيحات الموضة، وتوليد صور احترافية.
            </p>
            <div className="mt-6 grid grid-cols-1 gap-2 w-full max-w-sm">
              {[
                "ما هي أبرز صيحات موضة الأطفال لموسم الخريف 2025؟",
                "حلّل هذه الصورة واقترح كيف أحسّن الستايل",
                "ولّد صوراً لهذه المنتجات مع شعار Baby Rose بالوردي",
              ].map((s) => (
                <button
                  key={s}
                  onClick={() => setInput(s)}
                  className="text-right text-sm px-4 py-2.5 rounded-xl border bg-white hover:bg-slate-100 text-slate-700 transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.role === "user" ? "justify-start" : "justify-end"}`}>
            <div className={`max-w-[82%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
              m.role === "user"
                ? "bg-slate-900 text-white rounded-tl-sm"
                : "bg-white border shadow-sm text-slate-800 rounded-tr-sm"
            }`}>
              {/* Render text content */}
              {typeof m.content === "string" && (
                <p className="whitespace-pre-wrap">{m.content}</p>
              )}
              {Array.isArray(m.content) && m.content.map((part: any, i: number) => {
                if (part.type === "text") return <p key={i} className="whitespace-pre-wrap">{part.text}</p>;
                if (part.type === "image_url") return (
                  <img key={i} src={part.image_url.url} alt="attachment" className="mt-2 rounded-lg max-h-48 object-cover" />
                );
                return null;
              })}

              {/* Tool invocations */}
              {m.toolInvocations?.map((t: any) => {
                const info = getToolLabel(t.toolName);
                return (
                  <div key={t.toolCallId} className="mt-3 flex items-start gap-2 p-3 rounded-xl bg-slate-50 border text-slate-700">
                    {t.state !== "result" && <Loader2 className={`w-4 h-4 mt-0.5 animate-spin shrink-0 ${info.color}`} />}
                    {t.state === "result" && <info.icon className={`w-4 h-4 mt-0.5 shrink-0 ${info.color}`} />}
                    <div>
                      <p className="text-xs font-medium">{info.label}</p>
                      {t.state === "result" && t.toolName === "webSearch" && t.result?.results && (
                        <ul className="mt-1 space-y-1">
                          {t.result.results.slice(0, 3).map((r: any, i: number) => (
                            <li key={i} className="text-xs text-blue-600 underline truncate">
                              <a href={r.url} target="_blank" rel="noopener noreferrer">{r.title}</a>
                            </li>
                          ))}
                        </ul>
                      )}
                      {t.state === "result" && t.toolName === "generateFashionImages" && (
                        <p className="text-xs text-green-600 mt-1">✓ تم استلام طلب التوليد — جاري المعالجة...</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {isLoading && messages[messages.length - 1]?.role === "user" && (
          <div className="flex justify-end">
            <div className="bg-white border shadow-sm rounded-2xl rounded-tr-sm px-4 py-3 flex gap-2 items-center text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">المخرج يفكر...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 bg-white border-t" dir="rtl">
        {attachments.length > 0 && (
          <div className="flex gap-2 mb-3 overflow-x-auto pb-1">
            {attachments.map((file, i) => (
              <div key={i} className="relative shrink-0 w-16 h-16 rounded-lg overflow-hidden border">
                <img src={URL.createObjectURL(file)} alt="" className="w-full h-full object-cover" />
                {uploadedUrls.length <= i && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <Loader2 className="w-4 h-4 text-white animate-spin" />
                  </div>
                )}
                <button
                  onClick={() => removeAttachment(i)}
                  className="absolute top-0.5 right-0.5 w-4 h-4 bg-black/60 rounded-full flex items-center justify-center text-white hover:bg-black"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-2 items-end">
          <input
            type="file"
            multiple
            accept="image/*"
            className="hidden"
            ref={fileInputRef}
            onChange={handleFileSelect}
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="shrink-0 h-11 w-11 rounded-xl"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImagePlus className="w-4 h-4 text-slate-600" />}
          </Button>

          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="تحدث مع المخرج... أو ارفع صوراً ليحللها"
            rows={1}
            className="flex-1 resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300 max-h-32"
          />

          <Button
            onClick={handleSend}
            disabled={isLoading || uploading || (!input.trim() && uploadedUrls.length === 0)}
            className="shrink-0 h-11 w-11 rounded-xl bg-slate-900 hover:bg-slate-700"
            size="icon"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
        <p className="text-center text-xs text-slate-400 mt-2">Enter للإرسال · Shift+Enter للسطر الجديد</p>
      </div>
    </div>
  );
}
