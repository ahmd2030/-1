"use client";

import React, { useState, useEffect } from "react";
import { Send, X, Upload, Image as ImageIcon } from "lucide-react";
import { useChat } from "ai/react";
import { toast } from "sonner";

const AsyncImageGenerator = ({ generateData, base64Image }: { generateData: any; base64Image: string }) => {
  const [data, setData] = useState<{imageUrl?: string, error?: string, brandName?: string}>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!generateData || !base64Image) {
      setData({ error: "بيانات الصورة غير مكتملة" });
      setLoading(false);
      return;
    }
    
    fetch('/api/generate/base64', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: 'ready_to_generate',
        garmentImage: base64Image,
        modelType: generateData.modelType,
        style: generateData.stylePrompt,
      })
    })
    .then(r => r.json())
    .then(d => {
       setData(d);
       setLoading(false);
       if (d.imageUrl) {
         try {
           const existing = JSON.parse(localStorage.getItem('ai_fashion_generated_images') || '[]');
           localStorage.setItem('ai_fashion_generated_images', JSON.stringify([d.imageUrl, ...existing]));
           toast.success("تم التوليد بنجاح! الصورة متاحة في معرض الصور المولدة.");
         } catch(e) {}
       }
    })
    .catch(e => {
       setData({ error: e.message });
       setLoading(false);
    });
  }, [generateData, base64Image]);

  if (loading) return <p className="text-xs text-green-600 mt-2 font-medium">✨ جاري توليد الصورة في الخلفية (قد يستغرق 30 ثانية)...</p>;
  if (data.error) return <p className="text-xs text-red-600 mt-2">❌ خطأ: {data.error}</p>;
  return (
    <div className="flex flex-col gap-2 mt-4 bg-slate-50 p-3 rounded-xl border">
      <p className="text-xs text-green-600 font-medium">✨ تم توليد الصورة بنجاح!</p>
      {data.imageUrl && <img src={data.imageUrl} className="rounded-lg border shadow-sm max-w-full h-auto max-h-80 object-cover" />}
    </div>
  );
};

export default function AIDirectorPage() {
  const { messages, input, handleInputChange, append, setInput, isLoading, error } = useChat({
    api: "/api/chat",
  });

  const [attachments, setAttachments] = useState<File[]>([]);
  const [uploadedUrls, setUploadedUrls] = useState<string[]>([]);
  const [showGallery, setShowGallery] = useState(false);
  const [galleryImages, setGalleryImages] = useState<string[]>([]);

  useEffect(() => {
    if (showGallery) {
      try {
        const stored = JSON.parse(localStorage.getItem('ai_fashion_generated_images') || '[]');
        setGalleryImages(stored);
      } catch(e) {}
    }
  }, [showGallery]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);
    
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setUploadedUrls(prev => [...prev, event.target!.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
    
    setAttachments(prev => [...prev, ...files]);
  };

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

    await append({ role: "user", content: content as any });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Find latest uploaded image for generation
  const latestImageMessage = [...messages].reverse().find(m => m.role === 'user' && Array.isArray(m.content) && m.content.some((c:any) => c.type === 'image_url'));
  const base64Image = latestImageMessage ? (latestImageMessage.content as unknown as any[]).find((c:any) => c.type === 'image_url').image_url.url : null;

  return (
    <div className="flex relative h-[calc(100vh-5rem)] max-w-6xl mx-auto rounded-2xl overflow-hidden border bg-white shadow-lg">
      
      {/* Main Chat Area */}
      <div className="flex flex-col flex-1 relative min-w-0">
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
          <div className="mr-auto flex items-center gap-4">
            <button 
              onClick={() => setShowGallery(!showGallery)}
              className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm font-medium transition-colors"
            >
              <ImageIcon className="w-4 h-4" />
              <span>الصور المولدة</span>
            </button>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs text-slate-400">Gemini Flash</span>
            </div>
          </div>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="bg-red-50 text-red-600 px-4 py-2 text-xs text-center border-b border-red-100 font-medium">
            خطأ: {error.message}
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50 relative">
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

          {messages.map((m) => {
            let displayContent = "";
            let generateData = null;

            if (typeof m.content === "string") {
              const match = m.content.match(/\`\`\`json\s*(\{[\s\S]*?"ACTION"\s*:\s*"GENERATE"[\s\S]*?\})\s*\`\`\`/);
              if (match) {
                displayContent = m.content.replace(match[0], '').trim();
                try {
                  generateData = JSON.parse(match[1]);
                } catch(e) {}
              } else if (m.content.includes('\`\`\`json') && m.content.includes('"ACTION"')) {
                const parts = m.content.split('\`\`\`json');
                displayContent = parts[0].trim();
              } else {
                displayContent = m.content;
              }
            }

            if (!displayContent && !generateData && m.role === 'assistant') return null;

            return (
              <div key={m.id} className={`flex ${m.role === "user" ? "justify-start" : "justify-end"}`}>
                <div className={`max-w-[82%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  m.role === "user"
                    ? "bg-slate-900 text-white rounded-tl-sm"
                    : "bg-white border shadow-sm text-slate-800 rounded-tr-sm"
                }`}>
                  {displayContent && (
                    <p className="whitespace-pre-wrap">{displayContent}</p>
                  )}
                  {Array.isArray(m.content) && m.content.map((part: any, i: number) => {
                    if (part.type === "text") return <p key={i} className="whitespace-pre-wrap">{part.text}</p>;
                    if (part.type === "image_url") return (
                      <img key={i} src={part.image_url.url} alt="attachment" className="mt-2 rounded-lg max-h-48 object-cover" />
                    );
                    return null;
                  })}

                  {generateData && (
                    <AsyncImageGenerator generateData={generateData} base64Image={base64Image} />
                  )}
                </div>
              </div>
            );
          })}
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
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-2">
            <button
              disabled={isLoading}
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
        </div>
      </div>

      {/* Gallery Sidebar */}
      {showGallery && (
        <div className="w-80 bg-slate-50 border-r flex flex-col z-20">
          <div className="p-4 bg-slate-900 text-white flex flex-row-reverse justify-between items-center">
            <h3 className="font-bold text-sm">معرض الصور المولدة</h3>
            <button onClick={() => setShowGallery(false)} className="hover:bg-slate-800 p-1 rounded">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {galleryImages.length === 0 ? (
              <p className="text-xs text-slate-500 text-center mt-10">لا توجد صور مولدة بعد.</p>
            ) : (
              galleryImages.map((url, i) => (
                <div key={i} className="group relative rounded-xl overflow-hidden border shadow-sm">
                  <img src={url} className="w-full h-auto" alt="Generated" />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                     <a href={url} target="_blank" className="px-3 py-1.5 bg-white text-slate-900 text-xs font-bold rounded-lg hover:bg-slate-200">
                        عرض بحجم كامل
                     </a>
                     <button onClick={() => {
                        setInput(prev => prev + " " + url + " ");
                        toast.success("تم إدراج رابط الصورة في المحادثة");
                     }} className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700">
                        إرسال للمحادثة
                     </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
