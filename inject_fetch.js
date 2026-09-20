const fs = require('fs');
let code = fs.readFileSync('app/(dashboard)/dashboard/products/new/page.tsx', 'utf8');

const injection = `
  useEffect(() => {
    fetch('/api/credits')
      .then(res => res.json())
      .then(data => {
        if (data && typeof data.credits === 'number') {
          setFashnCredits(data.credits);
        } else if (data && data.error) {
          setFashnCredits(-1);
        }
      })
      .catch(err => setFashnCredits(-1));
  }, []);
`;

code = code.replace('  const canvasRef = useRef<HTMLCanvasElement>(null);', '  const canvasRef = useRef<HTMLCanvasElement>(null);\n' + injection);

fs.writeFileSync('app/(dashboard)/dashboard/products/new/page.tsx', code);
console.log('Injected successfully');
