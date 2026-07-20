(function () {
  "use strict";
  var D = window.STYLE_DATA || { categories: [] };

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;")
      .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  // flatten
  var flat = [];
  D.categories.forEach(function (c) {
    c.items.forEach(function (it) {
      flat.push({
        cat: c.key, catName: c.name, catSub: c.sub || "",
        title: it.title || "未命名", titleFull: it.titleFull || "",
        desc: it.desc || "", images: it.images || []
      });
    });
  });

  // hero stats
  document.getElementById("statCats").textContent = D.categories.length;
  document.getElementById("statItems").textContent = flat.length;
  document.getElementById("statImgs").textContent =
    flat.reduce(function (a, b) { return a + b.images.length; }, 0);
  if (D.source) document.getElementById("footSource").textContent = D.source;

  // hero collage (sample images)
  (function collage() {
    var picks = [];
    D.categories.forEach(function (c) {
      c.items.forEach(function (it) {
        if (it.images && it.images.length) picks.push({ src: it.images[0], t: it.title });
      });
    });
    picks = picks.slice(0, 4);
    var cls = ["c1", "c2", "c3", "c4"];
    var box = document.getElementById("collage");
    picks.forEach(function (p, i) {
      var d = document.createElement("div");
      d.className = "floatCard " + cls[i];
      d.innerHTML = '<img src="' + esc(p.src) + '" alt="" loading="lazy"><b>' +
        esc(p.t) + "</b>";
      box.appendChild(d);
    });
  })();

  // chips
  var activeCat = "all";
  var query = "";
  var chipsBox = document.getElementById("chips");
  function buildChips() {
    var all = [{ key: "all", name: "全部", sub: "", count: flat.length }];
    D.categories.forEach(function (c) {
      all.push({ key: c.key, name: c.name, sub: c.sub, count: c.count });
    });
    chipsBox.innerHTML = "";
    all.forEach(function (c) {
      var b = document.createElement("button");
      b.className = "chip" + (c.key === activeCat ? " active" : "");
      b.innerHTML = esc(c.name) + (c.sub ? " · " + esc(c.sub) : "") +
        ' <span class="n">' + c.count + "</span>";
      b.onclick = function () { activeCat = c.key; buildChips(); render(); };
      chipsBox.appendChild(b);
    });
  }

  function current() {
    var q = query.trim().toLowerCase();
    return flat.filter(function (it) {
      if (activeCat !== "all" && it.cat !== activeCat) return false;
      if (!q) return true;
      var hay = (it.titleFull + " " + it.desc + " " + it.catName).toLowerCase();
      return hay.indexOf(q) !== -1;
    });
  }

  var grid = document.getElementById("grid");
  function render() {
    var list = current();
    var catObj = D.categories.filter(function (c) { return c.key === activeCat; })[0];
    document.getElementById("secTitle").textContent =
      activeCat === "all" ? "全部风格" : (catObj.name + (catObj.sub ? " · " + catObj.sub : ""));
    document.getElementById("secDesc").textContent =
      "共 " + list.length + " 条 · 来自飞书《风格资产库自用 副本》";

    grid.innerHTML = "";
    if (!list.length) {
      grid.innerHTML = '<div class="empty">没有匹配的条目，换个关键词试试。</div>';
      return;
    }
    list.forEach(function (it, i) {
      var card = document.createElement("article");
      card.className = "card";
      var media = '<div class="cardImg">';
      if (it.images.length) {
        media += '<img src="' + esc(it.images[0]) + '" alt="" loading="lazy">';
        media += '<span class="badge">' + esc(it.catName) + "</span>";
        if (it.images.length > 1)
          media += '<span class="countDot">+' + (it.images.length - 1) + "</span>";
      } else {
        media += '<div class="ph">无图</div>';
      }
      media += "</div>";
      var body = '<div class="cardBody">' +
        '<div class="cardTitle">' + esc(it.title) + "</div>";
      if (it.desc) body += '<div class="cardTag">' + esc(it.desc) + "</div>";
      body += '<div class="cardCat">' + esc(it.catName) +
        (it.catSub ? " · " + esc(it.catSub) : "") + "</div></div>";
      card.innerHTML = media + body;
      card.onclick = function () { openModal(list, i); };
      grid.appendChild(card);
    });
  }

  // modal
  var modal = document.getElementById("modal");
  var gImg = document.getElementById("gImg");
  var gCount = document.getElementById("gCount");
  var thumbs = document.getElementById("thumbs");
  var mTitle = document.getElementById("mTitle");
  var mCat = document.getElementById("mCat");
  var mSpecs = document.getElementById("mSpecs");
  var mPrompt = document.getElementById("mPrompt");
  var mNotice = document.getElementById("mNotice");
  var listRef = [], idx = 0, gi = 0;

  function openModal(list, i) {
    listRef = list; idx = i; gi = 0;
    var it = list[i];
    mTitle.textContent = it.title;
    mCat.textContent = it.catName + (it.catSub ? " · " + it.catSub : "");
    // specs
    var specs = "";
    specs += spec("分类", it.catName + (it.catSub ? " " + it.catSub : ""));
    specs += spec("参考图", it.images.length ? (it.images.length + " 张") : "无");
    if (it.desc) specs += spec("模型 / 备注", it.desc);
    mSpecs.innerHTML = specs;
    mPrompt.textContent = it.titleFull || it.desc || "（无文字说明）";
    mNotice.textContent = it.images.length ? "" : "该条目暂无效果参考图，下方为文字提示词 / 说明。";
    showImg();
    modal.classList.add("show");
    document.body.style.overflow = "hidden";
  }
  function spec(k, v) {
    return '<div class="spec"><span>' + esc(k) + "</span><b>" + esc(v) + "</b></div>";
  }
  function showImg() {
    var it = listRef[idx];
    if (!it.images.length) {
      gImg.style.display = "none";
      gCount.textContent = "无图";
      thumbs.innerHTML = "";
      return;
    }
    gImg.style.display = "";
    gImg.src = it.images[gi];
    gCount.textContent = (gi + 1) + " / " + it.images.length;
    thumbs.innerHTML = "";
    it.images.forEach(function (src, k) {
      var t = document.createElement("img");
      t.src = src; t.className = k === gi ? "on" : "";
      t.onclick = function () { gi = k; showImg(); };
      thumbs.appendChild(t);
    });
  }
  function step(d) {
    var it = listRef[idx];
    if (!it.images.length) return;
    gi = (gi + d + it.images.length) % it.images.length;
    showImg();
  }
  document.getElementById("gPrev").onclick = function () { step(-1); };
  document.getElementById("gNext").onclick = function () { step(1); };
  function closeModal() {
    modal.classList.remove("show");
    document.body.style.overflow = "";
  }
  document.getElementById("mClose").onclick = closeModal;
  modal.onclick = function (e) { if (e.target === modal) closeModal(); };
  document.addEventListener("keydown", function (e) {
    if (!modal.classList.contains("show")) return;
    if (e.key === "Escape") closeModal();
    else if (e.key === "ArrowLeft") step(-1);
    else if (e.key === "ArrowRight") step(1);
  });

  // copy
  var toast = document.getElementById("toast");
  var toastT;
  function showToast(msg) {
    toast.textContent = msg;
    toast.classList.add("show");
    clearTimeout(toastT);
    toastT = setTimeout(function () { toast.classList.remove("show"); }, 1600);
  }
  document.getElementById("mCopy").onclick = function () {
    var txt = mPrompt.textContent || "";
    var done = function () { showToast("已复制提示词 ✓"); };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(txt).then(done, fallback);
    } else fallback();
    function fallback() {
      var ta = document.createElement("textarea");
      ta.value = txt; document.body.appendChild(ta);
      ta.select();
      try { document.execCommand("copy"); done(); } catch (e) { showToast("复制失败，请手动选择"); }
      document.body.removeChild(ta);
    }
  };

  // search + enter
  var searchEl = document.getElementById("search");
  searchEl.addEventListener("input", function () { query = this.value; render(); });
  document.getElementById("enterBtn").onclick = function () {
    document.getElementById("library").scrollIntoView({ behavior: "smooth" });
  };

  buildChips();
  render();
})();
