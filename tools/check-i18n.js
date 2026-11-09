'use strict';
// Every language must have exactly the keys English has, none empty, the same markup tags and the
// same code/placeholders in it, and every data-i/data-h/data-t/data-alt/data-meta/data-ia key used in
// the template must exist. Usage: node tools/check-i18n.js   (exit code 1 on any problem)
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const LANGS = ['en', 'no', 'de', 'dk', 'es', 'et', 'nl', 'pl', 'pt', 'tr', 'cn', 'ta'];
let bad = 0;
const fail = (m) => { bad++; console.log('FAIL ' + m); };
const data = {};
for (const c of LANGS) {
  const f = path.join(root, 'i18n-src', c + '.json');
  if (!fs.existsSync(f)) { fail(c + ': file missing'); continue; }
  try { data[c] = JSON.parse(fs.readFileSync(f, 'utf8')); } catch (e) { fail(c + ': ' + e.message); }
}
const en = data.en || {};
const tags = (s) => (s.match(/<\/?[a-z][^>]*>/gi) || []).map(t => t.replace(/\s+.*?(?=>)/, '').toLowerCase()).sort().join(',');
const codes = (s) => (s.match(/<code>[\s\S]*?<\/code>/g) || []).map(x => x.replace(/<\/?code>/g, '')).sort().join('|');
for (const c of LANGS) {
  const d = data[c]; if (!d) continue;
  for (const k of Object.keys(en)) {
    if (d[k] == null) { fail(`${c}: missing ${k}`); continue; }
    if (typeof d[k] !== 'string' || !d[k].trim()) fail(`${c}: empty ${k}`);
    else if (c !== 'en') {
      if (tags(d[k]) !== tags(en[k])) fail(`${c}: ${k} has different HTML tags than English`);
      if (codes(d[k]) !== codes(en[k])) fail(`${c}: ${k} changes text inside <code>`);
    }
  }
  for (const k of Object.keys(d)) if (en[k] == null) fail(`${c}: extra key ${k}`);
}
const tpl = fs.readFileSync(path.join(__dirname, 'index.template.html'), 'utf8');
for (const m of tpl.matchAll(/data-(?:i|h|t|alt|meta|ia)="([^"]+)"/g)) if (en[m[1]] == null) fail('template uses unknown key ' + m[1]);
for (const m of tpl.matchAll(/data-i="([^"]+)"/g)) if (/[<>]/.test(en[m[1]] || '')) fail(`${m[1]} is used as plain text but holds markup`);
console.log(bad ? `${bad} problem(s)` : `OK: ${LANGS.length} languages x ${Object.keys(en).length} keys, same tags and code everywhere`);
process.exit(bad ? 1 : 0);
