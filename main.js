/* script.js - corregido y robusto
   - overlay sutil
   - tabs responsive + accessible
   - reveals con IntersectionObserver (stagger corto)
   - evita errores si faltan elementos
*/

document.addEventListener('DOMContentLoaded', () => {
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Grab elements (may be null if HTML changed)
  const sideTabs = document.getElementById('sideTabs');
  const hero = document.getElementById('hero');
  const btnVideo = document.getElementById('btnVideo');
  const btnDesarrollo = document.getElementById('btnDesarrollo');

  // Sections
  const sections = {
    video: document.getElementById('videoSection'),
    dev: document.getElementById('developmentSection'),
    culture: document.getElementById('cultureSection')
  };

  // Create overlay
  const overlay = (function create() {
    const el = document.createElement('div');
    el.className = 'transition-overlay';
    document.body.appendChild(el);
    return el;
  })();

  function showOverlay(short = true) {
    if (prefersReduced) return;
    overlay.classList.add('show');
    setTimeout(() => overlay.classList.remove('show'), short ? 420 : 700);
  }

  function scrollTo(el) {
    if (!el) return;
    showOverlay(true);
    setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'start' }), 120);
  }

  /* Side tabs click handlers */
  if (sideTabs) {
    sideTabs.querySelectorAll('.tab').forEach(tab => {
      tab.addEventListener('click', () => {
        const targetId = tab.dataset.target;
        const targetEl = document.getElementById(targetId);
        scrollTo(targetEl);
      });
    });

    // keyboard nav inside tabs
    sideTabs.addEventListener('keydown', (e) => {
      const keys = ['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'];
      if (!keys.includes(e.key)) return;
      e.preventDefault();
      const focusable = Array.from(sideTabs.querySelectorAll('.tab'));
      const idx = focusable.indexOf(document.activeElement);
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') focusable[(idx + 1) % focusable.length].focus();
      if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') focusable[(idx - 1 + focusable.length) % focusable.length].focus();
    });
  }

  /* Show/hide sideTabs based on hero visibility */
  if (hero && sideTabs) {
    const heroObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) sideTabs.classList.remove('visible');
        else sideTabs.classList.add('visible');
      });
    }, { threshold: 0.14 });
    heroObserver.observe(hero);
  } else if (sideTabs) {
    sideTabs.classList.add('visible'); // if no hero, show tabs
  }

  /* Active tab highlighting by matching data-target to section id */
  if (sideTabs) {
    const tabs = Array.from(sideTabs.querySelectorAll('.tab'));
    // build map targetId -> tab
    const tabMap = {};
    tabs.forEach(t => { const id = t.dataset.target; if (id) tabMap[id] = t; });

    const observedSections = Object.values(sections).filter(Boolean);
    if (observedSections.length) {
      const secObs = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            // remove active
            tabs.forEach(t => t.classList.remove('active'));
            const tab = tabMap[entry.target.id];
            if (tab) tab.classList.add('active');
          }
        });
      }, { threshold: 0.48 });
      observedSections.forEach(s => secObs.observe(s));
    }
  }

  /* Reveal observer for sections and cards */
  const revealObserver = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      el.classList.add('visible');
      // if section contains multiple qa-card, stagger reveal
      const cards = el.querySelectorAll?.('.qa-card');
      if (cards && cards.length) {
        cards.forEach((card, i) => setTimeout(() => card.classList.add('visible'), i * 90));
      }
      // unobserve to improve perf
      obs.unobserve(el);
    });
  }, { threshold: 0.12 });

  // Observe main sections
  ['videoSection','developmentSection','cultureSection'].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.classList.add('reveal');
      revealObserver.observe(el);
    }
  });

  // Also observe individual qa-card elements (in case they are outside section wrapper)
  document.querySelectorAll('.qa-card').forEach(card => revealObserver.observe(card));

  /* Hero parallax (gentle), respects reduced motion */
  if (!prefersReduced && hero) {
    let lastScroll = 0;
    window.addEventListener('scroll', () => {
      const sc = window.scrollY;
      if (Math.abs(sc - lastScroll) < 3) return;
      lastScroll = sc;
      const heroRect = hero.getBoundingClientRect();
      const titles = hero.querySelectorAll('.hero-title');
      if (heroRect.bottom > window.innerHeight * 0.25) {
        const shift = Math.min(24, sc * 0.018);
        titles.forEach(t => t.style.transform = `translateY(${Math.round(-shift)}px)`);
      } else {
        titles.forEach(t => t.style.transform = '');
      }
    }, { passive: true });
  }

  /* Hook hero action buttons (if present) */
  if (btnVideo) btnVideo.addEventListener('click', () => scrollTo(sections.video));
  if (btnDesarrollo) btnDesarrollo.addEventListener('click', () => scrollTo(sections.dev));

  /* Resize debounce to avoid stuck overlay */
  let rto = null;
  window.addEventListener('resize', () => {
    clearTimeout(rto);
    rto = setTimeout(() => overlay.classList.remove('show'), 180);
  });

  /* Initial subtle flash to show interactivity (very short) */
  if (!prefersReduced) {
    setTimeout(() => { overlay.classList.add('show'); setTimeout(() => overlay.classList.remove('show'), 300); }, 220);
  }
});
