const fs = require('fs');
let code = fs.readFileSync('app/(dashboard)/dashboard/products/new/page.tsx', 'utf8');

const startStr = '// Dual Image Collage (Front + Back)';
const endStr = "imgBack.src = '/api/proxy-image?url=' + encodeURIComponent(backUrl);";

const beforeIdx = code.indexOf(startStr);
const afterIdx = code.indexOf(endStr);

if (beforeIdx > -1 && afterIdx > -1) {
  const newLogic = `// Dual Image Collage (Front + Back)
          const imgBack = new Image();
          imgBack.crossOrigin = "anonymous";
          imgBack.onerror = () => {
            // Fallback to single if back fails
            canvas.width = imgFront.width;
            canvas.height = imgFront.height;
            ctx.drawImage(imgFront, 0, 0);
            if (requiresText) drawText(ctx, canvas, imgFront.width, customSizes, customCode, customDesc);
            if (requiresText) drawLogoAndResolve(ctx, canvas, resolve, frontUrl);
            else resolve(canvas.toDataURL('image/jpeg', 0.95));
          };
          imgBack.onload = () => {
            // High-end Split Lookbook Layout (1080x1350)
            canvas.width = 1080;
            canvas.height = 1350;
            
            const splitX = canvas.width / 2;
            
            // Helper to draw cover crop
            const drawCover = (img, x, y, w, h) => {
              const imgRatio = img.width / img.height;
              const targetRatio = w / h;
              let sx = 0, sy = 0, sw = img.width, sh = img.height;
              if (imgRatio > targetRatio) {
                 sw = sh * targetRatio;
                 sx = (img.width - sw) / 2;
              } else {
                 sh = sw / targetRatio;
                 sy = (img.height - sh) / 2;
              }
              ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
            };

            // Draw Models
            drawCover(imgFront, 0, 0, splitX, canvas.height);
            drawCover(imgBack, splitX, 0, splitX, canvas.height);

            // Elegant white separator
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(splitX - 4, 0, 8, canvas.height);

            // Overlay Text
            if (requiresText) {
              const pillW = 720;
              const pillH = 160;
              const pillX = (canvas.width - pillW) / 2;
              const pillY = canvas.height - pillH - 60;
              
              // Shadow
              ctx.shadowColor = 'rgba(0, 0, 0, 0.15)';
              ctx.shadowBlur = 30;
              ctx.shadowOffsetY = 15;
              
              // Pill background
              ctx.fillStyle = "#ffffff";
              ctx.beginPath();
              ctx.roundRect(pillX, pillY, pillW, pillH, 50);
              ctx.fill();
              
              // Reset shadow
              ctx.shadowColor = 'transparent';
              ctx.shadowBlur = 0;
              ctx.shadowOffsetY = 0;
              
              // Left: Brand
              ctx.fillStyle = "#0f172a";
              ctx.font = "bold 40px Arial, sans-serif";
              ctx.textAlign = "left";
              ctx.textBaseline = "middle";
              ctx.fillText(brandName || "ماركتي", pillX + 60, pillY + pillH / 2);
              
              // Right: SKU & Sizes
              ctx.textAlign = "right";
              const sku = customCode || productCode;
              if (sku) {
                 ctx.font = "bold 32px Arial, sans-serif";
                 ctx.fillText(sku, pillX + pillW - 60, pillY + pillH / 2 - 20);
              }
              const sz = customSizes || sizes;
              if (sz) {
                 ctx.fillStyle = "#64748b";
                 ctx.font = "24px Arial, sans-serif";
                 ctx.fillText(sz, pillX + pillW - 60, pillY + pillH / 2 + 25);
              }
              
              // Handle logo separately if exists
              if (base64Logo) {
                const logoImg = new Image();
                logoImg.crossOrigin = "anonymous";
                logoImg.onload = () => {
                  const logoMaxW = 160;
                  const logoMaxH = 100;
                  const ratio = Math.min(logoMaxW / logoImg.width, logoMaxH / logoImg.height);
                  const w = logoImg.width * ratio;
                  const h = logoImg.height * ratio;
                  // Draw logo in the center of the pill
                  ctx.drawImage(logoImg, pillX + (pillW - w) / 2, pillY + (pillH - h) / 2, w, h);
                  resolve(canvas.toDataURL('image/jpeg', 0.95));
                };
                logoImg.onerror = () => resolve(canvas.toDataURL('image/jpeg', 0.95));
                logoImg.src = base64Logo;
              } else {
                resolve(canvas.toDataURL('image/jpeg', 0.95));
              }
            } else {
              resolve(canvas.toDataURL('image/jpeg', 0.95));
            }
          };
          `;

  const before = code.substring(0, beforeIdx);
  const after = code.substring(afterIdx);
  fs.writeFileSync('app/(dashboard)/dashboard/products/new/page.tsx', before + newLogic + after);
  console.log('Successfully updated collage layout!');
} else {
  console.log('Failed to find boundaries');
}
