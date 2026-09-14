const fs = require('fs');
let code = fs.readFileSync('lib/ai/fashn.ts', 'utf8');

const oldPromptLogic = `let subjectPrompt = \`a \${options.modelType || 'person'}\${(options.modelType && options.modelType.includes('girl') || options.modelType === 'woman') ? ' with long beautiful hair' : ''}\`;
      if (options.modelType === 'two boys') {
        subjectPrompt = \`two boy models standing side by side, one toddler boy and one young boy (siblings), BOTH wearing the exact same identical\`;
      } else if (options.modelType === 'two girls') {
        subjectPrompt = \`two girl models with long beautiful hair standing side by side, one toddler girl and one young girl (siblings), BOTH wearing the exact same identical\`;
      }`;

const newPromptLogic = `let subjectPrompt = options.modelType || 'person';
      const isFemale = subjectPrompt.includes('girl') || subjectPrompt === 'woman';
      const isMale = subjectPrompt.includes('boy') || subjectPrompt === 'man';
      
      let genderModifiers = "";
      if (isFemale) {
        genderModifiers = "(STRICTLY FEMALE model, very feminine facial features, very long beautiful flowing hair:1.5)";
      } else if (isMale) {
        genderModifiers = "(STRICTLY MALE model, handsome masculine facial features, short stylish boys haircut:1.5)";
      }
      
      subjectPrompt = \`a \${subjectPrompt} \${genderModifiers}\`;
      
      if (options.modelType === 'two boys') {
        subjectPrompt = \`two boy models standing side by side, one toddler boy and one young boy (siblings), BOTH wearing the exact same identical\`;
      } else if (options.modelType === 'two girls') {
        subjectPrompt = \`two girl models with long beautiful hair standing side by side, one toddler girl and one young girl (siblings), BOTH wearing the exact same identical\`;
      }`;

code = code.replace(oldPromptLogic, newPromptLogic);
fs.writeFileSync('lib/ai/fashn.ts', code);
console.log('Fixed gender prompt logic');
