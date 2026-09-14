const fs = require('fs');
let code = fs.readFileSync('lib/ai/fashn.ts', 'utf8');

// 1. Add long hair for girls
code = code.replace(/a \$\{options\.modelType \|\| 'person'\}/, (match) => {
  return `a \${options.modelType || 'person'}\${(options.modelType && options.modelType.includes('girl') || options.modelType === 'woman') ? ' with long beautiful hair' : ''}`;
});

code = code.replace(/two girl models/, 'two girl models with long beautiful hair');

// 2. Enhance promptText for photorealism
const oldPrompt = `Photorealistic, ultra detailed 8k.\`;`;
const newPrompt = `Hyper-realistic, ultra detailed 8k, raw photo, DSLR, Fujifilm XT4, soft natural skin texture, masterpiece.\`;`;
code = code.replace(oldPrompt, newPrompt);

// 3. Add negative_prompt
const oldInputs = `inputs.prompt = promptText;`;
const newInputs = `inputs.prompt = promptText;
        inputs.negative_prompt = "plastic, doll, artificial, smooth, 3d render, cgi, ugly, distorted, deformed, poorly drawn face, poorly drawn eyes, bad anatomy";`;
code = code.replace(oldInputs, newInputs);

fs.writeFileSync('lib/ai/fashn.ts', code);
console.log('Fixed realism and hair');
