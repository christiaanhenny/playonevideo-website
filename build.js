#!/usr/bin/env node
/**
 * Genereert per taal een /<lang>/index.html zodat crawlers en LLM's al
 * gelokaliseerde HTML zien (pre-renderen van client-side i18n).
 *
 * Usage: node website/build.js
 * Output: website/nl/index.html, website/de/index.html, ...
 */
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const { T, LANGS } = require('./i18n.js');

const SITE_URL = 'https://playonevideo.com';
const LANG_CODES = Object.keys(LANGS);

function localizeHtml(html, lang) {
  // 1. <html lang="..."> zetten
  let out = html.replace(/<html lang="[a-z]{2}">/i, `<html lang="${lang}">`);

  // 2. Canonical + hreflang zelfreferentie updaten
  //    (hreflang-blok laten staan — crawlers willen alle varianten zien)
  out = out.replace(
    /<link rel="canonical" href="[^"]+">/,
    `<link rel="canonical" href="${SITE_URL}/${lang}/">`
  );

  // 3. data-i18n vervangen in tekst-inhoud
  //    Match: <TAG ... data-i18n="KEY" ...>TEKST</TAG>
  //    We matchen alleen de tekst tussen de tags, niet geneste HTML.
  out = out.replace(
    /(<([a-zA-Z0-9]+)([^>]*?)\sdata-i18n="([^"]+)"([^>]*)>)([^<]*)(<\/\2>)/g,
    (_m, openTag, _tagName, _before, key, _after, _oldText, closeTag) => {
      const entry = T[key];
      if (!entry || entry[lang] === undefined) {
        return _m; // Onbekende key: laat default staan
      }
      const text = escapeHtml(entry[lang]);
      return `${openTag}${text}${closeTag}`;
    }
  );

  // 4. Pad-prefix voor styles, scripts, images en interne links.
  //    Omdat de pagina nu op /<lang>/index.html staat, moeten relatieve
  //    links naar ../ terug, of absoluut worden.
  out = out.replace(/href="\/(privacy\.html|terms\.html|affiliate\.html)"/g, `href="/$1"`);
  out = out.replace(/href="style\.css"/g, `href="/style.css"`);
  out = out.replace(/href="icon\.png"/g, `href="/icon.png"`);
  out = out.replace(/src="logo\.png"/g, `src="/logo.png"`);
  out = out.replace(/src="icon\.png"/g, `src="/icon.png"`);
  out = out.replace(/src="\/i18n\.js"/g, `src="/i18n.js"`); // al absolute — laat staan

  return out;
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function main() {
  const source = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  let generated = 0;
  for (const lang of LANG_CODES) {
    if (lang === 'en') continue; // /index.html is de Engelse default
    const dir = path.join(ROOT, lang);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir);
    const out = localizeHtml(source, lang);
    fs.writeFileSync(path.join(dir, 'index.html'), out, 'utf8');
    generated++;
  }
  console.log(`Generated ${generated} locale pages: ${LANG_CODES.filter(l => l !== 'en').join(', ')}`);
}

main();
