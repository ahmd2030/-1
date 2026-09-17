const fs = require('fs');
let code = fs.readFileSync('app/(dashboard)/dashboard/products/new/page.tsx', 'utf8');

const target = `toast.error("تعذر تحليل الصورة آلياً (لكن يمكنك المتابعة بتوليد الصورة)");`;
const replacement = `toast.error("خطأ: " + (e.message || "تعذر التحليل"));`;

code = code.replace(target, replacement);
fs.writeFileSync('app/(dashboard)/dashboard/products/new/page.tsx', code);
console.log('Updated error toast');
