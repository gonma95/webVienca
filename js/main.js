/* =============================================
   CENTRO VIENCA — SCRIPTS
   ============================================= */

/* =============================================
   MENÚ
   ============================================= */
(function () {
  const burger = document.querySelector('.header__burger');
  const nav = document.getElementById('nav');
  if (!burger || !nav) return;

  burger.addEventListener('click', () => {
    const open = nav.classList.toggle('is-open');
    burger.setAttribute('aria-expanded', open);
  });

  // Flechas del menú móvil: despliegan el submenú (el texto sigue siendo un enlace)
  nav.querySelectorAll('.nav__toggle').forEach(btn => {
    btn.addEventListener('click', () => {
      const open = btn.parentElement.classList.toggle('is-open');
      btn.setAttribute('aria-expanded', open);
    });
  });

  // "Derecho Civil" no navega, como en el menú original
  nav.querySelectorAll('a.no-link').forEach(a => a.addEventListener('click', e => e.preventDefault()));
})();

/* =============================================
   CABECERA: sombra al desplazarse
   ============================================= */
(function () {
  const header = document.getElementById('header');
  if (!header) return;
  const update = () => header.classList.toggle('is-scrolled', window.scrollY > 10);
  window.addEventListener('scroll', update, { passive: true });
  update();
})();

/* =============================================
   MAPA (se carga solo al pulsar, sin conectar con Google antes)
   y rutas de autobús desplegables
   ============================================= */
document.querySelectorAll('[data-map-load]').forEach(btn => {
  btn.addEventListener('click', () => {
    const box = btn.closest('[data-map-src]');
    const f = document.createElement('iframe');
    f.src = box.dataset.mapSrc.replace(/&amp;/g, '&');
    f.title = 'Mapa de Centro VIENCA en Majadahonda';
    f.loading = 'lazy';
    f.referrerPolicy = 'no-referrer-when-downgrade';
    f.allowFullscreen = true;
    box.innerHTML = '';
    box.appendChild(f);
    box.classList.add('is-loaded');
  });
});
document.querySelectorAll('.ct-dir__toggle').forEach(btn => {
  const more = document.getElementById(btn.getAttribute('aria-controls'));
  btn.addEventListener('click', () => {
    more.hidden = !more.hidden;
    btn.setAttribute('aria-expanded', !more.hidden);
  });
});

/* =============================================
   COLUMNAS PARALELAS ALINEADAS
   Cuando las columnas de una fila repiten la misma estructura
   (título, subtítulo, imagen, texto, botón...), se colocan sobre una
   rejilla común (CSS subgrid) para que los elementos equivalentes
   queden a la misma altura aunque sus textos ocupen distinto número
   de líneas. Solo se aplica en escritorio (ver .is-aligned en el CSS).
   ============================================= */
(function () {
  const sig = el => el.tagName + '.' + ([...el.classList].find(c => !/^(vc_custom|anim)/.test(c)) || '');
  const containers = new Set([...document.querySelectorAll('.col')].map(c => c.parentElement));

  containers.forEach(box => {
    const cols = [...box.children];
    if (!cols.length || cols.some(c => !c.classList.contains('col'))) return;
    const spans = cols.map(c => { const m = c.className.match(/(?:^|\s)col-(\d+)(?=\s|$)/); return m ? +m[1] : 0; });
    if (spans.includes(0) || spans.reduce((a, b) => a + b, 0) !== 12) return;

    const inners = cols.map(c => c.querySelector(':scope > .col__in'));
    const full = inners.filter(i => i && i.children.length);
    if (full.length < 2) return;
    const ref = [...full[0].children].map(sig).join('|');
    if (full.some(i => [...i.children].map(sig).join('|') !== ref)) {
      // imagen junto a texto: el texto se centra verticalmente respecto a la imagen
      const isMedia = i => [...i.children].every(ch => ch.matches('.sp, .img, .gallery'));
      if (full.length === 2 && full.filter(isMedia).length === 1) box.classList.add('is-media-pair');
      return;
    }

    // los elementos en línea (botones) conservan la alineación del texto;
    // se mide antes de activar la rejilla, que los convierte en bloques
    full.forEach(i => {
      const ta = getComputedStyle(i).textAlign;
      [...i.children].forEach(ch => {
        if (getComputedStyle(ch).display.startsWith('inline')) {
          ch.style.justifySelf = ta === 'center' ? 'center' : (ta === 'right' || ta === 'end') ? 'end' : 'start';
        }
      });
    });
    box.classList.add('is-aligned');
    box.style.setProperty('--rows', full[0].children.length);
    cols.forEach((c, k) => { c.style.gridColumn = 'span ' + spans[k]; });
  });
})();

/* =============================================
   PARALLAX (equivalente al de WPBakery)
   La capa mide speed*100% del contenedor y se desplaza
   desde -(speed-1)*100% hasta 0 mientras el bloque cruza la pantalla.
   ============================================= */
(function () {
  const layers = [...document.querySelectorAll('.parallax')];
  if (!layers.length) return;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  layers.forEach(l => { l.style.height = (parseFloat(l.dataset.speed) * 100) + '%'; });

  function update() {
    const vh = window.innerHeight;
    layers.forEach(l => {
      const box = l.parentElement.getBoundingClientRect();
      if (box.bottom < 0 || box.top > vh) return;
      const speed = parseFloat(l.dataset.speed) || 1;
      const extra = (speed - 1) * box.height;
      // progreso 0 cuando el bloque asoma por abajo, 1 cuando sale por arriba
      const p = Math.min(1, Math.max(0, (vh - box.top) / (vh + box.height)));
      const y = reduce ? -extra / 2 : -extra * (1 - p);
      l.style.transform = `translate3d(0, ${y}px, 0)`;
      if (l.dataset.fade) l.style.opacity = reduce ? 1 : Math.min(1, 0.3 + (1 - Math.abs(p - 0.5) * 2) * 0.7);
    });
  }

  let ticking = false;
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => { update(); ticking = false; });
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  update();
})();

/* =============================================
   SLIDERS (galería de imágenes y slider de contenido)
   ============================================= */
(function () {
  document.querySelectorAll('.slider').forEach(slider => {
    const track = slider.querySelector('.slider__track');
    const slides = [...track.children];
    if (slides.length < 2) return;
    const dotsBox = slider.querySelector('.slider__dots');
    const interval = (parseFloat(slider.dataset.interval) || 3) * 1000;
    let current = 0;
    let timer = null;

    const dots = dotsBox ? slides.map((_, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.setAttribute('aria-label', 'Ir a la diapositiva ' + (i + 1));
      b.addEventListener('click', () => { go(i); restart(); });
      dotsBox.appendChild(b);
      return b;
    }) : [];

    function go(i) {
      current = (i + slides.length) % slides.length;
      track.style.transform = `translateX(-${current * 100}%)`;
      dots.forEach((d, k) => d.classList.toggle('is-active', k === current));
    }
    function restart() {
      clearInterval(timer);
      timer = setInterval(() => go(current + 1), interval);
    }

    const prev = slider.querySelector('.slider__prev');
    const next = slider.querySelector('.slider__next');
    if (prev) prev.addEventListener('click', () => { go(current - 1); restart(); });
    if (next) next.addEventListener('click', () => { go(current + 1); restart(); });

    // Pausa al pasar el ratón, como el original
    slider.addEventListener('mouseenter', () => clearInterval(timer));
    slider.addEventListener('mouseleave', restart);

    // Arrastre táctil
    let startX = null;
    slider.addEventListener('touchstart', e => { startX = e.touches[0].clientX; }, { passive: true });
    slider.addEventListener('touchend', e => {
      if (startX === null) return;
      const dx = e.changedTouches[0].clientX - startX;
      if (Math.abs(dx) > 40) { go(current + (dx < 0 ? 1 : -1)); restart(); }
      startX = null;
    });

    go(0);
    restart();
  });
})();

/* =============================================
   ANIMACIONES DE APARICIÓN
   ============================================= */
(function () {
  const els = document.querySelectorAll('.anim');
  if (!els.length) return;
  if (!('IntersectionObserver' in window)) {
    els.forEach(el => el.classList.add('is-visible'));
    return;
  }
  const io = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (en.isIntersecting) {
        en.target.classList.add('is-visible');
        io.unobserve(en.target);
      }
    });
  }, { rootMargin: '0px 0px -10% 0px' });
  els.forEach(el => io.observe(el));
})();

/* =============================================
   FORMULARIOS (Netlify Forms)
   Netlify detecta los formularios ("contacto", "acompanamiento-360") al
   desplegar. Se envían por fetch para mostrar el mensaje sin salir de la
   página, como el original.
   ============================================= */
document.querySelectorAll('.cf__form').forEach(form => {
  const box = form.closest('.cf');
  const out = form.querySelector('.cf__output');
  const btn = form.querySelector('.cf__submit');
  const ERROR = 'Ha ocurrido un error al intentar enviar tu mensaje. Por favor, inténtalo de nuevo más tarde.';

  function show(msg, error) {
    out.textContent = msg;
    out.classList.toggle('is-error', !!error);
  }

  form.addEventListener('submit', e => {
    e.preventDefault();
    form.querySelectorAll('.is-invalid').forEach(el => el.classList.remove('is-invalid'));

    const f = form.elements;
    const missing = [...form.querySelectorAll('[required]')].filter(el => {
      const v = el.value.trim();
      return !v || (el.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v));
    });
    if (missing.length) {
      missing.forEach(el => el.classList.add('is-invalid'));
      show('Uno o más campos tienen un error. Por favor, revísalos e inténtalo de nuevo.', true);
      return;
    }
    if (!f['privacidad'].checked) {
      show('Debes aceptar la política de privacidad antes de enviar tu mensaje.', true);
      return;
    }

    btn.disabled = true;
    box.classList.add('is-sending');
    show('');

    fetch(form.getAttribute('action'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(new FormData(form)).toString()
    }).then(res => {
      if (!res.ok) throw new Error(res.status);
      form.reset();
      show('Gracias por tu mensaje. Ha sido enviado.');
    }).catch(() => {
      show(ERROR, true);
    }).finally(() => {
      btn.disabled = false;
      box.classList.remove('is-sending');
    });
  });
});
