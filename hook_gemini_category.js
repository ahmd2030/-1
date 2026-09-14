const fs = require('fs');

let page = fs.readFileSync('app/(dashboard)/dashboard/products/new/page.tsx', 'utf8');

const oldAnalyzeResponseSingle = `if (analyzeRes.ok && !data.error) {
          if (data.size) setSizes(data.size);
          if (data.sku) setProductCode(data.sku);
          if (data.marketing_desc) setMarketingDesc(data.marketing_desc);
          if (data.suggestion) setStylePrompt(data.suggestion);
        }`;

const newAnalyzeResponseSingle = `if (analyzeRes.ok && !data.error) {
          if (data.size) setSizes(data.size);
          if (data.sku) setProductCode(data.sku);
          if (data.marketing_desc) setMarketingDesc(data.marketing_desc);
          if (data.suggestion) setStylePrompt(data.suggestion);
          if (data.category) setModelType(data.category);
        }`;

page = page.replace(oldAnalyzeResponseSingle, newAnalyzeResponseSingle);

const oldAnalyzeResponseBulk = `if (analyzeRes.ok && !analyzeData.error) {
            if (analyzeData.size) genSizes = analyzeData.size;
            if (analyzeData.sku) genSku = analyzeData.sku;
            if (analyzeData.marketing_desc) genDesc = analyzeData.marketing_desc;
            if (analyzeData.suggestion) genPrompt = analyzeData.suggestion;
          }`;

const newAnalyzeResponseBulk = `if (analyzeRes.ok && !analyzeData.error) {
            if (analyzeData.size) genSizes = analyzeData.size;
            if (analyzeData.sku) genSku = analyzeData.sku;
            if (analyzeData.marketing_desc) genDesc = analyzeData.marketing_desc;
            if (analyzeData.suggestion) genPrompt = analyzeData.suggestion;
          }`;
// Bulk mode uses the globally selected modelType, so we don't overwrite modelType in bulk loop to avoid React state racing, or maybe we just leave it for now. The user mostly requested it for UI selection.

fs.writeFileSync('app/(dashboard)/dashboard/products/new/page.tsx', page);
console.log("Hooked up Gemini category to UI state");
