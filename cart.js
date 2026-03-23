// ─── SEPET VERİSİ ───
let cart = JSON.parse(localStorage.getItem('onda_cart') || '[]');

function saveCart() {
  localStorage.setItem('onda_cart', JSON.stringify(cart));
}

// ─── SEPETE EKLE ───
function addToCart(title, price, author) {
  const existing = cart.find(i => i.title === title);
  if (existing) {
    existing.qty++;
  } else {
    cart.push({ title, price: parseFloat(price), author: author || '', qty: 1, icon: '📖' });
  }
  saveCart();
  updateCartUI();
  openCart();
  animateCartBtn();
}

// ─── ADET GÜNCELLE ───
function changeQty(title, delta) {
  const item = cart.find(i => i.title === title);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) cart = cart.filter(i => i.title !== title);
  saveCart();
  updateCartUI();
}

// ─── SİL ───
function removeFromCart(title) {
  cart = cart.filter(i => i.title !== title);
  saveCart();
  updateCartUI();
}

// ─── TOPLAM ───
function getTotal() {
  return cart.reduce((s, i) => s + i.price * i.qty, 0);
}
function getTotalQty() {
  return cart.reduce((s, i) => s + i.qty, 0);
}

// ─── UI GÜNCELLE ───
function updateCartUI() {
  updateBadge();
  renderSidebar();
}

function updateBadge() {
  const badges = document.querySelectorAll('.cart-badge');
  const qty = getTotalQty();
  badges.forEach(b => {
    b.textContent = qty;
    b.classList.toggle('show', qty > 0);
  });
}

function renderSidebar() {
  const itemsEl = document.getElementById('cartItems');
  const totalEl = document.getElementById('cartTotal');
  if (!itemsEl) return;

  if (cart.length === 0) {
    itemsEl.innerHTML = `
      <div class="cart-empty">
        <div class="empty-icon">🛒</div>
        <p>Your cart is empty.</p>
        <p style="font-size:0.85rem;margin-top:0.5rem;">Browse our Books page to add titles!</p>
      </div>`;
  } else {
    itemsEl.innerHTML = cart.map(item => `
      <div class="cart-item">
        <div class="cart-item-img">${item.icon}</div>
        <div class="cart-item-info">
          <div class="cart-item-title">${item.title}</div>
          <div class="cart-item-price">₺${(item.price * item.qty).toFixed(0)}</div>
        </div>
        <div class="cart-item-qty">
          <button class="qty-btn" onclick="changeQty('${item.title}', -1)">−</button>
          <span class="qty-val">${item.qty}</span>
          <button class="qty-btn" onclick="changeQty('${item.title}', 1)">+</button>
        </div>
        <button class="btn-remove-item" onclick="removeFromCart('${item.title}')" title="Kaldır">🗑</button>
      </div>`).join('');
  }

  if (totalEl) totalEl.textContent = '₺' + getTotal().toFixed(0);
}

// ─── SIDEBAR AÇ/KAPAT ───
function openCart() {
  document.getElementById('cartSidebar')?.classList.add('open');
  document.getElementById('cartOverlay')?.classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closeCart() {
  document.getElementById('cartSidebar')?.classList.remove('open');
  document.getElementById('cartOverlay')?.classList.remove('open');
  document.body.style.overflow = '';
}

// ─── CART BUTONU ANİMASYON ───
function animateCartBtn() {
  const btn = document.getElementById('cartBtn');
  if (!btn) return;
  btn.classList.remove('cart-pop');
  void btn.offsetWidth;
  btn.classList.add('cart-pop');
}

// ─── ÖDEME MODAL ───
function openPaymentModal() {
  closeCart();
  const modal = document.getElementById('paymentModal');
  if (modal) modal.classList.add('open');
}
function closePaymentModal() {
  const modal = document.getElementById('paymentModal');
  if (modal) modal.classList.remove('open');
}

// Modal dışına tıklayınca kapat
document.addEventListener('click', function(e) {
  const modal = document.getElementById('paymentModal');
  if (modal && e.target === modal) closePaymentModal();
});

// ESC tuşuyla kapat
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') closePaymentModal();
});

function selectPayMethod(el) {
  document.querySelectorAll('.pay-method').forEach(b => b.classList.remove('active'));
  el.classList.add('active');
}

async function completePurchase() {
  const modal = document.getElementById('paymentModal');
  if (!modal) return;

  const payMethod = document.querySelector('.pay-method.active')?.textContent?.trim() || 'Card';
  const total = getTotal();

  // Firebase'e sipariş kaydet
  try {
    const { saveOrder } = await import('./firebase.js');
    await saveOrder(cart, total, payMethod);
  } catch(e) {
    console.warn('Firebase not connected:', e);
  }

  modal.querySelector('.payment-form').style.display = 'none';
  modal.querySelector('.success-state').style.display = 'block';
  cart = [];
  saveCart();
  updateCartUI();
  setTimeout(() => {
    closePaymentModal();
    modal.querySelector('.payment-form').style.display = 'block';
    modal.querySelector('.success-state').style.display = 'none';
  }, 3000);
}

// ─── SEARCH ───
function searchSite() {
  const searchTerm = document.getElementById("searchBox")?.value.trim().toLowerCase();
  const contentDiv = document.getElementById("content");
  if (!contentDiv || !searchTerm) return;
  contentDiv.querySelectorAll(".search-highlight").forEach(el => { el.outerHTML = el.textContent; });
  const paragraphs = contentDiv.getElementsByTagName("p");
  for (let para of paragraphs) {
    if (para.textContent.toLowerCase().includes(searchTerm)) {
      const regex = new RegExp(`(${searchTerm})`, "gi");
      para.innerHTML = para.innerHTML.replace(regex, `<span class="search-highlight">$1</span>`);
      para.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }
}

// ─── SAYFA YÜKLENİNCE ───
document.addEventListener('DOMContentLoaded', () => {
  updateCartUI();

  // Overlay tıklaması
  document.getElementById('cartOverlay')?.addEventListener('click', closeCart);

  // Enter ile arama
  document.getElementById('searchBox')?.addEventListener('keydown', e => {
    if (e.key === 'Enter') { e.preventDefault(); searchSite(); }
  });
});
