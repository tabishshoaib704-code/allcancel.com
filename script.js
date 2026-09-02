const PRODUCTS = [
  { id:'ajwain',      name:'Ajwain (Carom Seeds)',  emoji:'🌰', cat:'seeds',    price:280, unit:'200g', desc:'Aids digestion, classic desi kitchen staple.', badge:'Bestseller' },
  { id:'kalonji',     name:'Kalonji (Black Seed)',  emoji:'🖤', cat:'seeds',    price:450, unit:'250g', desc:'The "seed of blessing" — daily wellness boost.' },
  { id:'sonf',        name:'Sonf (Fennel Seeds)',   emoji:'🌿', cat:'seeds',    price:220, unit:'250g', desc:'Cooling, aromatic, great after-meal digestive.' },
  { id:'ashwagandha', name:'Ashwagandha Powder',    emoji:'🌾', cat:'roots',    price:890, unit:'200g', desc:'Adaptogen root for stress & stamina support.', badge:'Popular' },
  { id:'moringa',     name:'Moringa (Sohanjna) Leaf', emoji:'🍃', cat:'leaves', price:520, unit:'200g', desc:'Nutrient-dense superfood leaf powder.' },
  { id:'amla',        name:'Amla (Indian Gooseberry)', emoji:'🫒', cat:'roots', price:380, unit:'250g', desc:'Vitamin C rich powder for hair & immunity.' },
  { id:'methi',       name:'Methi (Fenugreek Seeds)', emoji:'🌱', cat:'seeds', price:190, unit:'250g', desc:'Traditional remedy for sugar balance & flavour.' },
  { id:'neem',        name:'Neem Leaf Powder',      emoji:'🍀', cat:'leaves',   price:340, unit:'150g', desc:'Purifying herb, great for skin routines.' },
  { id:'tulsi',       name:'Tulsi (Holy Basil) Tea', emoji:'🍵', cat:'leaves', price:410, unit:'100g', desc:'Calming herbal tea, brewed daily by millions.' },
  { id:'ginger',      name:'Sonth (Dry Ginger Powder)', emoji:'🫚', cat:'roots', price:310, unit:'200g', desc:'Warming spice for tea, cooking & wellness.' },
  { id:'turmeric',    name:'Haldi (Turmeric Root Powder)', emoji:'🟡', cat:'roots', price:260, unit:'250g', desc:'Anti-inflammatory golden spice, farm fresh.' },
  { id:'chamomile',   name:'Wellness Sleep Blend',  emoji:'💊', cat:'wellness', price:650, unit:'100g', desc:'Chamomile + tulsi + lavender calming blend.', badge:'New' },
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
      <div class="product-media" style="background:${mediaBg(i)}">
        ${p.badge ? `<span class="product-badge">${p.badge}</span>` : ''}
        <span class="product-emoji">${p.emoji}</span>
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

function mediaBg(i){
  const palette = [
    'linear-gradient(135deg,#e6f4ea,#c8e6cf)',
    'linear-gradient(135deg,#fdf3e2,#f3d9a7)',
    'linear-gradient(135deg,#e8f5e9,#b9ddc3)',
    'linear-gradient(135deg,#fbeee0,#eecb9b)',
  ];
  return palette[i % palette.length];
}

function addToCart(id, sourceBtn){
  cart[id] = (cart[id] || 0) + 1;
  saveCart();
  renderCart();
  bumpCartIcon();
  if (sourceBtn) flyToCart(sourceBtn);
  const p = PRODUCTS.find(x => x.id === id);
  showToast(`${p.emoji} ${p.name} added to cart`);
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
      <div class="cart-item-emoji">${p.emoji}</div>
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
  const emoji = sourceBtn.closest('.product-card')?.querySelector('.product-emoji')?.textContent || '🌿';

  flyItemEl.textContent = emoji;
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

renderProducts();
renderCart();
