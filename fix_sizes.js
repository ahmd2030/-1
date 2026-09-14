const fs = require('fs');
let code = fs.readFileSync('app/(dashboard)/dashboard/products/new/page.tsx', 'utf8');

const oldSizesDraw = `if (sizes) ctx.fillText(sizes, img.width - padding, padding + (img.width * 0.06));`;
const newSizesDraw = `if (sizes) {
              const sizeArray = sizes.split(/[,/|،]/).map(s => s.trim()).filter(Boolean);
              let sizeY = padding + (img.width * 0.06);
              sizeArray.forEach(sizeLine => {
                ctx.fillText(sizeLine, img.width - padding, sizeY);
                sizeY += (img.width * 0.045);
              });
            }`;

code = code.replace(oldSizesDraw, newSizesDraw);

fs.writeFileSync('app/(dashboard)/dashboard/products/new/page.tsx', code);
console.log('Fixed sizes drawing');
