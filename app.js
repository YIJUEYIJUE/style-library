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

  // ---------- derive display helpers ----------
  function catSub(n){
    const m = n.match(/(?:——|（|\(|·|\||:|：)\s*(.+)$/);
    return m ? m[1].replace(/[）\)]/g,'').trim() : '';
  }
  function deriveKind(n){
    if(/人物|真人|人像|肖像|脸/.test(n)) return '人物';
    if(/海报|排版|版式|字体/.test(n)) return '排版';
    if(/品牌|产品|电商|商业/.test(n)) return '品牌';
    if(/MJ|生图|提示词|SD|绘|AI/.test(n)) return '生图';
    if(/插画|绘本|漫画/.test(n)) return '插画';
    if(/胶片|摄影|写实|复古|电影|影像/.test(n)) return '影像';
    return '风格';
  }
  const short = (s,n=10)=> s.length>n ? s.slice(0,n)+'…' : s;

  // ---------- meta ----------
  $('#libStat').textContent = cats.length + ' 分类 · ' + items.length + ' 参考';

  // ---------- sidebar category list ----------
  function buildCats(){
    const counts = {ALL:items.length};
    cats.forEach(c=>counts[c.key]=(c.items||[]).length);
    const all = [{k:'ALL',n:'全部风格'}].concat(
      cats.map(c=>({k:c.key,n:c.name}))
    );
    $('#catList').innerHTML = all.map(c=>{
      const isAll = c.k==='ALL';
      const sub = isAll ? 'ALL ASSETS' : catSub(c.n);
      const cnt = counts[c.k]||0;
      return `<button class="cat ${state.cat===c.k?'active':''}" data-cat="${esc(c.k)}">
        <b>${esc(c.n)}</b>
        ${sub?`<span>${esc(sub)}</span>`:''}
        <i>${cnt}</i>
      </button>`;
    }).join('');
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
    const cat = state.cat==='ALL' ? '全部风格' : (cats.find(c=>c.key===state.cat)||{}).name || '风格';
    $('#listKicker').textContent = cat;
    $('#listTitle').textContent = cat;
    $('#listSub').textContent = `${list.length} 条结果` + (state.q?` · 搜索「${state.q}」`:' · 共 '+items.length+' 条');
    if(!list.length){ $('#grid').innerHTML=''; $('#empty').style.display='block'; return; }
    $('#empty').style.display='none';
    $('#grid').innerHTML = list.map((it)=>{
      const id = items.indexOf(it);
      const n = it.images.length;
      const img = n
        ? `<div class="assetImg"><img loading="lazy" src="${esc(it.images[0])}" alt=""></div>`
        : `<div class="assetImg"><div class="ph">无参考图</div></div>`;
      const kind = deriveKind(it.catName);
      const tags = `<span class="tag">${esc(kind)}</span><span class="tag mint">${n?n+' 张参考':'无参考图'}</span>`;
      return `<button class="asset" data-id="${id}">
        ${img}
        <div class="assetMeta"><span>${esc(short(it.catName,9))}</span><span>${n?n+' 图':'—'}</span></div>
        <h3>${esc(short(it.title,42))}</h3>
        <div class="tags">${tags}</div>
      </button>`;
    }).join('');
  }

  // ---------- modal ----------
  let cur = null, gi = 0;
  function openModal(id){
    const it = items[id]; if(!it) return;
    cur = it; gi = 0;
    const kind = deriveKind(it.catName);
    $('#mKicker').textContent = it.catName;
    $('#mTitle').textContent = it.titleFull || it.title;
    $('#mTags').innerHTML = `<span class="tag">${esc(kind)}</span><span class="tag mint">${esc(short(it.catName,12))}</span>`;
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
  $('#grid').onclick = e=>{ const c=e.target.closest('.asset'); if(c) openModal(+c.dataset.id); };
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
