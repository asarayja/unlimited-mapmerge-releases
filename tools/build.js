'use strict';
// Builds docs/i18n.js (all languages) and docs/index.html (the template with English filled in, so the
// page reads without JavaScript) from i18n-src/*.json. Edit those and tools/index.template.html, not
// the files in docs/. Usage: node tools/build.js
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const LANGS = [['en', 'English'], ['no', 'Norsk'], ['de', 'Deutsch'], ['dk', 'Dansk'], ['es', 'Español'], ['et', 'Eesti'], ['nl', 'Nederlands'], ['pl', 'Polski'], ['pt', 'Português'], ['tr', 'Türkçe'], ['cn', '简体中文'], ['ta', 'தமிழ்']];
const all = {};
for (const [c] of LANGS) all[c] = JSON.parse(fs.readFileSync(path.join(root, 'i18n-src', c + '.json'), 'utf8'));
fs.writeFileSync(path.join(root, 'docs', 'i18n.js'),
  '/* Unlimited MapMerge site translations. Made by tools/build.js from i18n-src/*.json: edit those, not this file. */\n' +
  'window.I18N_LANGS=' + JSON.stringify(LANGS) + ';\nwindow.I18N=' + JSON.stringify(all) + ';\n');
const en = all.en;
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const attr = (s) => s.replace(/<[^>]+>/g, '').replace(/&/g, '&amp;').replace(/"/g, '&quot;');
let html = fs.readFileSync(path.join(__dirname, 'index.template.html'), 'utf8');
const need = (k) => { if (en[k] == null) throw new Error('missing English key ' + k); return en[k]; };
html = html.replace(/<(\w+)([^>]*?\sdata-(i|h|t)="([^"]+)"[^>]*)><\/\1>/g, (m, tag, attrs, kind, key) =>
  `<${tag}${attrs}>${kind === 'h' ? need(key) : esc(need(key))}</${tag}>`);
html = html.replace(/ data-alt="([^"]+)"/g, (m, k) => `${m} alt="${attr(need(k))}"`);
html = html.replace(/ data-meta="([^"]+)"/g, (m, k) => `${m} content="${attr(need(k))}"`);
html = html.replace(/ data-ia="([^"]+)"/g, (m, k) => `${m} aria-label="${attr(need(k))}" title="${attr(need(k))}"`);
fs.writeFileSync(path.join(root, 'docs', 'index.html'), html);
console.log('built docs/i18n.js and docs/index.html');
