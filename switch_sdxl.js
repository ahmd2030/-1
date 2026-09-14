const fs = require('fs');
let code = fs.readFileSync('app/api/generate/base64/route.ts', 'utf8');

const fluxCall = `const fluxOutput = await replicate.run(
      "black-forest-labs/flux-schnell",
      {
        input: {
          prompt: fluxPrompt,
          aspect_ratio: "3:4",
          output_format: "png",
          num_outputs: 1
        }
      }
    ) as any;`;

const sdxlCall = `const fluxOutput = await replicate.run(
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

code = code.replace(fluxCall, sdxlCall);

code = code.replace(/throw new Error\("FLUX output is null or undefined\."\);/, `throw new Error("SDXL output is null or undefined.");`);
code = code.replace(/throw new Error\("FLUX returned unknown format: " \+ JSON\.stringify\(fluxOutput\)\);/, `throw new Error("SDXL returned unknown format: " + JSON.stringify(fluxOutput));`);

fs.writeFileSync('app/api/generate/base64/route.ts', code);
console.log('Switched to SDXL');
