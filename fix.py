import re

with open('app/(dashboard)/dashboard/products/new/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

new_func = '''  const applyCatalogueOverlay = (imageUrl: string, customSizes?: string, customCode?: string, customDesc?: string): Promise<string> => {
    return new Promise((resolve) => {
      if (!catalogueMode || !canvasRef.current) {
        resolve(imageUrl);
        return;
      }
      
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return resolve(imageUrl);
      
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        try {
          canvas.width = img.width;
          canvas.height = img.height;
          ctx.drawImage(img, 0, 0);
          
          const padding = img.width * 0.05;
          
          const finishDrawingText = () => {
            try {
              ctx.fillStyle = "#1e293b"; 
              ctx.font = \old \px Arial, sans-serif\;
              ctx.textAlign = "right";
              ctx.textBaseline = "top";
              ctx.shadowBlur = 0; 
              if (customCode || productCode) ctx.fillText(customCode || productCode, img.width - padding, padding);
              
              ctx.fillStyle = "#475569"; 
              ctx.font = \old \px Arial, sans-serif\;
              if (customSizes || sizes) {
                  const sizeArray = (customSizes || sizes).split(/[,/|¡\\n]/).map(s => s.trim()).filter(Boolean);
                  let sizeY = padding + (img.width * 0.06);
                  sizeArray.forEach(sizeLine => {
                    ctx.fillText(sizeLine, img.width - padding, sizeY);
                    sizeY += (img.width * 0.045);
                  });
              }
                
              if (customDesc || marketingDesc) {
                  ctx.font = \old \px "Tajawal", "Cairo", sans-serif\;
                  ctx.fillStyle = '#1e293b';
                  ctx.textAlign = 'center';
                  ctx.direction = 'rtl';
                  
                  const words = (customDesc || marketingDesc).split(' ');
                  let line = '';
                  let y = canvas.height - (img.width * 0.15);
                  
                  ctx.shadowColor = 'rgba(255, 255, 255, 0.9)';
                  ctx.shadowBlur = 15;
                  
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
                  ctx.shadowBlur = 0;
              }
              
              resolve(canvas.toDataURL('image/jpeg', 0.95));
            } catch(e) {
              resolve(imageUrl);
            }
          };
          
          if (base64Logo) {
            const logoImg = new Image();
            logoImg.onload = () => {
              try {
                const logoWidth = img.width * 0.20; 
                const aspect = logoImg.height / logoImg.width;
                const logoHeight = logoWidth * aspect;
                
                ctx.shadowColor = "rgba(255,255,255,0.7)";
                ctx.shadowBlur = 15;
                ctx.drawImage(logoImg, padding, padding, logoWidth, logoHeight);
                ctx.shadowBlur = 0;
                finishDrawingText();
              } catch(e) { finishDrawingText(); }
            };
            logoImg.onerror = () => finishDrawingText();
            logoImg.src = base64Logo;
          } else {
            try {
              ctx.fillStyle = "#ff6b81"; 
              ctx.font = \italic bold \px Georgia, serif\;
              ctx.textAlign = "left";
              ctx.textBaseline = "top";
              ctx.shadowColor = "rgba(255,255,255,0.8)";
              ctx.shadowBlur = 10;
              if (brandName) ctx.fillText(brandName, padding, padding);
              finishDrawingText();
            } catch(e) { finishDrawingText(); }
          }
        } catch(e) {
          resolve(imageUrl);
        }
      };
      
      img.onerror = () => resolve(imageUrl);
      img.src = imageUrl;
    });
  };'''

pattern = r'  const applyCatalogueOverlay =.*?img\.src = imageUrl;\n    \}\);\n  \};\n'

content = re.sub(pattern, new_func + '\n', content, flags=re.DOTALL)

with open('app/(dashboard)/dashboard/products/new/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
