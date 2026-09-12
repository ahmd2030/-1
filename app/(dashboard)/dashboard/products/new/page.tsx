"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { Globe, Cpu, Loader2, Send, Plus, X, Upload } from "lucide-react";
import { useChat } from "ai/react";
import { toast } from "sonner";

const AsyncImageGenerator = ({ result }: { result: any }) => {
  const [data, setData] = useState<{imageUrl?: string, error?: string, brandName?: string}>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (result.imageUrl || result.error) {
       setData(result);
       setLoading(false);
       return;
    }
    
    if (result.status === 'ready_to_generate') {
      fetch('/api/generate/base64', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(result)
      })
      .then(r => r.json())
      .then(d => {
         setData(d);
         setLoading(false);
      })
      .catch(e => {
         setData({ error: e.message });
         setLoading(false);
      });
    }
  }, [result]);

  if (loading) return <p className="text-xs text-green-600 mt-1">✓ تم استلام طلب التوليد — جاري المعالجة (قد يستغرق 20-30 ثانية)...</p>;
  if (data.error) return <p className="text-xs text-red-600">❌ خطأ: {data.error}</p>;
  return (
    <div className="flex flex-col gap-2 mt-2">
      <p className="text-xs text-green-600 font-medium">✨ تم توليد الصورة بنجاح!</p>
      {data.imageUrl && <img src={data.imageUrl} className="rounded-lg border shadow-sm max-w-full h-auto max-h-80 object-cover" />}
      {data.brandName && <p className="text-xs text-slate-500 text-center italic mt-1">{data.brandName}</p>}
    </div>
  );
};

export default function AIDirectorPage() {
  const { messages, input, handleInputChange, append, setInput, isLoading, error } = useChat({
    api: "/api/chat",
    maxToolRoundtrips: 5,
  });

  const [attachments, setAttachments] = useState<File[]>([]);
  const [uploadedUrls, setUploadedUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const uploadFile = async (file: File): Promise<string | null> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
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
      <div className="bg-slate-900 text-white px-6 py-4 flex flex-row-reverse justify-between items-center z-10">
        <div className="flex items-center gap-3">
          <div className="text-right">
            <h2 className="font-bold text-lg">المخرج الذكي • AI Director</h2>
            <p className="text-xs text-slate-400">متخصص في الأزياء والموضة • يبحث على الإنترنت • يتذكر المحادثة</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center">
            <span className="text-xl">✨</span>
          </div>
        </div>
        <div className="mr-auto flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs text-slate-400">Gemini Flash</span>
        </div>
      </div>
      {/* Error Banner */}
      {error && (
        <div className="bg-red-50 text-red-600 px-4 py-2 text-xs text-center border-b border-red-100 font-medium">
          خطأ: {error.message}
        </div>
      )}

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50 scroll-smooth">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto">
            <div className="w-16 h-16 rounded-2xl bg-slate-900 text-white flex items-center justify-center mb-6 shadow-xl">
              <span className="text-3xl">✨</span>
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
                        <AsyncImageGenerator result={t.result} />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-end">
            <div className="bg-white border shadow-sm rounded-2xl rounded-tr-sm px-4 py-3 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-300 animate-bounce" />
              <span className="w-1.5 h-1.5 rounded-full bg-slate-300 animate-bounce [animation-delay:0.1s]" />
              <span className="w-1.5 h-1.5 rounded-full bg-slate-300 animate-bounce [animation-delay:0.2s]" />
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t z-10">
        {/* Attachments Preview */}
        {attachments.length > 0 && (
          <div className="flex gap-2 mb-3 overflow-x-auto pb-2">
            {attachments.map((file, i) => (
              <div key={i} className="relative group shrink-0">
                <img
                  src={URL.createObjectURL(file)}
                  alt="preview"
                  className="w-16 h-16 object-cover rounded-xl border shadow-sm"
                />
                <button
                  onClick={() => removeAttachment(i)}
                  className="absolute -top-2 -right-2 bg-slate-800 text-white rounded-full p-1 shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-3 h-3" />
                </button>
                {uploading && i >= uploadedUrls.length && (
                  <div className="absolute inset-0 bg-white/60 flex items-center justify-center rounded-xl">
                    <Loader2 className="w-5 h-5 animate-spin text-slate-800" />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-2">
          <button
            disabled={isLoading || uploading}
            onClick={handleSend}
            className="h-12 w-12 flex items-center justify-center rounded-xl bg-slate-900 hover:bg-slate-800 text-white disabled:opacity-50 transition-colors shrink-0"
          >
            <Send className="w-5 h-5 rtl:-scale-x-100" />
          </button>
          
          <div className="flex-1 relative flex items-center">
            <textarea
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="تحدث مع المخرج... أو ارفع صوراً ليحللها"
              className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition-all resize-none text-right placeholder:text-right"
              dir="rtl"
            />
            <input
              type="file"
              id="file-upload"
              multiple
              accept="image/*"
              className="hidden"
              onChange={handleFileSelect}
            />
            <label
              htmlFor="file-upload"
              className="absolute left-3 text-slate-400 hover:text-slate-700 cursor-pointer transition-colors"
            >
              <Upload className="w-5 h-5" />
            </label>
          </div>
        </div>
        <p className="text-center text-[10px] text-slate-400 mt-3 font-medium">
          Enter للإرسال • Shift+Enter لسطر جديد
        </p>
      </div>
    </div>
  );
}
