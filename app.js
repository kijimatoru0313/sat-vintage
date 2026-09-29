/* ===== S.a.T VINTAGE ホームページ 動きの設定 ===== */

const PER_PAGE = 40;                 // 一度に表示する商品の数
let state = { cat:'all', stock:'all', q:'', sort:'new', page:1, favOnly:false };

/* ---------- お気に入り（この端末に保存されます） ---------- */
const FAV_KEY = 'sat_fav';
function favLoad(){ try{ return JSON.parse(localStorage.getItem(FAV_KEY)) || []; }catch(e){ return []; } }
function favSave(a){ try{ localStorage.setItem(FAV_KEY, JSON.stringify(a)); }catch(e){} }
let favs = favLoad();
const isFav = id => favs.includes(id);
function toggleFav(id){
  favs = isFav(id) ? favs.filter(x => x !== id) : [...favs, id];
  favSave(favs); paintFavCount();
}
function paintFavCount(){
  const el = document.getElementById('favCount');
  el.textContent = favs.length;
  el.dataset.zero = favs.length ? '0' : '1';
}

/* ---------- 便利な関数 ---------- */
const $  = s => document.querySelector(s);
const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const IG  = 'https://www.instagram.com/s.a.tvintage/';
const DM  = 'https://www.instagram.com/direct/t/s.a.tvintage';

/* ---------- 絞り込み ---------- */
function filtered(){
  let list = PRODUCTS.slice();
  if (state.favOnly) list = list.filter(p => isFav(p.id));
  if (state.cat !== 'all')  list = list.filter(p => p.cat === state.cat);
  if (state.stock === 'sale') list = list.filter(p => !p.sold);
  if (state.stock === 'sold') list = list.filter(p => p.sold);
  if (state.q){
    const w = state.q.toLowerCase().split(/\s+/).filter(Boolean);
    list = list.filter(p => {
      const hay = (p.name + ' ' + p.desc + ' ' + p.cat + ' ' + (p.tags||[]).join(' ')).toLowerCase();
      return w.every(x => hay.includes(x));
    });
  }
  if (state.sort === 'old')  list.reverse();
  if (state.sort === 'name') list.sort((a,b) => a.name.localeCompare(b.name,'ja'));
  // 販売中の商品をいつも先に表示する
  if (state.sort === 'new')  list.sort((a,b) => (a.sold === b.sold) ? 0 : (a.sold ? 1 : -1));
  return list;
}

/* ---------- 商品カードを作る ---------- */
function cardHTML(p){
  const badge = p.sold
    ? '<span class="card__badge">SOLD</span>'
    : '<span class="card__badge card__badge--sale">販売中</span>';
  const video = p.video
    ? '<svg class="card__video" viewBox="0 0 24 24"><polygon points="6,4 20,12 6,20" fill="currentColor" stroke="none"/></svg>' : '';
  return `<div class="card">
    <div class="card__img" onclick="openModal('${p.id}')">
      <img src="${esc(p.img)}" alt="${esc(p.name)}" loading="lazy">
      ${badge}${video}
      <button class="card__fav ${isFav(p.id)?'is-on':''}" data-fav="${p.id}"
        onclick="event.stopPropagation();cardFav(this,'${p.id}')" aria-label="お気に入り">${isFav(p.id)?'♥':'♡'}</button>
    </div>
    <div class="card__body" onclick="openModal('${p.id}')">
      <p class="card__name">${esc(p.name)}</p>
      <p class="card__cat">${esc(p.cat)}</p>
    </div>
  </div>`;
}
function cardFav(btn, id){
  toggleFav(id);
  btn.classList.toggle('is-on', isFav(id));
  btn.textContent = isFav(id) ? '♥' : '♡';
  if (state.favOnly) render();
}

/* ---------- 一覧を描く ---------- */
function render(){
  const list = filtered();
  const show = list.slice(0, state.page * PER_PAGE);

  $('#grid').innerHTML = show.map(cardHTML).join('');
  $('#count').textContent = list.length;
  $('#empty').hidden = list.length > 0;
  if (!list.length){
    $('#emptyMsg').innerHTML =
      state.stock === 'sale' ? '現在、販売中のアイテムはございません。<br>新しい商品は随時追加していきますので、お楽しみに。'
    : state.favOnly          ? 'お気に入りに追加したアイテムはまだありません。<br>商品の♡マークから追加できます。'
    :                          '該当する商品が見つかりませんでした。';
  }
  $('#moreWrap').hidden = show.length >= list.length;
  $('#moreBtn').textContent = `もっと見る（あと${list.length - show.length}件）`;

  let t = 'すべてのアイテム';
  if (state.favOnly)        t = 'お気に入りのアイテム';
  else if (state.q)         t = `「${state.q}」の検索結果`;
  else if (state.cat!=='all') t = state.cat;
  else if (state.stock==='sale') t = '販売中のアイテム';
  else if (state.stock==='sold') t = 'SOLD のアイテム';
  $('#listTitle').textContent = t;

  document.querySelectorAll('[data-chip]').forEach(b =>
    b.classList.toggle('is-on', b.dataset.chip === state.cat && !state.favOnly));
  document.querySelectorAll('[data-side]').forEach(b =>
    b.classList.toggle('is-on', b.dataset.side === state.cat && !state.favOnly));
  document.querySelectorAll('[data-stock]').forEach(b =>
    b.classList.toggle('is-on', b.dataset.stock === state.stock && !state.favOnly));
  document.querySelectorAll('.tab').forEach(b =>
    b.classList.toggle('is-on',
      (b.dataset.tab === 'sale' && state.stock === 'sale') ||
      (b.dataset.tab === 'all'  && state.stock !== 'sale')));
}

/* ---------- カテゴリの一覧を作る ---------- */
function buildNav(){
  const counts = {};
  PRODUCTS.forEach(p => counts[p.cat] = (counts[p.cat]||0) + 1);
  const cats = Object.entries(counts).sort((a,b) => b[1]-a[1]);

  $('#chips').innerHTML =
    `<button class="chip is-on" data-chip="all" onclick="pickCat('all')">すべて<b>${PRODUCTS.length}</b></button>` +
    cats.map(([c,n]) => `<button class="chip" data-chip="${esc(c)}" onclick="pickCat('${esc(c)}')">${esc(c)}<b>${n}</b></button>`).join('');

  $('#sideNav').innerHTML =
    `<button class="side__link is-on" data-side="all" onclick="pickCat('all')">すべてのアイテム<span>${PRODUCTS.length}</span></button>` +
    cats.map(([c,n]) => `<button class="side__link" data-side="${esc(c)}" onclick="pickCat('${esc(c)}')">${esc(c)}<span>${n}</span></button>`).join('');

  const nSale = PRODUCTS.filter(p => !p.sold).length;
  $('#stockNav').innerHTML = [
    ['all','すべて',PRODUCTS.length],
    ['sale','販売中',nSale],
    ['sold','SOLD',PRODUCTS.length - nSale],
  ].map(([k,l,n]) =>
    `<button class="side__link ${k==='all'?'is-on':''}" data-stock="${k}" onclick="pickStock('${k}')">${l}<span>${n}</span></button>`
  ).join('');
}

/* ---------- 操作 ---------- */
function pickCat(c){ state.cat = c; state.page = 1; state.favOnly = false; render(); scrollToList(); }
function pickStock(s){ state.stock = s; state.page = 1; state.favOnly = false; render(); scrollToList(); }
function showFav(){ state.favOnly = true; state.page = 1; state.cat='all'; state.stock='all'; state.q=''; $('#q').value=''; render(); scrollToList(); }
function resetAll(){
  state = { cat:'all', stock:'all', q:'', sort:'new', page:1, favOnly:false };
  $('#q').value = ''; $('#sort').value = 'new';
  $('.search').classList.remove('is-filled');
  render(); window.scrollTo({top:0, behavior:'smooth'});
}
function scrollToList(){
  const y = $('.wrap').offsetTop - 90;
  if (window.scrollY > y) window.scrollTo({top:y, behavior:'smooth'});
}

/* ---------- 商品詳細 ---------- */
let modalId = null;
function openModal(id){
  const p = PRODUCTS.find(x => x.id === id); if (!p) return;
  modalId = id;
  $('#mImg').src = p.img; $('#mImg').alt = p.name;
  $('#mCat').textContent = p.cat;
  $('#mName').textContent = p.name;
  const st = $('#mStatus');
  st.textContent = p.sold ? 'SOLD OUT' : '販売中';
  st.classList.toggle('is-sale', !p.sold);
  $('#mDesc').textContent = p.desc || '（説明文はありません）';
  $('#mTags').innerHTML = (p.tags||[]).map(t => `<span class="modal__tag">#${esc(t)}</span>`).join('');
  $('#mDm').href = DM;
  $('#mIg').href = `https://www.instagram.com/p/${p.id}/`;
  paintModalFav();
  $('#modal').hidden = false;
  document.body.style.overflow = 'hidden';
}
function paintModalFav(){
  const b = $('#mFav'), on = isFav(modalId);
  b.textContent = on ? '♥ お気に入りに追加ずみ' : '♡ お気に入りに追加';
  b.classList.toggle('is-on', on);
}
function closeModal(){
  $('#modal').hidden = true; document.body.style.overflow = '';
  if (state.favOnly) render();
}

/* ---------- ヒーローバナー ---------- */
const SLIDES = [
  { t:'世界に一つだけの一点物を厳選', s:'S.a.T VINTAGE / ONE OF A KIND', cat:'レザー' },
  { t:'AMERICAN & EUROPEAN VINTAGE', s:'時代を超えて愛されるアイテムを', cat:'ミリタリー' },
  { t:'商品の詳細はDMにて', s:'サイズ・状態のご相談はお気軽に', cat:'アクセサリー' },
  { t:'DENIM COLLECTION', s:'年代物のデニムを厳選しています', cat:'デニム' },
];
let slideIdx = 0, slideMax = 0, slideTimer = null;

function buildHero(){
  const pickImg = cat => (PRODUCTS.find(p => p.cat === cat) || PRODUCTS[0] || {}).img || '';
  $('#heroTrack').innerHTML = SLIDES.map(s => `
    <div class="hero__item" onclick="pickCat('${esc(s.cat)}')">
      <div class="hero__inner">
        <img src="${esc(pickImg(s.cat))}" alt="" loading="lazy">
        <div class="hero__cap"><h3>${esc(s.t)}</h3><p>${esc(s.s)}</p></div>
      </div>
    </div>`).join('');

  const per = window.innerWidth <= 720 ? 1 : (window.innerWidth <= 1000 ? 2 : 3);
  slideMax = Math.max(0, SLIDES.length - per);
  if (slideIdx > slideMax) slideIdx = 0;

  $('#heroDots').innerHTML = Array.from({length: slideMax + 1}, (_,i) =>
    `<button class="hero__dot ${i===slideIdx?'is-on':''}" onclick="goSlide(${i})" aria-label="${i+1}枚目"></button>`).join('');
  moveSlide();
}
function moveSlide(){
  const per = window.innerWidth <= 720 ? 1 : (window.innerWidth <= 1000 ? 2 : 3);
  $('#heroTrack').style.transform = `translateX(-${slideIdx * (100/per)}%)`;
  document.querySelectorAll('.hero__dot').forEach((d,i) => d.classList.toggle('is-on', i===slideIdx));
}
function slide(d){ slideIdx = (slideIdx + d + slideMax + 1) % (slideMax + 1); moveSlide(); resetTimer(); }
function goSlide(i){ slideIdx = i; moveSlide(); resetTimer(); }
function resetTimer(){ clearInterval(slideTimer); slideTimer = setInterval(() => slide(1), 6000); }

/* ---------- 起動 ---------- */
document.addEventListener('DOMContentLoaded', () => {
  buildNav(); buildHero(); paintFavCount(); render(); resetTimer();

  let timer = null;
  $('#q').addEventListener('input', e => {
    $('.search').classList.toggle('is-filled', !!e.target.value);
    clearTimeout(timer);
    timer = setTimeout(() => { state.q = e.target.value.trim(); state.page = 1; state.favOnly = false; render(); }, 220);
  });
  $('#qClear').addEventListener('click', () => {
    $('#q').value = ''; $('.search').classList.remove('is-filled');
    state.q = ''; state.page = 1; render();
  });
  $('#sort').addEventListener('change', e => { state.sort = e.target.value; state.page = 1; render(); });
  $('#moreBtn').addEventListener('click', () => { state.page++; render(); });
  $('#mFav').addEventListener('click', () => {
    toggleFav(modalId); paintModalFav();
    const b = document.querySelector(`[data-fav="${modalId}"]`);
    if (b){ b.classList.toggle('is-on', isFav(modalId)); b.textContent = isFav(modalId) ? '♥' : '♡'; }
  });
  document.querySelectorAll('.tab').forEach(t => t.addEventListener('click', () => {
    pickStock(t.dataset.tab === 'sale' ? 'sale' : 'all');
  }));
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });
  window.addEventListener('resize', () => { clearTimeout(window.__rz); window.__rz = setTimeout(buildHero, 200); });
  window.addEventListener('scroll', () => {
    $('#toTop').classList.toggle('is-on', window.scrollY > 600);
  });
});
