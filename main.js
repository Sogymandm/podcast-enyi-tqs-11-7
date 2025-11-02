/* main.js — sincronizado con el HTML y style.css
   - overlay sutil
   - side tabs accesible y responsive
   - reveals con IntersectionObserver (stagger)
   - respeta prefers-reduced-motion
*/

document.addEventListener('DOMContentLoaded', () => {
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Elementos
  const sideTabs = document.getElementById('sideTabs');
  const hero = document.getElementById('hero');
  const btnVideo = document.getElementById('btnVideo');
  const btnDesarrollo = document.getElementById('btnDesarrollo');

  const sections = {
    video: document.getElementById('videoSection'),
    dev: document.getElementById('developmentSection'),
    culture: document.getElementById('cultureSection')
  };

  // overlay
  const overlay = (function(){
    const el = document.createElement('div');
    el.className = 'transition-overlay';
    document.body.appendChild(el);
    return el;
  })();

  function flashOverlay(ms = 380){
    if (prefersReduced) return;
    overlay.classList.add('show');
    setTimeout(() => overlay.classList.remove('show'), ms);
  }

  function goTo(el){
    if (!el) return;
    flashOverlay(360);
    setTimeout(()=> el.scrollIntoView({ behavior: 'smooth', block: 'start' }), 120);
  }

  /* Side tabs click handlers */
  if (sideTabs){
    sideTabs.querySelectorAll('.tab').forEach(tab => {
      tab.addEventListener('click', () => {
        const id = tab.dataset.target;
        const target = document.getElementById(id);
        goTo(target);
      });
    });

    // keyboard nav
    sideTabs.addEventListener('keydown', (e) => {
      const keys = ['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'];
      if (!keys.includes(e.key)) return;
      e.preventDefault();
      const items = Array.from(sideTabs.querySelectorAll('.tab'));
      const idx = items.indexOf(document.activeElement);
      const next = (e.key === 'ArrowRight' || e.key === 'ArrowDown') ? (idx + 1) % items.length : (idx - 1 + items.length) % items.length;
      items[next].focus();
    });
  }

  /* show/hide sideTabs based on hero visibility */
  if (hero && sideTabs && 'IntersectionObserver' in window){
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(en => {
        sideTabs.classList.toggle('visible', !en.isIntersecting);
      });
    }, { threshold: 0.14 });
    obs.observe(hero);
  } else if (sideTabs){
    sideTabs.classList.add('visible');
  }

  /* active tab highlight by section id */
  if (sideTabs && 'IntersectionObserver' in window){
    const tabs = Array.from(sideTabs.querySelectorAll('.tab'));
    const map = {};
    tabs.forEach(t => { if (t.dataset.target) map[t.dataset.target] = t; });

    const ids = Object.values(sections).filter(Boolean);
    const sObs = new IntersectionObserver((entries) => {
      entries.forEach(en => {
        if (en.isIntersecting){
          tabs.forEach(t => t.classList.remove('active'));
          const t = map[en.target.id];
          if (t) t.classList.add('active');
        }
      });
    }, { threshold: 0.5 });
    ids.forEach(s => sObs.observe(s));
  }

  /* reveal observer for sections & cards */
  if ('IntersectionObserver' in window){
    const revealObs = new IntersectionObserver((entries, obs) => {
      entries.forEach(en => {
        if (!en.isIntersecting) return;
        const el = en.target;
        el.classList.add('visible');
        // stagger cards inside this container
        const cards = el.querySelectorAll ? el.querySelectorAll('.qa-card') : [];
        if (cards.length){
          cards.forEach((c,i) => setTimeout(() => c.classList.add('visible'), i * 80));
        }
        obs.unobserve(el);
      });
    }, { threshold: 0.12 });

    // observe main sections
    ['videoSection','developmentSection','cultureSection'].forEach(id => {
      const el = document.getElementById(id);
      if (el){ el.classList.add('reveal'); revealObs.observe(el); }
    });

    // also observe isolated cards (if any)
    document.querySelectorAll('.qa-card').forEach(c => revealObs.observe(c));
  } else {
    // fallback: show all
    document.querySelectorAll('.reveal, .qa-card').forEach(el => el.classList.add('visible'));
  }

  /* hero parallax gentle */
  if (!prefersReduced && hero){
    let last=0;
    window.addEventListener('scroll', () => {
      const sc = window.scrollY;
      if (Math.abs(sc - last) < 3) return;
      last = sc;
      const rect = hero.getBoundingClientRect();
      const titles = hero.querySelectorAll('.hero-title');
      if (rect.bottom > window.innerHeight * 0.25){
        const shift = Math.min(26, sc * 0.018);
        titles.forEach(t => t.style.transform = `translateY(${Math.round(-shift)}px)`);
      } else {
        titles.forEach(t => t.style.transform = '');
      }
    }, { passive: true });
  }

  /* hero buttons */
  btnVideo?.addEventListener('click', () => goTo(sections.video));
  btnDesarrollo?.addEventListener('click', () => goTo(sections.dev));

  /* resize safety */
  let rto;
  window.addEventListener('resize', () => { clearTimeout(rto); rto = setTimeout(()=> overlay.classList.remove('show'), 160); });

  /* initial micro flash */
  if (!prefersReduced) { setTimeout(()=>{ overlay.classList.add('show'); setTimeout(()=> overlay.classList.remove('show'), 300); }, 220); }
});
