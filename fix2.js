const fs = require('fs');
let code = fs.readFileSync('app/(dashboard)/dashboard/products/new/page.tsx', 'utf8');

if (!code.includes('generateMarketingDesc')) {
  // Wait, the UI was already injected, I just need to add the states.
}

code = code.replace(/const \[isAnalyzing, setIsAnalyzing\] = useState<boolean>\(false\);/, 
`const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [generateMarketingDesc, setGenerateMarketingDesc] = useState<boolean>(false);
  const [marketingDesc, setMarketingDesc] = useState<string>('');`);

if (!code.includes('FileArchive')) {
  code = code.replace(/import \{([^}]+)\} from "lucide-react";/, "import {$1, FileArchive} from 'lucide-react';");
}

fs.writeFileSync('app/(dashboard)/dashboard/products/new/page.tsx', code);
console.log('Fixed states and imports');
