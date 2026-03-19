const fs = require('fs');
const content = fs.readFileSync('c:/coin/frontend/src/app/page.tsx', 'utf8');
const lines = content.split('\n');
let depth = 0;
lines.forEach((line, i) => {
    const opens = (line.match(/<div/g) || []).length;
    const closes = (line.match(/<\/div>/g) || []).length;
    if (opens > 0 || closes > 0) {
        depth += opens - closes;
        console.log(`${i + 1}: depth=${depth} | ${line.trim()}`);
    }
});
