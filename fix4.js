const fs = require('fs');
let code = fs.readFileSync('app/(dashboard)/dashboard/products/new/page.tsx', 'utf8');

// 1. Fix analyzeGarment to pass generateMarketingDesc
code = code.replace(/body: JSON\.stringify\(\{ garmentImage: optimizedImage \}\)/g, 'body: JSON.stringify({ garmentImage: optimizedImage, generateMarketingDesc })');

// 2. Fix analyzeGarment to save marketing_desc
code = code.replace(/if \(data\.sku && data\.sku\.trim\(\)\.length > 0\) setProductCode\(data\.sku\);/g, 'if (data.sku && data.sku.trim().length > 0) setProductCode(data.sku);\n        if (data.marketing_desc && data.marketing_desc.trim().length > 0) setMarketingDesc(data.marketing_desc);');

// 3. Fix applyCatalogueOverlay to draw marketingDesc
const oldDraw = `if (sizes) ctx.fillText(sizes, img.width - padding, padding + (img.width * 0.06));`;
const newDraw = `if (sizes) ctx.fillText(sizes, img.width - padding, padding + (img.width * 0.06));
            
            if (marketingDesc) {
              ctx.font = \`bold \${img.width * 0.04}px "Tajawal", "Cairo", sans-serif\`;
              ctx.fillStyle = '#1e293b';
              ctx.textAlign = 'center';
              ctx.direction = 'rtl';
              
              // Word wrap for Arabic
              const words = marketingDesc.split(' ');
              let line = '';
              let y = canvas.height - (img.width * 0.15); // Bottom margin
              
              ctx.shadowColor = 'rgba(255, 255, 255, 0.9)';
              ctx.shadowBlur = 15;
              ctx.shadowOffsetX = 0;
              ctx.shadowOffsetY = 0;

              for (let n = 0; n < words.length; n++) {
                const testLine = line + words[n] + ' ';
                const metrics = ctx.measureText(testLine);
                if (metrics.width > canvas.width - (padding * 2) && n > 0) {
                  ctx.fillText(line, canvas.width / 2, y);
                  line = words[n] + ' ';
                  y += (img.width * 0.05);
                } else {
                  line = testLine;
                }
              }
              ctx.fillText(line, canvas.width / 2, y);
              ctx.shadowColor = 'transparent';
            }`;
code = code.replace(oldDraw, newDraw);

fs.writeFileSync('app/(dashboard)/dashboard/products/new/page.tsx', code);
console.log('Fixed analyzeGarment and applyCatalogueOverlay');
