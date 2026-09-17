const fs = require('fs');
let code = fs.readFileSync('app/api/analyze-garment/route.ts', 'utf8');

const target = `      let lastError = "";

      for (const model of modelsToTry) {
        const url = \`https://generativelanguage.googleapis.com/v1beta/models/\${model}:generateContent?key=\${apiKey}\`;
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        data = await response.json();
        
        if (response.ok) {
          lastError = "";
          break; 
        } else {
          lastError = data.error?.message || \`HTTP \${response.status}\`;
          console.log("Gemini Error with " + model + ":", lastError);
        }
      }

      if (lastError) {
        return NextResponse.json({ error: lastError }, { status: 500 });
      }`;

const replacement = `      let allErrors = [];

      for (const model of modelsToTry) {
        const url = \`https://generativelanguage.googleapis.com/v1beta/models/\${model}:generateContent?key=\${apiKey}\`;
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        data = await response.json();
        
        if (response.ok) {
          allErrors = [];
          break; 
        } else {
          allErrors.push(model + ": " + (data.error?.message || \`HTTP \${response.status}\`));
          console.log("Gemini Error with " + model + ":", data.error?.message);
        }
      }

      if (allErrors.length > 0) {
        return NextResponse.json({ error: allErrors.join(" | ") }, { status: 500 });
      }`;

code = code.replace(target, replacement);
fs.writeFileSync('app/api/analyze-garment/route.ts', code);
console.log('Fixed Gemini loop errors');
