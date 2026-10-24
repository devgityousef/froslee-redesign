/* Froslee: billeder og tekster fra content.json (rettes på froslee.dk/admin).
   HTML'en på siderne er reserven: uden JavaScript, eller hvis content.json ikke kan hentes,
   vises den som den er. Der byttes kun ud, hvis indholdet faktisk er anderledes. */
(function(){
  'use strict';
  var IMG = /^img\/[A-Za-z0-9._-]+\.(jpe?g|png|webp)$/;
  function ok(o){ return !!o && typeof o.src === 'string' && IMG.test(o.src); }
  function str(v, max){ return typeof v === 'string' ? v.slice(0, max) : ''; }
  function el(tag, attrs, kids){
    var n = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function(k){ n.setAttribute(k, attrs[k]); });
    (kids || []).forEach(function(k){ n.appendChild(typeof k === 'string' ? document.createTextNode(k) : k); });
    return n;
  }
  function img(o, fallbackAlt, lazy, cls){
    var a = {};
    if (cls) a['class'] = cls;
    if (lazy) a.loading = 'lazy';
    a.src = o.src;
    a.alt = str(o.alt, 300) || fallbackAlt;
    return el('img', a);
  }
  function caption(titel, tekst){ return el('figcaption', {}, [el('b', {}, [str(titel, 160)]), str(tekst, 600)]); }
  // What a visitor sees: image sources, alt texts and captions, in order.
  function sig(root){
    var out = [];
    root.querySelectorAll('img, figcaption').forEach(function(n){
      out.push(n.tagName === 'IMG' ? n.getAttribute('src') + '|' + n.getAttribute('alt') : n.textContent.replace(/\s+/g, ' ').trim());
    });
    return out.join('\n');
  }
  function swap(target, kids){
    var tmp = document.createElement('div');
    kids.forEach(function(k){ tmp.appendChild(k); });
    if (sig(tmp) === sig(target)) return;
    target.replaceChildren.apply(target, Array.prototype.slice.call(tmp.childNodes));
  }
  function setImg(n, o, fallbackAlt){
    if (!n || !ok(o)) return;
    if (n.getAttribute('src') !== o.src) n.setAttribute('src', o.src);
    var a = str(o.alt, 300) || fallbackAlt;
    if (n.getAttribute('alt') !== a) n.setAttribute('alt', a);
  }

  function render(c){
    // Forside: billedet i "Manden bag saksen"
    if (c.forside) setImg(document.querySelector('#om .portrait img'), c.forside.foto, 'Tobias Froslee fra Froslee Haveservice');

    // Om os: portræt og arbejdsbillede
    if (c.omOs) {
      setImg(document.querySelector('.page-hero .portrait img'), c.omOs.portraet, 'Tobias Froslee');
      setImg(document.querySelector('.about .gallery img'), c.omOs.arbejde, 'Tobias Froslee i gang med at klippe en hæk');
    }

    // Vores arbejde: før og efter, de to hække og galleriet
    var work = document.querySelector('.work');
    if (work && Array.isArray(c.foerEfter)) {
      var figs = [];
      c.foerEfter.filter(function(p){ return p && ok(p.foer) && ok(p.efter); }).forEach(function(p, i){
        var titel = str(p.titel, 160);
        figs.push(el('figure', {}, [
          el('div', {'class': 'compare', style: '--pos:50%'}, [
            img(p.efter, 'Efter klipning' + (titel ? ': ' + titel : ''), i > 0, 'after'),
            img(p.foer, 'Før klipning' + (titel ? ': ' + titel : ''), i > 0, 'before'),
            el('span', {'class': 'tag l'}, ['Før']), el('span', {'class': 'tag r'}, ['Efter']),
            el('div', {'class': 'handle'}),
            el('input', {type: 'range', min: '0', max: '100', value: '50', 'aria-label': 'Træk for at sammenligne før og efter'})
          ]),
          caption(titel, p.tekst)
        ]));
      });
      var par = c.par;
      if (par && ok(par.venstre) && ok(par.hoejre)) {
        figs.push(el('figure', {id: 'to-haekke'}, [
          el('div', {'class': 'pair'}, [img(par.venstre, 'Færdigklippet hæk', true), img(par.hoejre, 'Færdigklippet hæk', true)]),
          caption(par.titel, par.tekst)
        ]));
      }
      swap(work, figs);
    }
    var gal = document.querySelector('#galleri + .gallery');
    if (gal && Array.isArray(c.galleri)) {
      var items = c.galleri.filter(ok).map(function(o){ return img(o, 'Færdigklippet hæk fra Froslee Haveservice', true); });
      swap(gal, items);
      // .gallery sets display:grid, which beats the hidden attribute, so hide with style.
      gal.style.display = items.length ? '' : 'none';
      document.getElementById('galleri').style.display = items.length ? '' : 'none';
    }
  }

  if (!window.fetch || !Element.prototype.replaceChildren) return;
  fetch('/content.json', {cache: 'no-store'})
    .then(function(r){ return r.ok ? r.json() : null; })
    .then(function(c){ if (c && typeof c === 'object') render(c); })
    .catch(function(){});
})();
