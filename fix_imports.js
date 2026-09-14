const fs = require('fs');
let code = fs.readFileSync('app/(dashboard)/dashboard/products/new/page.tsx', 'utf8');

if (!code.includes('import { db, auth }')) {
  code = code.replace('import { toast } from "sonner";', 'import { toast } from "sonner";\nimport { db, auth } from "@/lib/firebase/config";\nimport { collection, addDoc, serverTimestamp } from "firebase/firestore";');
  fs.writeFileSync('app/(dashboard)/dashboard/products/new/page.tsx', code);
  console.log("Added missing imports!");
} else {
  console.log("Imports already exist");
}
