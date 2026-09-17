const fs = require('fs');
let content = fs.readFileSync('app/(dashboard)/dashboard/products/new/page.tsx', 'utf8');

// Insert pollStatus before handleGenerate
if (!content.includes('const pollStatus =')) {
  const insertIndex = content.indexOf('const handleGenerate =');
  const pollFunc = \
  const pollStatus = async (id: string): Promise<any> => {
    let attempts = 0;
    while (attempts < 60) {
      await new Promise(resolve => setTimeout(resolve, 3000));
      const res = await fetch(\\\/api/generate/status?id=\\\\\\);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to check status');
      }
      const data = await res.json();
      if (data.status === 'completed' && data.imageUrl) {
        return data;
      }
      if (data.status === 'failed' || data.error) {
        throw new Error(data.error || 'Generation failed');
      }
      attempts++;
    }
    throw new Error('Generation timed out');
  };
  \;
  content = content.substring(0, insertIndex) + pollFunc + '\n  ' + content.substring(insertIndex);
}

// Modify handleGenerate to use pollStatus
content = content.replace(/const data = await res\.json\(\);\s*if \(data\.error\) \{/g, \let data = await res.json();
        
        if (data.id && data.status === 'processing') {
          toast.success(" „ »œ¡ «· Ê·Ìœ° Ì—ÃÏ «·«‰ Ÿ«— (ﬁœ Ì” €—ﬁ œﬁÌﬁ…)...");
          data = await pollStatus(data.id);
        }

        if (data.error) {\);

// Modify processQueue to use pollStatus
content = content.replace(/const genData = await genRes\.json\(\);\s*if \(genData\.imageUrl\) \{/g, \let genData = await genRes.json();
          if (genData.id && genData.status === 'processing') {
            genData = await pollStatus(genData.id);
          }
          if (genData.imageUrl) {\);

fs.writeFileSync('app/(dashboard)/dashboard/products/new/page.tsx', content, 'utf8');
