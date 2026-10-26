#!/usr/bin/env node
// Genera las cards del blog y el schema BlogPosting a partir de articles.json.
// Uso: node build-blog.js   (ejecutar desde la carpeta /blog, o con `node blog/build-blog.js` desde la raíz del repo)
const fs = require('fs');
const path = require('path');

const articlesPath = path.join(__dirname, 'articles.json');
const indexPath = path.join(__dirname, 'index.html');

const articles = JSON.parse(fs.readFileSync(articlesPath, 'utf8'));

function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function cardHtml(a, i) {
  if (a.status === 'soon') {
    const delay = (0.14 + i * 0.06).toFixed(2);
    return `    <div class="card ghost" data-cat="${esc(a.cat)}" style="animation-delay:${delay}s">
      <div class="cover"><span class="soon">Próximamente</span></div>
      <div class="card-body">
        <h3>${esc(a.title)}</h3>
        <p>${esc(a.excerpt)}</p>
      </div>
    </div>`;
  }
  const delay = (0.02 + i * 0.06).toFixed(2);
  const utm = `utm_source=blog&amp;utm_medium=index&amp;utm_campaign=blog-home&amp;utm_content=card-${esc(a.slug)}`;
  const num = String(i + 1).padStart(2, '0');
  return `    <a class="card" data-cat="${esc(a.cat)}" href="/blog/${esc(a.slug)}?${utm}" style="animation-delay:${delay}s">
      <div class="cover">
        <!-- Reemplazar por la foto curada: /blog/img/${esc(a.slug)}.jpg (recomendado 4:3, mínimo 800x600) -->
        <img class="cover-img" src="/blog/img/${esc(a.slug)}.jpg" alt="${esc(a.title)}" loading="lazy" decoding="async" onerror="this.style.display='none'">
        <div class="motif"><span class="num">${num}</span></div>
        <div class="glyph"><span></span><span></span><span></span><span></span></div>
        <span class="tag">${esc(a.tag || 'Guía')}</span>
      </div>
      <div class="card-body">
        <h3>${esc(a.title)}</h3>
        <p>${esc(a.excerpt)}</p>
        <div class="meta">
          <div class="avatar">${esc((a.author || 'Federico Alberti')[0])}</div>
          <div class="meta-text"><b>${esc(a.author || 'Federico Alberti')}</b> · ${esc(a.dateLabel)} · ${esc(a.readMin)} min</div>
        </div>
      </div>
    </a>`;
}

const cardsHtml = articles.map(cardHtml).join('\n\n');

const schemaItems = articles
  .filter(a => a.status !== 'soon')
  .map(a => `    {"@type":"BlogPosting","headline":${JSON.stringify(a.title)},"url":${JSON.stringify('https://www.saisonfr.com/blog/' + a.slug)},"datePublished":${JSON.stringify(a.dateISO)}}`)
  .join(',\n');

const schemaBlock = `<script type="application/ld+json">
{
  "@context":"https://schema.org",
  "@type":"Blog",
  "name":"Blog Saison",
  "description":"Guías, trámites y testimonios reales de saisonniers hispanohablantes en Francia.",
  "url":"https://www.saisonfr.com/blog",
  "publisher":{"@type":"Organization","name":"Saison","url":"https://www.saisonfr.com"},
  "inLanguage":"es",
  "blogPost":[
${schemaItems}
  ]
}
</script>`;

let html = fs.readFileSync(indexPath, 'utf8');

if (!html.includes('<!-- CARDS:START -->') || !html.includes('<!-- CARDS:END -->')) {
  console.error('ERROR: no encontré los marcadores <!-- CARDS:START --> / <!-- CARDS:END --> en index.html. Revisá el setup de abajo.');
  process.exit(1);
}
if (!html.includes('<!-- BLOG-SCHEMA:START -->') || !html.includes('<!-- BLOG-SCHEMA:END -->')) {
  console.error('ERROR: no encontré los marcadores <!-- BLOG-SCHEMA:START --> / <!-- BLOG-SCHEMA:END --> en index.html.');
  process.exit(1);
}

html = html.replace(
  /<!-- CARDS:START -->[\s\S]*?<!-- CARDS:END -->/,
  `<!-- CARDS:START -->\n${cardsHtml}\n    <!-- CARDS:END -->`
);

html = html.replace(
  /<!-- BLOG-SCHEMA:START -->[\s\S]*?<!-- BLOG-SCHEMA:END -->/,
  `<!-- BLOG-SCHEMA:START -->\n${schemaBlock}\n<!-- BLOG-SCHEMA:END -->`
);

fs.writeFileSync(indexPath, html);
console.log(`blog/index.html actualizado con ${articles.length} artículos (${articles.filter(a=>a.status!=='soon').length} publicados, ${articles.filter(a=>a.status==='soon').length} "próximamente").`);
