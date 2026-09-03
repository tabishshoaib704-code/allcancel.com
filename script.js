const PRODUCTS = [
  { id:'barberry',           name:'Barberry',            img:'images/products/barberry.jpg',           cat:'fruits', price:350, unit:'100g', desc:'Tart dried berries, rich in antioxidants.' },
  { id:'barley',              name:'Barley',               img:'images/products/barley.jpg',              cat:'fruits', price:180, unit:'500g', desc:'Whole grain, great for soups & detox water.' },
  { id:'basil-seeds',         name:'Basil Seeds',          img:'images/products/basil-seeds.jpg',         cat:'seeds',  price:260, unit:'200g', desc:'Tukhm balanga — cooling summer drink seeds.', badge:'Bestseller' },
  { id:'beetroot',            name:'Beetroot',             img:'images/products/beetroot.jpg',            cat:'roots',  price:150, unit:'500g', desc:'Fresh, earthy root — juices, salads & rasam.' },
  { id:'behman-safaid',       name:'Behman Safaid',        img:'images/products/behman-safaid.jpg',       cat:'roots',  price:480, unit:'100g', desc:'Classic Unani tonic root for strength.' },
  { id:'bahera-beleric',      name:'Bahera / Beleric',     img:'images/products/bahera-beleric.jpg',      cat:'fruits', price:320, unit:'250g', desc:'One of the three fruits of Triphala.' },
  { id:'bitter-apple',        name:'Bitter Apple',         img:'images/products/bitter-apple.jpg',        cat:'fruits', price:380, unit:'100g', desc:'Indrayan — traditional bitter remedy fruit.' },
  { id:'ashwagandha',         name:'Ashwagandha',          img:'images/products/ashwagandha.jpg',         cat:'roots',  price:650, unit:'200g', desc:'Whole dried root, adaptogen for stress relief.' },
  { id:'ashwagandha-powder',  name:'Ashwagandha Powder',   img:'images/products/ashwagandha-powder.jpg',  cat:'roots',  price:890, unit:'200g', desc:'Finely milled for daily stamina support.', badge:'Popular' },
  { id:'avocado-oil',         name:'Avocado Oil',          img:'images/products/avocado-oil.jpg',         cat:'oils',   price:1450, unit:'100ml', desc:'Cold-pressed, nourishing for skin & hair.' },
  { id:'babchi',               name:'Babchi',                img:'images/products/babchi.jpg',               cat:'seeds',  price:420, unit:'100g', desc:'Bakuchi seeds, used in traditional skin care.' },
  { id:'babool-gum',          name:'Babool Gum',           img:'images/products/babool-gum.jpg',          cat:'fruits', price:380, unit:'200g', desc:'Natural acacia gond, a winter wellness staple.' },
  { id:'bael-fruit',          name:'Bael Fruit',           img:'images/products/bael-fruit.jpg',          cat:'fruits', price:340, unit:'200g', desc:'Dried wood-apple slices for digestive sharbat.' },
  { id:'bahi-dana',           name:'Bahi Dana',            img:'images/products/bahi-dana.jpg',           cat:'seeds',  price:290, unit:'200g', desc:'Quince seeds, soothing when soaked overnight.' },
  { id:'balchar',              name:'Balchar',               img:'images/products/balchar.jpg',               cat:'roots',  price:460, unit:'100g', desc:'Aromatic dried root used in Unani formulations.' },
  { id:'acanthus-seeds',      name:'Acanthus Seeds',       img:'images/products/acanthus-seeds.jpg',      cat:'seeds',  price:240, unit:'200g', desc:'Ajwain-family seeds, warming and aromatic.' },
  { id:'ajwain-khurasani',    name:'Ajwain Khurasani',     img:'images/products/ajwain-khurasani.jpg',    cat:'seeds',  price:260, unit:'200g', desc:'Hyoscyamus seeds, a traditional Unani herb.' },
  { id:'akarkara',             name:'Akarkara',              img:'images/products/akarkara.jpg',              cat:'roots',  price:520, unit:'100g', desc:'Pellitory root, prized in oral wellness recipes.' },
  { id:'aloe-vera-gel',       name:'Aloe Vera Gel',        img:'images/products/aloe-vera-gel.jpg',       cat:'oils',   price:690, unit:'200g', desc:'Pure gel, soothing daily moisturizer.', badge:'New' },
  { id:'aloe-vera-oil',       name:'Aloe Vera Oil',        img:'images/products/aloe-vera-oil.jpg',       cat:'oils',   price:750, unit:'100ml', desc:'Lightweight oil for scalp & skin nourishment.' },
  { id:'amba-haldi',          name:'Amba Haldi',           img:'images/products/amba-haldi.jpg',          cat:'roots',  price:340, unit:'200g', desc:'Wild mango turmeric with a distinct aroma.' },
  { id:'amla-dry',            name:'Amla Dry',             img:'images/products/amla-dry.jpg',            cat:'fruits', price:300, unit:'250g', desc:'Sun-dried gooseberry, vitamin C rich.' },
  { id:'arjuna-bark',         name:'Arjuna Bark',          img:'images/products/arjuna-bark.jpg',         cat:'roots',  price:310, unit:'200g', desc:'Traditional bark for heart & wellness teas.' },
];

const STORAGE_KEY = 'jariBazaarCart';
let cart = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');

const productGrid = document.getElementById('productGrid');
const cartItemsEl = document.getElementById('cartItems');
const cartEmptyEl = document.getElementById('cartEmpty');
const cartSubtotalEl = document.getElementById('cartSubtotal');
const cartCountEl = document.getElementById('cartCount');
const cartDrawer = document.getElementById('cartDrawer');
const cartOverlay = document.getElementById('cartOverlay');
const toastEl = document.getElementById('toast');
const flyItemEl = document.getElementById('flyItem');

function formatPKR(n){ return 'PKR ' + n.toLocaleString('en-PK'); }

function renderProducts(filter = 'all'){
  productGrid.innerHTML = '';
  const list = filter === 'all' ? PRODUCTS : PRODUCTS.filter(p => p.cat === filter);
  list.forEach((p, i) => {
    const card = document.createElement('div');
    card.className = 'product-card';
    card.style.animationDelay = (i * 0.05) + 's';
    card.innerHTML = `
      <div class="product-media">
        ${p.badge ? `<span class="product-badge">${p.badge}</span>` : ''}
        <img class="product-photo" src="${p.img}" alt="${p.name}" loading="lazy">
      </div>
      <div class="product-body">
        <h3>${p.name}</h3>
        <p>${p.desc}</p>
        <div class="product-meta">
          <span class="price">${formatPKR(p.price)} <small>/ ${p.unit}</small></span>
          <button class="add-btn" data-id="${p.id}"><span class="plus">+</span> Add</button>
        </div>
      </div>
    `;
    productGrid.appendChild(card);
  });
}

function addToCart(id, sourceBtn){
  cart[id] = (cart[id] || 0) + 1;
  saveCart();
  renderCart();
  bumpCartIcon();
  if (sourceBtn) flyToCart(sourceBtn);
  const p = PRODUCTS.find(x => x.id === id);
  showToast(`${p.name} added to cart`);
  flashButton(sourceBtn);
}

function flashButton(btn){
  if (!btn) return;
  btn.classList.add('added');
  setTimeout(() => btn.classList.remove('added'), 500);
}

function changeQty(id, delta){
  if (!cart[id]) return;
  cart[id] += delta;
  if (cart[id] <= 0) delete cart[id];
  saveCart();
  renderCart();
}

function removeItem(id, rowEl){
  if (rowEl){
    rowEl.classList.add('removing');
    setTimeout(() => { delete cart[id]; saveCart(); renderCart(); }, 280);
  } else {
    delete cart[id]; saveCart(); renderCart();
  }
}

function saveCart(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(cart)); }

function cartCount(){ return Object.values(cart).reduce((a,b) => a+b, 0); }
function cartTotal(){
  return Object.entries(cart).reduce((sum, [id, qty]) => {
    const p = PRODUCTS.find(x => x.id === id);
    return sum + (p ? p.price * qty : 0);
  }, 0);
}

function renderCart(){
  const ids = Object.keys(cart);
  cartCountEl.textContent = cartCount();
  cartSubtotalEl.textContent = formatPKR(cartTotal());

  if (ids.length === 0){
    cartItemsEl.innerHTML = '';
    cartItemsEl.appendChild(cartEmptyEl);
    return;
  }

  cartItemsEl.innerHTML = '';
  ids.forEach(id => {
    const p = PRODUCTS.find(x => x.id === id);
    if (!p) return;
    const qty = cart[id];
    const row = document.createElement('div');
    row.className = 'cart-item';
    row.innerHTML = `
      <img class="cart-item-photo" src="${p.img}" alt="${p.name}">
      <div class="cart-item-info">
        <h4>${p.name}</h4>
        <span class="unit-price">${formatPKR(p.price)} / ${p.unit}</span>
        <div class="qty-control">
          <button class="qty-minus" aria-label="Decrease">−</button>
          <span>${qty}</span>
          <button class="qty-plus" aria-label="Increase">+</button>
        </div>
      </div>
      <button class="cart-item-remove" aria-label="Remove">🗑</button>
    `;
    row.querySelector('.qty-minus').addEventListener('click', () => changeQty(id, -1));
    row.querySelector('.qty-plus').addEventListener('click', () => changeQty(id, 1));
    row.querySelector('.cart-item-remove').addEventListener('click', () => removeItem(id, row));
    cartItemsEl.appendChild(row);
  });
}

function bumpCartIcon(){
  cartCountEl.classList.remove('bump');
  void cartCountEl.offsetWidth;
  cartCountEl.classList.add('bump');
}

function showToast(msg){
  toastEl.textContent = msg;
  toastEl.classList.add('show');
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => toastEl.classList.remove('show'), 2200);
}

function flyToCart(sourceBtn){
  const startRect = sourceBtn.getBoundingClientRect();
  const cartRect = document.getElementById('cartToggle').getBoundingClientRect();
  const photoSrc = sourceBtn.closest('.product-card')?.querySelector('.product-photo')?.src || '';

  flyItemEl.innerHTML = photoSrc ? `<img src="${photoSrc}" alt="">` : '';
  flyItemEl.style.left = (startRect.left + startRect.width/2 - 14) + 'px';
  flyItemEl.style.top = (startRect.top - 10) + 'px';

  const tx = (cartRect.left + cartRect.width/2) - (startRect.left + startRect.width/2);
  const ty = (cartRect.top + cartRect.height/2) - (startRect.top - 10);
  flyItemEl.style.setProperty('--tx', tx + 'px');
  flyItemEl.style.setProperty('--ty', ty + 'px');

  flyItemEl.classList.remove('flying');
  void flyItemEl.offsetWidth;
  flyItemEl.classList.add('flying');
}

function openCart(){ cartDrawer.classList.add('open'); cartOverlay.classList.add('open'); document.body.style.overflow='hidden'; }
function closeCart(){ cartDrawer.classList.remove('open'); cartOverlay.classList.remove('open'); document.body.style.overflow=''; }

function buildWhatsAppOrder(){
  const ids = Object.keys(cart);
  if (ids.length === 0) return null;
  let msg = 'Assalam-o-Alaikum! I want to order:%0A';
  ids.forEach(id => {
    const p = PRODUCTS.find(x => x.id === id);
    if (!p) return;
    msg += `- ${p.name} x${cart[id]} (${formatPKR(p.price * cart[id])})%0A`;
  });
  msg += `%0ATotal: ${formatPKR(cartTotal())}%0APlease confirm my order. Thank you!`;
  return `https://wa.me/923001234567?text=${msg}`;
}

document.addEventListener('click', e => {
  const addBtn = e.target.closest('.add-btn');
  if (addBtn) addToCart(addBtn.dataset.id, addBtn);
});

document.getElementById('cartToggle').addEventListener('click', openCart);
document.getElementById('cartClose').addEventListener('click', closeCart);
cartOverlay.addEventListener('click', closeCart);

document.getElementById('checkoutBtn').addEventListener('click', () => {
  const url = buildWhatsAppOrder();
  if (!url){ showToast('Your cart is empty'); return; }
  window.open(url, '_blank');
});

document.querySelectorAll('.cat-chip').forEach(chip => {
  chip.addEventListener('click', () => {
    document.querySelectorAll('.cat-chip').forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    renderProducts(chip.dataset.filter);
  });
});

const menuToggle = document.getElementById('menuToggle');
const nav = document.getElementById('nav');
menuToggle.addEventListener('click', () => nav.classList.toggle('open'));
nav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => nav.classList.remove('open')));

const scrollTopBtn = document.getElementById('scrollTop');
window.addEventListener('scroll', () => {
  scrollTopBtn.classList.toggle('show', window.scrollY > 500);
});
scrollTopBtn.addEventListener('click', () => window.scrollTo({ top:0, behavior:'smooth' }));

document.getElementById('year').textContent = new Date().getFullYear();

function initRevealOnScroll(){
  const targets = document.querySelectorAll('.reveal');
  if (!targets.length) return;
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting){
        entry.target.classList.add('in-view');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
  targets.forEach(el => observer.observe(el));
}

function initCountUp(){
  const counters = document.querySelectorAll('[data-count-to]');
  if (!counters.length) return;
  const animate = (el) => {
    const target = parseInt(el.dataset.countTo, 10);
    const suffix = el.dataset.suffix || '';
    const duration = 1400;
    const start = performance.now();
    const step = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.round(target * eased).toLocaleString('en-PK') + suffix;
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting){
        animate(entry.target);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.4 });
  counters.forEach(el => observer.observe(el));
}

renderProducts();
renderCart();
initRevealOnScroll();
initCountUp();
