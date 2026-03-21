const fs = require("fs");

const pagePath = "c:/coin2/coin/frontend/src/app/privacy/page.tsx";
const b64Path = "c:/coin2/coin/tmp_privacy_b64.txt";

const page = fs.readFileSync(pagePath, "utf8");
const b64 = fs.readFileSync(b64Path, "utf8").trim();

// Replace the entire PRIVACY_TEXT_B64 assignment block until the BACK_B64 declaration.
const re = /const\s+PRIVACY_TEXT_B64\s*=\s*[\s\S]*?const\s+BACK_B64\s*=/m;
const replacement =
  'const PRIVACY_TEXT_B64 =\n  "' +
  b64 +
  '";\n\nconst BACK_B64 =';

if (!re.test(page)) {
  throw new Error("Pattern not found for PRIVACY_TEXT_B64 replacement");
}

const next = page.replace(re, replacement);
fs.writeFileSync(pagePath, next, "utf8");

console.log("Updated PRIVACY_TEXT_B64. b64 length:", b64.length);

