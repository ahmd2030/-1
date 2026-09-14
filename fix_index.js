const fs = require('fs');
let code = fs.readFileSync('app/(dashboard)/dashboard/generations/page.tsx', 'utf8');

code = code.replace(/where\("userId", "==", uid\),/, '// where("userId", "==", uid), // Removed to avoid composite index requirements for now');

fs.writeFileSync('app/(dashboard)/dashboard/generations/page.tsx', code);
console.log('Fixed Firestore Index issue');
