(function(){
  "use strict";
  const DATA = window.STYLE_DATA || {categories:[]};
  const cats = DATA.categories || [];
  const $ = s => document.querySelector(s);
  const $$ = s => Array.from(document.querySelectorAll(s));
  function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));}

  // flatten categories -> items
  const items = [];
  cats.forEach(c=>{
    (c.items||[]).forEach(it=>{
      items.push({
        catKey:c.key, catName:c.name,
        title: it.title || it.titleFull || '(未命名)',
        titleFull: it.titleFull || it.title || '',
        desc: it.desc || '',
        notes: it.notes || '',
        images: (it.images||[]).filter(Boolean)
      });
    });
  });
  const imgCount = items.reduce((n,it)=>n+it.images.length,0);
  const state = {cat:'ALL', q:''};

  // ---------- meta ----------
  $('#navMeta').textContent = 'source · ' + (DATA.source||'飞书多维表格');

  // ---------- sidebar category list ----------
  function buildCats(){
    const counts = {ALL:items.length};
    cats.forEach(c=>counts[c.key]=(c.items||[]).length);
    const all = [{k:'ALL',n:'全部风格'}].concat(cats.map(c=>({k:c.key,n:c.name})));
    $('#catList').innerHTML = all.map(c=>
      `<button class="cat ${state.cat===c.k?'active':''}" data-cat="${esc(c.k)}">
        <b>${esc(c.n)}</b>
        <i>${counts[c.k]||0}</i>
      </button>`
    ).join('');
  }

  // ---------- grid ----------
  function matches(it){
    if(state.cat!=='ALL' && it.catKey!==state.cat) return false;
    const q = state.q.trim().toLowerCase();
    if(q){
      const hay = [it.title,it.titleFull,it.catName,it.desc,it.notes].join(' ').toLowerCase();
      if(!hay.includes(q)) return false;
    }
    return true;
  }
  function renderGrid(){
    const list = items.filter(matches);
    const catName = state.cat==='ALL' ? '全部风格' : (cats.find(c=>c.key===state.cat)||{}).name || '风格';
    $('#listTitle').textContent = catName;
    $('#listSub').textContent = `${list.length} 条结果` + (state.q?` · 搜索「${state.q}」`:' · 共 '+items.length+' 条');
    if(!list.length){ $('#grid').innerHTML=''; $('#empty').style.display='block'; return; }
    $('#empty').style.display='none';
    $('#grid').innerHTML = list.map((it,idx)=>{
      const id = items.indexOf(it);
      const img = it.images.length
        ? `<div class="cardImg"><img loading="lazy" src="${esc(it.images[0])}" alt=""></div>`
        : `<div class="cardImg"><div class="ph">无参考图</div></div>`;
      const catName = it.catName.length>10 ? it.catName.slice(0,10)+'…' : it.catName;
      return `<button class="card" data-id="${id}">
        ${img}
        <div class="cardTitle">${esc(it.title.slice(0,40))}</div>
        <div class="cardMeta">
          <span class="cardCat" title="${esc(it.catName)}">${esc(catName)}</span>
          <span class="cardImgN">${it.images.length?it.images.length+' 图':'—'}</span>
        </div>
      </button>`;
    }).join('');
  }

  // ---------- modal ----------
  let cur = null, gi = 0;
  function openModal(id){
    const it = items[id]; if(!it) return;
    cur = it; gi = 0;
    $('#mCat').textContent = it.catName;
    $('#mTitle').textContent = it.titleFull || it.title;
    const specs = [];
    specs.push(['分类 Category', it.catName]);
    specs.push(['参考图 Images', it.images.length]);
    if(it.notes) specs.push(['备注 Notes', it.notes]);
    $('#mSpecs').innerHTML = specs.map(([k,v])=>`<div class="spec"><span>${esc(k)}</span><b>${esc(v)}</b></div>`).join('');
    $('#mPrompt').textContent = it.desc || '(无提示词)';
    $('#mNotice').textContent = it.images.length ? '' : '该条目暂无参考图。';
    buildGallery();
    $('#modal').classList.add('show');
    document.body.style.overflow='hidden';
  }
  function buildGallery(){
    if(!cur) return;
    const imgs = cur.images;
    if(!imgs.length){ $('#gImg').style.display='none'; $('#gCount').textContent=''; $('#thumbs').innerHTML=''; return; }
    $('#gImg').style.display='block';
    $('#gImg').src = imgs[gi];
    $('#gCount').textContent = `${gi+1} / ${imgs.length}`;
    $('#thumbs').innerHTML = imgs.map((s,i)=>`<img class="${i===gi?'active':''}" loading="lazy" src="${esc(s)}" data-i="${i}" alt="">`).join('');
  }
  function step(d){ if(!cur||!cur.images.length) return; gi=(gi+d+cur.images.length)%cur.images.length; buildGallery(); }
  function closeModal(){ $('#modal').classList.remove('show'); document.body.style.overflow=''; cur=null; }

  // ---------- events ----------
  $('#search').oninput = e=>{ state.q=e.target.value; renderGrid(); };
  $('#catList').onclick = e=>{ const b=e.target.closest('.cat'); if(!b) return; state.cat=b.dataset.cat; buildCats(); renderGrid(); };
  $('#grid').onclick = e=>{ const c=e.target.closest('.card'); if(c) openModal(+c.dataset.id); };
  $('#mClose').onclick = closeModal;
  $('#modal').onclick = e=>{ if(e.target.id==='modal') closeModal(); };
  $('#gPrev').onclick = ()=>step(-1);
  $('#gNext').onclick = ()=>step(1);
  $('#thumbs').onclick = e=>{ const t=e.target.closest('img[data-i]'); if(t){ gi=+t.dataset.i; buildGallery(); } };
  $('#mCopy').onclick = ()=>{
    const txt = $('#mPrompt').textContent || '';
    const done = ()=>{ const t=$('#toast'); t.classList.add('show'); setTimeout(()=>t.classList.remove('show'),1200); };
    if(navigator.clipboard && navigator.clipboard.writeText){ navigator.clipboard.writeText(txt).then(done).catch(()=>fallbackCopy(txt,done)); }
    else fallbackCopy(txt,done);
  };
  function fallbackCopy(txt,done){ const ta=document.createElement('textarea'); ta.value=txt; ta.style.position='fixed'; ta.style.opacity='0'; document.body.appendChild(ta); ta.select(); try{document.execCommand('copy');}catch(e){} document.body.removeChild(ta); done(); }
  document.addEventListener('keydown',e=>{ if(e.key==='Escape') closeModal(); if(e.key==='ArrowLeft'&&$('#modal').classList.contains('show')) step(-1); if(e.key==='ArrowRight'&&$('#modal').classList.contains('show')) step(1); });

  // ---------- init ----------
  buildCats();
  renderGrid();
  console.log('Style Library loaded:', cats.length,'categories,',items.length,'items,',imgCount,'images');
})();
