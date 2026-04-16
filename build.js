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

// Bepaalt het juiste pad naar privacy/terms voor een specifieke taal.
// Privacy/terms bestaan alleen in EN (root) en NL (/nl/). Voor alle andere
// talen val terug op de Engelse versie.
function privacyPath(lang) { return lang === 'nl' ? '/nl/privacy.html' : '/privacy.html'; }
function termsPath(lang)   { return lang === 'nl' ? '/nl/terms.html'   : '/terms.html';   }

function localizeHtml(html, lang, pageName) {
  // 1. <html lang="..."> zetten
  let out = html.replace(/<html lang="[a-z]{2}">/i, `<html lang="${lang}">`);

  // 2. Canonical + OG URL updaten.
  //    (hreflang-blok laten staan — crawlers willen alle varianten zien)
  const canonicalUrl = pageName === 'index.html'
    ? `${SITE_URL}/${lang}/`
    : `${SITE_URL}/${lang}/${pageName}`;
  out = out.replace(/<link rel="canonical" href="[^"]+">/, `<link rel="canonical" href="${canonicalUrl}">`);
  out = out.replace(/<meta property="og:url" content="[^"]+">/, `<meta property="og:url" content="${canonicalUrl}">`);

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

  // 4. Links naar privacy/terms aanpassen per taal (EN fallback voor talen
  //    zonder eigen vertaling). Affiliate links blijven altijd naar eigen taal.
  out = out.replace(/href="\/privacy\.html"/g, `href="${privacyPath(lang)}"`);
  out = out.replace(/href="\/terms\.html"/g, `href="${termsPath(lang)}"`);
  out = out.replace(/href="\/affiliate\.html"/g, `href="/${lang}/affiliate.html"`);
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

// Pagina's die via build.js in alle talen worden pre-gerendered.
// Privacy/terms NIET: die bestaan alleen in EN (root) en NL (/nl/, handgeschreven).
const BUILD_PAGES = ['index.html', 'affiliate.html'];

function main() {
  let generated = 0;
  for (const pageName of BUILD_PAGES) {
    const source = fs.readFileSync(path.join(ROOT, pageName), 'utf8');
    for (const lang of LANG_CODES) {
      if (lang === 'en') continue; // /{pageName} blijft de Engelse default
      const dir = path.join(ROOT, lang);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir);
      const out = localizeHtml(source, lang, pageName);
      fs.writeFileSync(path.join(dir, pageName), out, 'utf8');
      generated++;
    }
  }
  console.log(`Generated ${generated} locale pages (${BUILD_PAGES.join(' + ')} × ${LANG_CODES.length - 1} langs).`);
}

main();
