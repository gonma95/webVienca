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
   MASONRY DEL BLOG
   Cada tarjeta ocupa tantas filas de 1px como mide, así la rejilla
   coloca la siguiente bajo la columna más corta.
   ============================================= */
(function () {
  const grid = document.querySelector('.blog-masonry');
  if (!grid) return;
  const items = [...grid.children];
  function layout() {
    grid.classList.add('is-masonry');
    items.forEach(it => {
      const h = it.getBoundingClientRect().height + parseFloat(getComputedStyle(it).marginBottom);
      it.style.gridRowEnd = 'span ' + Math.ceil(h);
    });
  }
  grid.querySelectorAll('img').forEach(img => { if (!img.complete) img.addEventListener('load', layout); });
  window.addEventListener('resize', layout);
  window.addEventListener('load', layout);
  if (document.fonts) document.fonts.ready.then(layout);
  layout();
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
   FORMULARIO DE CONTACTO (EmailJS)
   Rellena estas tres constantes con los datos de la cuenta de EmailJS.
   La plantilla recibe: name, email, phone, subject, service, message.
   ============================================= */
const EMAILJS_PUBLIC_KEY = 'TU_PUBLIC_KEY';
const EMAILJS_SERVICE_ID = 'TU_SERVICE_ID';
const EMAILJS_TEMPLATE_ID = 'TU_TEMPLATE_ID';

(function () {
  const form = document.getElementById('contactForm');
  if (!form) return;
  const box = form.closest('.cf');
  const out = form.querySelector('.cf__output');
  const btn = form.querySelector('.cf__submit');

  function show(msg, error) {
    out.textContent = msg;
    out.classList.toggle('is-error', !!error);
  }

  form.addEventListener('submit', e => {
    e.preventDefault();
    form.querySelectorAll('.is-invalid').forEach(el => el.classList.remove('is-invalid'));

    const f = form.elements;
    const missing = [];
    if (!f['your-name'].value.trim()) missing.push(f['your-name']);
    const email = f['your-email'].value.trim();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) missing.push(f['your-email']);
    if (missing.length) {
      missing.forEach(el => el.classList.add('is-invalid'));
      show('Uno o más campos tienen un error. Por favor, revísalos e inténtalo de nuevo.', true);
      return;
    }
    if (!f['acceptance-674'].checked) {
      show('Debes aceptar la política de privacidad antes de enviar tu mensaje.', true);
      return;
    }
    if (typeof emailjs === 'undefined') {
      show('Ha ocurrido un error al intentar enviar tu mensaje. Por favor, inténtalo de nuevo más tarde.', true);
      return;
    }

    btn.disabled = true;
    box.classList.add('is-sending');
    show('');

    emailjs.init({ publicKey: EMAILJS_PUBLIC_KEY });
    emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
      name: f['your-name'].value.trim(),
      email: email,
      phone: f['tel-72'].value.trim(),
      subject: f['your-subject'].value.trim(),
      service: form.querySelector('input[name="radio-262"]:checked').value,
      message: f['your-message'].value.trim()
    }).then(() => {
      form.reset();
      show('Gracias por tu mensaje. Ha sido enviado.');
    }).catch(() => {
      show('Ha ocurrido un error al intentar enviar tu mensaje. Por favor, inténtalo de nuevo más tarde.', true);
    }).finally(() => {
      btn.disabled = false;
      box.classList.remove('is-sending');
    });
  });
})();
