const fs = require('fs');

// 1. Fix Gemini
let geminiCode = fs.readFileSync('app/api/analyze-garment/route.ts', 'utf8');
geminiCode = geminiCode.replace(/const modelsToTry = \['gemini-flash-latest', 'gemini-3.5-flash', 'gemini-2.5-flash'\];/, "const modelsToTry = ['gemini-1.5-flash-latest', 'gemini-1.5-flash', 'gemini-1.5-pro'];");
fs.writeFileSync('app/api/analyze-garment/route.ts', geminiCode);

// 2. Add Replicate Retry Logic
let repCode = fs.readFileSync('app/api/generate/base64/route.ts', 'utf8');

const oldSDXL = `const fluxOutput = await replicate.run(
      "stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b",
      {
        input: {
          prompt: fluxPrompt,
          width: 768,
          height: 1024,
          refine: "expert_ensemble_refiner",
          apply_watermark: false,
          num_inference_steps: 25
        }
      }
    ) as any;`;

const newSDXL = `
    const callReplicateWithRetry = async (model: any, options: any, maxRetries = 10) => {
      for (let i = 0; i < maxRetries; i++) {
        try {
          return await replicate.run(model, options);
        } catch (e: any) {
          if (e.response && e.response.status === 429) {
            console.log("Rate limited! Retrying in 5 seconds...");
            await new Promise(r => setTimeout(r, 5000));
            continue;
          }
          if (e.status === 429 || (e.message && e.message.includes('429'))) {
             console.log("Rate limited! Retrying in 5 seconds...");
             await new Promise(r => setTimeout(r, 5000));
             continue;
          }
          throw e;
        }
      }
      throw new Error("Max retries reached for Replicate API");
    };

    const fluxOutput = await callReplicateWithRetry(
      "stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b",
      {
        input: {
          prompt: fluxPrompt,
          width: 768,
          height: 1024,
          refine: "expert_ensemble_refiner",
          apply_watermark: false,
          num_inference_steps: 25
        }
      }
    ) as any;`;

repCode = repCode.replace(oldSDXL, newSDXL);

const oldIDM = `const vtonOutput = await replicate.run(
      "yisol/idm-vton:c02d9fac2614730240a50eda629ff2d109bb10bc4ce87c4850fa15fbe8e121b6",
      {
        input: {
          crop: false,
          seed: 42,
          steps: 30,
          category: vtonCategory,
          garm_img: garmInput,
          human_img: humanImageUrl,
          garment_des: "a beautiful garment"
        }
      }
    ) as any;`;

const newIDM = `const vtonOutput = await callReplicateWithRetry(
      "yisol/idm-vton:c02d9fac2614730240a50eda629ff2d109bb10bc4ce87c4850fa15fbe8e121b6",
      {
        input: {
          crop: false,
          seed: 42,
          steps: 30,
          category: vtonCategory,
          garm_img: garmInput,
          human_img: humanImageUrl,
          garment_des: "a beautiful garment"
        }
      }
    ) as any;`;

repCode = repCode.replace(oldIDM, newIDM);
fs.writeFileSync('app/api/generate/base64/route.ts', repCode);

console.log('Fixed Gemini and Replicate Retries');
