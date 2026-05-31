import express, { Router, type IRouter } from "express";
import fs from "fs";
import path from "path";
import { requireAdmin } from "../lib/session";
import { loadContent } from "./private";

const router: IRouter = Router();

router.get("/reorder", requireAdmin, (_req, res) => {
  const content = loadContent() as Record<string, unknown>;
  const photos = (content.photos as string[] | undefined) ?? [];
  const captions = (
    (content.captions as Record<string, unknown> | undefined)?.ar as
      | { title: string; text: string }[]
      | undefined
  ) ?? [];
  const mediaConfig = content.mediaConfig as Record<string, unknown> | undefined;
  const photosDir = (mediaConfig?.photosDir as string | undefined) ?? "all_photos";

  const photosJson = JSON.stringify(photos);
  const captionsJson = JSON.stringify(captions);
  const photosDirJson = JSON.stringify(photosDir);

  const html = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>ترتيب الصور — Nafsam</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{background:#0a0a0f;color:#e0d6c8;font-family:system-ui,sans-serif;padding:16px;direction:rtl}
h1{text-align:center;font-size:1.3rem;margin-bottom:8px;color:#c9a96e}
.subtitle{text-align:center;font-size:.85rem;color:#888;margin-bottom:16px}
.toolbar{display:flex;gap:8px;justify-content:center;flex-wrap:wrap;margin-bottom:16px}
button{padding:8px 18px;border:none;border-radius:8px;cursor:pointer;font-size:.9rem;font-family:inherit}
#saveBtn{background:#c9a96e;color:#000;font-weight:700}
#saveBtn:hover{background:#e0c080}
#saveBtn:disabled{background:#555;color:#999;cursor:not-allowed}
.btn-secondary{background:#1e1e2e;color:#c9a96e;border:1px solid #c9a96e33}
.btn-secondary:hover{background:#2a2a3e}
#status{text-align:center;margin-top:10px;font-size:.9rem;min-height:1.4em;color:#8ec99a}
#status.err{color:#e07070}
.counter{text-align:center;font-size:.8rem;color:#666;margin-bottom:12px}
.grid{
  display:grid;
  grid-template-columns:repeat(auto-fill,minmax(130px,1fr));
  gap:10px;
}
.card{
  background:#13131d;
  border:2px solid #2a2a3a;
  border-radius:10px;
  overflow:hidden;
  cursor:grab;
  user-select:none;
  transition:transform .15s,border-color .15s,opacity .2s;
}
.card:active{cursor:grabbing}
.card.dragging{opacity:.4;border-color:#c9a96e}
.card.drag-over{border-color:#c9a96e;transform:scale(1.04)}
.card img{
  width:100%;
  aspect-ratio:1/1;
  object-fit:cover;
  display:block;
  background:#1a1a2a;
}
.card-info{padding:6px 6px 4px;font-size:.7rem}
.card-num{color:#c9a96e;font-weight:700;font-size:.75rem}
.card-caption{color:#bbb;margin-top:2px;font-size:.68rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.card-filename{color:#555;margin-top:2px;font-size:.58rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.no-caption{color:#555;font-style:italic}
</style>
</head>
<body>
<h1>ترتيب الصور</h1>
<p class="subtitle">اسحب الصور وغيّر ترتيبها، ثم اضغط «حفظ الترتيب»</p>
<div class="toolbar">
  <button id="saveBtn">حفظ الترتيب</button>
  <button class="btn-secondary" onclick="exportJSON()">نسخ JSON</button>
</div>
<div class="counter" id="counter"></div>
<div id="status"></div>
<div class="grid" id="grid"></div>

<script>
const PHOTOS = ${photosJson};
const CAPTIONS = ${captionsJson};
const PHOTOS_DIR = ${photosDirJson};

let order = [...PHOTOS];
let dragSrc = null;

function render() {
  const grid = document.getElementById('grid');
  grid.innerHTML = '';
  document.getElementById('counter').textContent = 'عدد الصور: ' + order.length + ' | الكابشنات: ' + CAPTIONS.length;
  order.forEach((file, i) => {
    const cap = i < CAPTIONS.length ? CAPTIONS[i] : null;
    const card = document.createElement('div');
    card.className = 'card';
    card.draggable = true;
    card.dataset.idx = String(i);

    const imgUrl = '/api/private/images/' + encodeURIComponent(PHOTOS_DIR) + '/' + encodeURIComponent(file);
    card.innerHTML =
      '<img src="' + imgUrl + '" loading="lazy" onerror="this.style.background=\'#2a1a1a\'">' +
      '<div class="card-info">' +
        '<div class="card-num">#' + (i + 1) + '</div>' +
        (cap
          ? '<div class="card-caption">' + cap.title + '</div>'
          : '<div class="card-caption no-caption">— بدون كابشن —</div>') +
        '<div class="card-filename">' + file.slice(0, 8) + '...</div>' +
      '</div>';

    card.addEventListener('dragstart', function(e) {
      dragSrc = i;
      card.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
    });
    card.addEventListener('dragend', function() {
      card.classList.remove('dragging');
      document.querySelectorAll('.drag-over').forEach(function(el) { el.classList.remove('drag-over'); });
    });
    card.addEventListener('dragover', function(e) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      document.querySelectorAll('.drag-over').forEach(function(el) { el.classList.remove('drag-over'); });
      card.classList.add('drag-over');
    });
    card.addEventListener('dragleave', function() { card.classList.remove('drag-over'); });
    card.addEventListener('drop', function(e) {
      e.preventDefault();
      card.classList.remove('drag-over');
      if (dragSrc === null || dragSrc === i) return;
      var moved = order.splice(dragSrc, 1)[0];
      order.splice(i, 0, moved);
      render();
    });

    grid.appendChild(card);
  });
}

function setStatus(msg, isErr) {
  var el = document.getElementById('status');
  el.textContent = msg;
  el.className = isErr ? 'err' : '';
}

document.getElementById('saveBtn').addEventListener('click', function() {
  var btn = document.getElementById('saveBtn');
  btn.disabled = true;
  btn.textContent = 'جاري الحفظ...';
  setStatus('');
  fetch('/api/reorder', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({ photos: order })
  }).then(function(res) {
    return res.json().then(function(data) {
      if (!res.ok) throw new Error(data.error || 'خطأ غير معروف');
      setStatus('تم الحفظ بنجاح! (' + order.length + ' صورة)');
    });
  }).catch(function(e) {
    setStatus(e.message, true);
  }).finally(function() {
    btn.disabled = false;
    btn.textContent = 'حفظ الترتيب';
  });
});

function exportJSON() {
  var text = JSON.stringify(order, null, 2);
  navigator.clipboard.writeText(text).then(function() {
    setStatus('تم النسخ إلى الحافظة');
  });
}

render();
</script>
</body>
</html>`;

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.send(html);
});

router.post("/reorder", requireAdmin, express.json(), async (req, res) => {
  const { photos } = req.body as { photos?: unknown };
  if (!Array.isArray(photos) || photos.some((p) => typeof p !== "string")) {
    res.status(400).json({ error: "invalid_photos" });
    return;
  }

  const content = loadContent() as Record<string, unknown>;
  content.photos = photos as string[];

  const { PRIVATE_ROOT } = await import("./private");
  const CONTENT_FILE = path.resolve(PRIVATE_ROOT, "content.json");

  try {
    fs.writeFileSync(CONTENT_FILE, JSON.stringify(content, null, 2), "utf-8");
  } catch {
    res.status(500).json({ error: "cannot_write_content" });
    return;
  }

  res.json({ ok: true, count: (photos as string[]).length });
});

export default router;
