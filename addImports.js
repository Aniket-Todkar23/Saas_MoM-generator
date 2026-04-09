const fs = require('fs');
const file = 'src/app/past-meets/PastMeetsClient.tsx';
let c = fs.readFileSync(file, 'utf8');

c = c.replace(
  'import { useState, useMemo } from "react"',
  'import { useState, useMemo } from "react"\nimport { Copy, Check, Printer } from "lucide-react"'
);

fs.writeFileSync(file, c);
console.log('imports added');
