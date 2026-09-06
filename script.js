const nav = document.querySelector('.nav');
const progress = document.querySelector('.progress');

function updateGlobalUI(){
  nav?.classList.toggle('scrolled', window.scrollY > 40);
  const h = document.documentElement.scrollHeight - window.innerHeight;
  if(progress) progress.style.width = h > 0 ? `${(window.scrollY / h) * 100}%` : '0%';
}
window.addEventListener('scroll', updateGlobalUI, {passive:true});
updateGlobalUI();

const menu = document.querySelector('.menu');
menu?.addEventListener('click', () => nav?.classList.toggle('mobile'));
document.querySelectorAll('.nav nav a').forEach(a =>
  a.addEventListener('click', () => nav?.classList.remove('mobile'))
);

const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if(entry.isIntersecting) entry.target.classList.add('visible');
  });
},{threshold:.12});
document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

/* Catalogue filters */
const filters = [...document.querySelectorAll('.filter')];
const cards = [...document.querySelectorAll('.fish-card')];
filters.forEach(filter => {
  filter.addEventListener('click', () => {
    filters.forEach(f => f.classList.remove('active'));
    filter.classList.add('active');
    const value = filter.dataset.filter;
    cards.forEach(card => {
      const show = value === 'all' || card.dataset.category === value;
      card.classList.toggle('hidden', !show);
    });
  });
});

/* Product modal */
const modal = document.getElementById('fishModal');
if(modal){
  const modalImage = document.getElementById('modalImage');
  const modalName = document.getElementById('modalName');
  const modalScientific = document.getElementById('modalScientific');
  const modalDescription = document.getElementById('modalDescription');
  const modalGrades = document.getElementById('modalGrades');
  const gradesWrap = document.getElementById('gradesWrap');
  const modalCategory = document.getElementById('modalCategory');
  const modalIndex = document.getElementById('modalIndex');

  const labels = {
    cephalopod:'CEPHALOPOD',
    crustacean:'CRUSTACEAN',
    pelagic:'PELAGIC',
    demersal:'DEMERSAL'
  };

  function closeModal(){
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden','true');
    document.body.style.overflow='';
  }

  cards.forEach((card,i) => {
    card.addEventListener('click', () => {
      modalImage.src = card.dataset.image || card.querySelector('img')?.src || '';
      modalImage.alt = card.dataset.name || 'Seafood product';
      modalName.textContent = card.dataset.name || '';
      modalScientific.textContent = card.dataset.scientific || '';
      modalDescription.textContent = card.dataset.description || '';
      modalCategory.textContent = `MAURITANIAN ATLANTIC · ${labels[card.dataset.category] || 'SEAFOOD'}`;
      modalIndex.textContent = String(i + 1).padStart(2,'0');

      const gradeList = (card.dataset.grades || '').split('|').filter(Boolean);
      modalGrades.innerHTML = '';
      gradesWrap.style.display = gradeList.length ? 'block' : 'none';
      gradeList.forEach(item => {
        const chip = document.createElement('span');
        chip.textContent = item;
        modalGrades.appendChild(chip);
      });

      modal.classList.add('open');
      modal.setAttribute('aria-hidden','false');
      document.body.style.overflow='hidden';
    });
  });

  modal.querySelectorAll('[data-close-modal]').forEach(el =>
    el.addEventListener('click', closeModal)
  );
  document.addEventListener('keydown', e => {
    if(e.key === 'Escape') closeModal();
  });
}


/* =========================================================
   V5 — PHYSICS-LIKE OCEAN CAMERA
   ========================================================= */
(() => {
  const hero = document.querySelector('.ocean-hero');
  if(!hero) return;

  const surface = hero.querySelector('.ocean-surface');
  const underwater = hero.querySelector('.ocean-underwater');
  const vignette = hero.querySelector('.ocean-vignette');
  const haze = hero.querySelector('.surface-haze');
  const causticsA = hero.querySelector('.caustics-a');
  const causticsB = hero.querySelector('.caustics-b');
  const marine = hero.querySelector('.marine-life');
  const fish = hero.querySelector('.hero-creature');
  const school = hero.querySelector('.school');
  const chapters = [...hero.querySelectorAll('.ocean-chapter')];
  const particles = [...hero.querySelectorAll('.particle')];
  const bubbles = [...hero.querySelectorAll('.bubble')];

  const count = hero.querySelector('#oceanCount');
  const phase = hero.querySelector('#oceanPhase');
  const depth = hero.querySelector('#depthValue');
  const thumb = hero.querySelector('#scrollThumb');

  const clamp = (n,a=0,b=1)=>Math.max(a,Math.min(b,n));
  const smooth = n=>n*n*(3-2*n);
  const lerp = (a,b,t)=>a+(b-a)*t;

  let target = 0;
  let position = 0;
  let lastTime = performance.now();

  function measure(){
    const travel = Math.max(1,hero.offsetHeight-window.innerHeight);
    target = clamp(-hero.getBoundingClientRect().top/travel);
  }

  function animate(now){
    /* Frame-rate independent damping */
    const dt = Math.min(32,now-lastTime);
    lastTime = now;
    const damping = 1-Math.pow(.0008,dt/16.67);
    position += (target-position)*damping;

    const p = position;

    /* Camera phases:
       surface glide -> breaking the surface -> deep underwater.
       The image itself moves, rather than simply fading between photos. */
    const breakSurface = smooth(clamp((p-.10)/.25));
    const underwaterP = smooth(clamp((p-.32)/.36));
    const deep = smooth(clamp((p-.68)/.32));

    surface.style.opacity = String(1-breakSurface);
    surface.style.transform =
      `translate3d(${lerp(0,-1,p)}%,${lerp(0,-5,p)}%,0) scale(${1.01+p*.075})`;
    surface.style.filter =
      `brightness(${1-breakSurface*.25}) saturate(${1-breakSurface*.12})`;

    underwater.style.opacity = String(underwaterP);
    underwater.style.transform =
      `translate3d(0,${lerp(8,0,underwaterP)}%,0) scale(${1.035+underwaterP*.03})`;
    underwater.style.filter =
      `brightness(${.72+underwaterP*.22}) saturate(${.82+underwaterP*.24})`;

    haze.style.opacity = String(.06+breakSurface*.34);
    causticsA.style.opacity = String(underwaterP*.42);
    causticsB.style.opacity = String(deep*.28);
    marine.style.opacity = String(underwaterP);

    /* The fish behaves like a swimmer:
       slow entry, acceleration, middle glide, then gradual exit.
       Vertical movement is a sine curve, with tiny body pitch. */
    const swim = clamp((p-.37)/.63);
    const x = 112-166*swim;
    const y = 12+Math.sin(swim*Math.PI*1.35)*5.5-swim*7;
    const scale = .56+.48*Math.sin(Math.PI*swim);
    const pitch = Math.sin(swim*Math.PI*1.35)*2.4;
    const bob = Math.sin(p*7.4)*.55;

    const appear = smooth(clamp(swim/.14));
    const disappear = smooth(clamp((swim-.82)/.18));

    fish.style.transform =
      `translate3d(${x}vw,${y+bob}vh,0) rotate(${pitch}deg) scale(${scale})`;
    fish.style.opacity = String(appear*(1-disappear));

    /* Background school has slower parallax than the hero fish. */
    school.style.transform =
      `translate3d(${20-38*swim}vw,${4-8*swim}vh,0) scale(${.78+.16*swim})`;
    school.style.opacity = String(.04+underwaterP*.32);

    particles.forEach((dot,i)=>{
      const dx=Math.sin(p*3+i*1.4)*8;
      const dy=-underwaterP*(35+i*12);
      dot.style.opacity=String(underwaterP*(.22+(i%3)*.1));
      dot.style.transform=`translate3d(${dx}px,${dy}px,0)`;
    });

    bubbles.forEach((bubble,i)=>{
      const rise=underwaterP*(38+i*18);
      bubble.style.opacity=String(underwaterP*(.22+(i%2)*.15));
      bubble.style.transform=`translate3d(${Math.sin(p*5+i)*9}px,${-rise}px,0)`;
    });

    let chapter=0;
    if(p>=.25 && p<.50) chapter=1;
    else if(p>=.50 && p<.75) chapter=2;
    else if(p>=.75) chapter=3;

    chapters.forEach((item,i)=>{
      item.classList.toggle('is-active',i===chapter);
    });

    count.textContent=String(chapter+1).padStart(2,'0');
    phase.textContent=['SURFACE','DESCENT','UNDERWATER','EXPORT'][chapter];

    const depthValue =
      chapter===0 ? p*25 :
      chapter===1 ? 25+(p-.25)*180 :
      chapter===2 ? 70+(p-.50)*500 :
      320+(p-.75)*520;

    depth.textContent=String(Math.round(depthValue)).padStart(3,'0');
    thumb.style.width=`${p*100}%`;

    requestAnimationFrame(animate);
  }

  window.addEventListener('scroll',measure,{passive:true});
  window.addEventListener('resize',measure);
  measure();
  requestAnimationFrame(animate);
})();

const year=document.getElementById('year');
if(year) year.textContent=new Date().getFullYear();

/*const quoteForm=document.getElementById('quoteForm');
quoteForm?.addEventListener('submit',e=>{
  e.preventDefault();
  const data=new FormData(quoteForm);
  const subject=encodeURIComponent(`Seafood enquiry — ${data.get('company')||''}`);
  const body=encodeURIComponent(
`Company: ${data.get('company')||''}
Email: ${data.get('email')||''}
Product: ${data.get('product')||''}
Estimated volume: ${data.get('volume')||''}
Message: ${data.get('message')||''}`);
  window.location.href=`mailto:export@yourcompany.com?subject=${subject}&body=${body}`;
});*/

const quoteForm=document.getElementById('quoteForm');

quoteForm?.addEventListener('submit',e=>{
  e.preventDefault();

  const data=new FormData(quoteForm);

  const company=data.get('company')||'';
  const email=data.get('email')||'';
  const product=data.get('product')||'';
  const volume=data.get('volume')||'';
  const message=data.get('message')||'';

  const whatsappMessage=
`Hello, I would like to request a seafood quotation.

Company: ${company}
Email: ${email}
Product: ${product}
Estimated volume: ${volume}
Message: ${message}`;

  const phoneNumber='60172757217';

  const whatsappURL=
    `https://wa.me/${phoneNumber}?text=${encodeURIComponent(whatsappMessage)}`;

  window.open(whatsappURL,'_blank');
});
