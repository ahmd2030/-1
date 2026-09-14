const fs = require('fs');

// 1. Update UI (page.tsx)
let ui = fs.readFileSync('app/(dashboard)/dashboard/products/new/page.tsx', 'utf8');

const oldArray = `{[
                        { id: 'toddler girl', label: 'بنت صغيرة (2-5)' },
                        { id: 'toddler boy', label: 'ولد صغير (2-5)' },
                        { id: 'young girl', label: 'بنت (6-12)' },
                        { id: 'young boy', label: 'ولد (6-12)' },
                        { id: 'two girls', label: 'بنتان معاً 👯‍♀️' },
                        { id: 'two boys', label: 'ولدان معاً 👬' },
                        { id: 'woman', label: 'امرأة' },
                        { id: 'man', label: 'رجل' }
                      ]`;

const newArray = `{[
                        { id: 'baby girl', label: 'طفلة (9 أشهر)' },
                        { id: 'baby boy', label: 'طفل (9 أشهر)' },
                        { id: 'toddler girl', label: 'بنت صغيرة (3 سنوات)' },
                        { id: 'toddler boy', label: 'ولد صغير (3 سنوات)' },
                        { id: 'young girl', label: 'بنت (6-12 سنة)' },
                        { id: 'young boy', label: 'ولد (6-12 سنة)' },
                        { id: 'teen girl', label: 'شابة (16 سنة)' },
                        { id: 'teen boy', label: 'شاب (16 سنة)' },
                        { id: 'woman', label: 'امرأة' },
                        { id: 'man', label: 'رجل' }
                      ]`;

ui = ui.replace(/\{\[\s*\{\s*id:\s*'toddler girl'[^]*?\]/m, newArray);
fs.writeFileSync('app/(dashboard)/dashboard/products/new/page.tsx', ui);

console.log("Updated ages in UI");
