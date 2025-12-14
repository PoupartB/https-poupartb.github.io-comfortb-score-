const bg = document.getElementById("bg");
const canvas = document.getElementById("paint");
const stage = document.getElementById("stage");
const ctx = canvas.getContext("2d");

const fileInput = document.getElementById("fileInput");
const colorInput = document.getElementById("color");
const sizeInput = document.getElementById("size");
const sizeVal = document.getElementById("sizeVal");
const eraser = document.getElementById("eraser");
const undoBtn = document.getElementById("undoBtn");
const clearBtn = document.getElementById("clearBtn");
const exportBtn = document.getElementById("exportBtn");

let drawing = false;
let last = null;
let history = [];

sizeVal.textContent = sizeInput.value;
sizeInput.addEventListener("input", () => (sizeVal.textContent = sizeInput.value));

function saveHistory() {
  try {
    if (history.length >= 30) history.shift();
    history.push(canvas.toDataURL("image/png"));
  } catch {}
}

function undo() {
  const prev = history.pop();
  if (!prev) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    return;
  }
  const img = new Image();
  img.onload = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0);
  };
  img.src = prev;
}

undoBtn.addEventListener("click", undo);

clearBtn.addEventListener("click", () => {
  if (!bg.src) return;
  saveHistory();
  ctx.clearRect(0, 0, canvas.width, canvas.height);
});

function resizeToImage() {
  const rect = bg.getBoundingClientRect();
  const stageRect = stage.getBoundingClientRect();

  const w = Math.round(rect.width);
  const h = Math.round(rect.height);

  canvas.width = w;
  canvas.height = h;

  const left = rect.left - stageRect.left + stage.scrollLeft;
  const top = rect.top - stageRect.top + stage.scrollTop;

  canvas.style.left = `${left}px`;
  canvas.style.top = `${top}px`;
}

function loadImageFromUrl(url) {
  bg.onload = () => {
    requestAnimationFrame(() => {
      resizeToImage();
      history = [];
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    });
  };
  bg.src = url;
}

fileInput.addEventListener("change", () => {
  const file = fileInput.files?.[0];
  if (!file) return;
  const url = URL.createObjectURL(file);
  loadImageFromUrl(url);
});

window.addEventListener("resize", () => {
  if (bg.src) resizeToImage();
});

function getPoint(evt) {
  const r = canvas.getBoundingClientRect();
  return { x: evt.clientX - r.left, y: evt.clientY - r.top };
}

function strokeLine(a, b) {
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.lineWidth = Number(sizeInput.value);

  if (eraser.checked) {
    ctx.globalCompositeOperation = "destination-out";
    ctx.strokeStyle = "rgba(0,0,0,1)";
  } else {
    ctx.globalCompositeOperation = "source-over";
    ctx.strokeStyle = colorInput.value;
  }

  ctx.beginPath();
  ctx.moveTo(a.x, a.y);
  ctx.lineTo(b.x, b.y);
  ctx.stroke();
}

canvas.addEventListener("pointerdown", (e) => {
  if (!bg.src) return alert("Charge d’abord une image.");
  canvas.setPointerCapture(e.pointerId);
  drawing = true;
  last = getPoint(e);
  saveHistory();
});

canvas.addEventListener("pointermove", (e) => {
  if (!drawing || !last) return;
  const p = getPoint(e);
  strokeLine(last, p);
  last = p;
});

function stop() { drawing = false; last = null; }
canvas.addEventListener("pointerup", stop);
canvas.addEventListener("pointercancel", stop);

exportBtn.addEventListener("click", () => {
  if (!bg.src) return alert("Charge d’abord une image.");

  const out = document.createElement("canvas");
  out.width = canvas.width;
  out.height = canvas.height;
  const octx = out.getContext("2d");

  const tmp = new Image();
  tmp.onload = () => {
    octx.drawImage(tmp, 0, 0, out.width, out.height);
    octx.drawImage(canvas, 0, 0);

    const a = document.createElement("a");
    a.download = "annotation.png";
    a.href = out.toDataURL("image/png");
    a.click();
  };
  tmp.src = bg.src;
});
