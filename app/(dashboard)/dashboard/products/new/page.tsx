"use client";

import { useChat } from "ai/react";
import { useState, useRef, useEffect } from "react";
import { Send, ImagePlus, Loader2, Sparkles } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";

export default function ChatDirectorPage() {
  const { messages, input, handleInputChange, handleSubmit, isLoading, append } = useChat();
  const [attachments, setAttachments] = useState<File[]>([]);
  const [attachmentUrls, setAttachmentUrls] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setAttachments(prev => [...prev, ...files]);
      
      const newUrls = await Promise.all(files.map(async (file) => {
        const arrayBuffer = await file.arrayBuffer();
        const base64String = Buffer.from(arrayBuffer).toString('base64');
        const formData = new URLSearchParams();
        formData.append('key', '6d207e02198a847aa98d0a2a901485a5');
        formData.append('action', 'upload');
        formData.append('source', base64String);
        formData.append('format', 'json');
        
        try {
          const res = await fetch('https://freeimage.host/api/1/upload', {
            method: 'POST',
            body: formData,
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          });
          const data = await res.json();
          return data.image.url;
        } catch (error) {
          console.error("Upload failed", error);
          return null;
        }
      }));
      
      setAttachmentUrls(prev => [...prev, ...(newUrls.filter(Boolean) as string[])]);
    }
  };

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input && attachmentUrls.length === 0) return;

    handleSubmit(e, {
      data: { images: attachmentUrls }
    });
    setAttachments([]);
    setAttachmentUrls([]);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] max-w-4xl mx-auto border rounded-2xl overflow-hidden bg-white shadow-sm">
      <div className="p-4 border-b bg-muted/30 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
          <Sparkles className="w-5 h-5" />
        </div>
        <div>
          <h2 className="font-bold text-lg">المخرج الذكي (AI Director)</h2>
          <p className="text-xs text-muted-foreground">مساعدك الشخصي لتوليد وإخراج صور منتجاتك</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-slate-50" style={{ direction: 'rtl' }}>
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground p-8">
            <Sparkles className="w-12 h-12 text-primary/20 mb-4" />
            <h3 className="text-xl font-bold mb-2 text-slate-700">أهلاً بك في استوديو الذكاء الاصطناعي</h3>
            <p className="max-w-md">
              قم برفع صور منتجاتك (حتى 10 صور)، وأخبرني كيف تريد إخراجها! 
              <br/>مثال: "أضف شعار بي بي روز بالوردي ومقاس 10-18 للصور المرفقة بستايل صيفي."
            </p>
          </div>
        )}

        {messages.map((m) => (
          <div key={m.id} className={\lex \\}>
            <div className={\max-w-[80%] rounded-2xl p-4 \\}>
              <p className="whitespace-pre-wrap">{m.content}</p>
              
              {m.toolInvocations?.map((tool) => {
                if (tool.toolName === 'generateFashionImages') {
                  return (
                    <div key={tool.toolCallId} className="mt-4 p-4 border rounded-xl bg-slate-50 text-slate-800">
                      <div className="flex items-center gap-2 mb-3">
                        <Loader2 className="w-4 h-4 animate-spin text-primary" />
                        <span className="font-medium text-sm">جاري التجهيز للتوليد...</span>
                      </div>
                      <div className="text-xs text-slate-500 bg-slate-100 p-2 rounded">
                        <strong>البراند:</strong> {tool.args.brandName || 'بدون'}<br/>
                        <strong>النص:</strong> {tool.args.promoText || 'بدون'}<br/>
                        <strong>العدد:</strong> {tool.args.imageUrls?.length || 0} صور
                      </div>
                    </div>
                  );
                }
                return null;
              })}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white border shadow-sm rounded-2xl rounded-bl-sm p-4 flex gap-2 items-center text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">المخرج يفكر...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 bg-white border-t" style={{ direction: 'rtl' }}>
        {attachments.length > 0 && (
          <div className="flex gap-2 mb-3 overflow-x-auto pb-2">
            {attachments.map((file, i) => (
              <div key={i} className="relative w-16 h-16 rounded-md overflow-hidden border flex-shrink-0">
                <img src={URL.createObjectURL(file)} alt="attachment" className="object-cover w-full h-full" />
                {attachmentUrls.length <= i && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <Loader2 className="w-4 h-4 text-white animate-spin" />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        <form onSubmit={onSubmit} className="flex gap-2 items-end">
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
            className="shrink-0 h-12 w-12 rounded-xl"
            onClick={() => fileInputRef.current?.click()}
          >
            <ImagePlus className="w-5 h-5 text-slate-600" />
          </Button>
          <div className="flex-1 relative">
            <textarea
              value={input}
              onChange={handleInputChange}
              placeholder="تحدث مع المخرج... (ارفع الصور واطلب ما تشاء)"
              className="w-full min-h-[48px] max-h-32 resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  // @ts-ignore
                  onSubmit(e as any);
                }
              }}
            />
          </div>
          <Button 
            type="submit" 
            disabled={isLoading || (input.length === 0 && attachmentUrls.length === 0)}
            className="shrink-0 h-12 w-12 rounded-xl"
          >
            <Send className="w-5 h-5" />
          </Button>
        </form>
      </div>
    </div>
  );
}
