import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { ArrowLeft, Sparkles, Image as ImageIcon, Zap, Shirt, Palette, Wand2, ArrowRight } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans selection:bg-indigo-100 selection:text-indigo-900">
      {/* Decorative Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute -top-[20%] -right-[10%] w-[70%] h-[70%] rounded-full bg-gradient-to-b from-indigo-100/60 to-purple-100/60 blur-3xl opacity-50" />
        <div className="absolute top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-gradient-to-b from-blue-50/50 to-cyan-50/50 blur-3xl opacity-60" />
      </div>

      {/* Modern Navbar */}
      <header className="sticky top-0 z-50 px-6 py-4 flex items-center justify-between border-b border-slate-200/50 bg-white/80 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <div className="bg-indigo-600 p-2 rounded-xl shadow-lg shadow-indigo-200">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700">
            يافا ستوديو
          </h1>
        </div>
        <nav className="flex items-center gap-4">
          <Link href="/login" className="text-sm font-bold text-slate-600 hover:text-slate-900 transition-colors">
            تسجيل الدخول
          </Link>
          <Link href="/dashboard" className="px-5 py-2.5 rounded-full bg-slate-900 text-white text-sm font-bold shadow-md hover:bg-slate-800 transition-all hover:shadow-xl hover:-translate-y-0.5">
            لوحة التحكم
          </Link>
        </nav>
      </header>
      
      <main className="flex-1 flex flex-col items-center">
        {/* HERO SECTION */}
        <section className="w-full max-w-6xl mx-auto px-6 py-24 md:py-32 flex flex-col items-center text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-sm font-semibold mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <Sparkles className="w-4 h-4" />
            <span>الجيل الجديد من تصوير الأزياء بالذكاء الاصطناعي</span>
          </div>
          
          <h2 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8 max-w-4xl leading-[1.1] text-slate-900 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-100">
            حوّل صور ملابسك إلى <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-l from-indigo-600 via-purple-600 to-fuchsia-600">
              جلسات تصوير احترافية
            </span>
          </h2>
          
          <p className="text-xl md:text-2xl text-slate-500 mb-12 max-w-2xl leading-relaxed animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
            بدون مودل. بدون استوديو. بدون جلسة تصوير. 
            احصل على صور تجارية عالية الجودة لمنتجاتك في ثوانٍ معدودة وبنقرة زر واحدة.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 animate-in fade-in slide-in-from-bottom-10 duration-700 delay-300">
            <Link href="/dashboard/products/new" className="px-8 py-4 rounded-full bg-indigo-600 text-white text-lg font-bold shadow-xl shadow-indigo-200 hover:bg-indigo-700 transition-all hover:-translate-y-1 flex items-center justify-center gap-2">
              ابدأ التوليد الآن
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <Link href="#features" className="px-8 py-4 rounded-full bg-white text-slate-700 border border-slate-200 text-lg font-bold shadow-sm hover:bg-slate-50 transition-all flex items-center justify-center gap-2">
              كيف يعمل؟
            </Link>
          </div>
        </section>

        {/* VISUAL SHOWCASE PLACEHOLDER */}
        <section className="w-full max-w-5xl mx-auto px-6 mb-32 relative">
          <div className="absolute inset-0 bg-gradient-to-t from-slate-50 via-transparent to-transparent z-10 pointer-events-none" />
          <div className="bg-white p-4 rounded-3xl shadow-2xl border border-slate-200/60 overflow-hidden transform rotate-1 hover:rotate-0 transition-transform duration-500">
            <div className="bg-slate-100 rounded-2xl aspect-[16/9] flex items-center justify-center relative overflow-hidden">
               {/* Abstract representation of Before/After */}
               <div className="absolute inset-0 flex">
                  <div className="w-1/2 bg-slate-100 flex flex-col items-center justify-center border-r-4 border-white p-8">
                     <div className="w-32 h-40 bg-white rounded-xl shadow-sm border border-slate-200 flex items-center justify-center mb-4">
                        <Shirt className="w-12 h-12 text-slate-300" />
                     </div>
                     <span className="text-slate-400 font-bold">صورة الهاتف العادية</span>
                  </div>
                  <div className="w-1/2 bg-indigo-50 flex flex-col items-center justify-center p-8 relative overflow-hidden">
                     <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                     <div className="w-48 h-64 bg-white rounded-xl shadow-xl border-4 border-white flex items-center justify-center z-10 relative">
                        <ImageIcon className="w-16 h-16 text-indigo-300" />
                        <div className="absolute -bottom-4 -right-4 bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">نتيجة احترافية!</div>
                     </div>
                  </div>
               </div>
               {/* Center Badge */}
               <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-6 py-3 rounded-full shadow-xl font-bold text-indigo-600 flex items-center gap-2 border border-slate-100 z-20">
                  <Wand2 className="w-5 h-5" />
                  السحر يحدث هنا
               </div>
            </div>
          </div>
        </section>

        {/* FEATURES SECTION */}
        <section id="features" className="w-full bg-white border-y border-slate-200/50 py-24">
          <div className="max-w-6xl mx-auto px-6">
            <div className="text-center mb-16">
              <h3 className="text-3xl font-bold text-slate-900 mb-4">كل ما تحتاجه لإطلاق متجرك</h3>
              <p className="text-slate-500 max-w-2xl mx-auto">وفر آلاف الدولارات وأسابيع من الانتظار. الذكاء الاصطناعي يقوم بكل العمل نيابة عنك.</p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              {/* Feature 1 */}
              <div className="bg-slate-50 rounded-3xl p-8 border border-slate-100 hover:shadow-lg transition-shadow">
                <div className="w-14 h-14 rounded-2xl bg-indigo-100 flex items-center justify-center mb-6">
                  <Shirt className="w-7 h-7 text-indigo-600" />
                </div>
                <h4 className="text-xl font-bold text-slate-900 mb-3">تلبس العارضين آلياً</h4>
                <p className="text-slate-600 leading-relaxed">
                  ارفع صورة أي قطعة ملابس وسيقوم النظام باختيار المودل المناسب وتلبيسه القطعة باحترافية وبدون أي أخطاء في القصّة.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="bg-slate-50 rounded-3xl p-8 border border-slate-100 hover:shadow-lg transition-shadow">
                <div className="w-14 h-14 rounded-2xl bg-fuchsia-100 flex items-center justify-center mb-6">
                  <Palette className="w-7 h-7 text-fuchsia-600" />
                </div>
                <h4 className="text-xl font-bold text-slate-900 mb-3">تشكيلات الألوان</h4>
                <p className="text-slate-600 leading-relaxed">
                  ميزة حصرية لدمج صورتين (من الأمام والخلف) أو دمج لونين مختلفين لنفس القطعة في كتالوج واحد فخم (Diptych Layout).
                </p>
              </div>

              {/* Feature 3 */}
              <div className="bg-slate-50 rounded-3xl p-8 border border-slate-100 hover:shadow-lg transition-shadow">
                <div className="w-14 h-14 rounded-2xl bg-blue-100 flex items-center justify-center mb-6">
                  <Zap className="w-7 h-7 text-blue-600" />
                </div>
                <h4 className="text-xl font-bold text-slate-900 mb-3">تحليل وخلفيات ذكية</h4>
                <p className="text-slate-600 leading-relaxed">
                  يقرأ النظام نوع القطعة ويستنتج الديكور المناسب لها (مثلاً غرف أطفال، شوارع باريس) ويضيف هويتك التجارية تلقائياً.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA SECTION */}
        <section className="w-full py-24 px-6">
          <div className="max-w-5xl mx-auto bg-slate-900 rounded-[3rem] p-12 md:p-20 text-center relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-br from-indigo-500/20 via-purple-500/20 to-transparent pointer-events-none" />
            <h3 className="text-4xl md:text-5xl font-bold text-white mb-6 relative z-10">
              جاهز لتغيير شكل متجرك؟
            </h3>
            <p className="text-slate-300 text-lg mb-10 max-w-xl mx-auto relative z-10">
              انضم إلى مستقبل التجارة الإلكترونية. لا مزيد من الصور الباهتة أو التكاليف الباهظة.
            </p>
            <Link href="/dashboard/products/new" className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-white text-slate-900 text-lg font-bold hover:scale-105 transition-transform relative z-10">
              جرب الاستوديو مجاناً
              <ArrowLeft className="w-5 h-5" />
            </Link>
          </div>
        </section>
      </main>

      <footer className="w-full border-t border-slate-200 py-8 px-6 text-center">
        <p className="text-slate-500 text-sm font-medium">
          © {new Date().getFullYear()} يافا ستوديو - AI Fashion. جميع الحقوق محفوظة.
        </p>
      </footer>
    </div>
  );
}
