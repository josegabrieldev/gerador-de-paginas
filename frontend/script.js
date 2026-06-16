/* ============================================
   GERADOR DE PÁGINA — NEON TECH
   Script Principal
   ============================================ */

"use strict";

// ---- CONFIG ----
const API_BASE = "https://gerador-de-pagina-api.onrender.com";
const API_ENDPOINT = `${API_BASE}/api/generate`;

// ---- STATE ----
let currentData = null;
let toastTimer = null;

// ---- DOM REFS ----
const themeToggle = document.getElementById("themeToggle");
const generateBtn = document.getElementById("generateBtn");
const temaInput = document.getElementById("temaInput");
const generatorForm = document.getElementById("generatorForm");
const resultSection = document.getElementById("resultSection");
const errorSection = document.getElementById("errorSection");
const errorMsg = document.getElementById("errorMsg");
const previewFrame = document.getElementById("previewFrame");
const previewWrapper = document.getElementById("previewWrapper");
const resultTema = document.getElementById("resultTema");
const urlSlug = document.getElementById("urlSlug");
const downloadBtn = document.getElementById("downloadBtn");
const regenerateBtn = document.getElementById("regenerateBtn");
const toast = document.getElementById("toast");
const htmlCode = document.getElementById("htmlCode").querySelector("code");
const cssCode = document.getElementById("cssCode").querySelector("code");
const jsCode = document.getElementById("jsCode").querySelector("code");
const completeCode = document
  .getElementById("completeCode")
  .querySelector("code");

// ---- PARTICLES ----
function initParticles() {
  const canvas = document.getElementById("particles");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  let W = window.innerWidth,
    H = window.innerHeight;
  canvas.width = W;
  canvas.height = H;

  const count = Math.min(60, Math.floor((W * H) / 18000));
  const isDark = () =>
    document.documentElement.getAttribute("data-theme") !== "light";

  const particles = Array.from({ length: count }, () => ({
    x: Math.random() * W,
    y: Math.random() * H,
    vx: (Math.random() - 0.5) * 0.3,
    vy: (Math.random() - 0.5) * 0.3,
    size: Math.random() * 1.5 + 0.5,
    color: Math.random() > 0.5 ? "#00D1FF" : "#8B5CFF",
    opacity: Math.random() * 0.4 + 0.1,
  }));

  function draw() {
    ctx.clearRect(0, 0, W, H);
    const alpha = isDark() ? 1 : 0.4;

    particles.forEach((p) => {
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < 0) p.x = W;
      if (p.x > W) p.x = 0;
      if (p.y < 0) p.y = H;
      if (p.y > H) p.y = 0;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.opacity * alpha;
      ctx.fill();
    });

    // Draw connections
    ctx.globalAlpha = isDark() ? 0.06 : 0.03;
    particles.forEach((a, i) => {
      for (let j = i + 1; j < particles.length; j++) {
        const b = particles[j];
        const dist = Math.hypot(a.x - b.x, a.y - b.y);
        if (dist < 120) {
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.strokeStyle = "#00D1FF";
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }
    });

    ctx.globalAlpha = 1;
    requestAnimationFrame(draw);
  }

  draw();

  window.addEventListener("resize", () => {
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = W;
    canvas.height = H;
  });
}

// ---- THEME ----
function initTheme() {
  const saved = localStorage.getItem("gp-theme") || "dark";
  setTheme(saved, false);
}

function setTheme(theme, animate = true) {
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem("gp-theme", theme);
  themeToggle.setAttribute("aria-pressed", theme === "dark" ? "true" : "false");
  themeToggle.title =
    theme === "dark" ? "Mudar para tema claro" : "Mudar para tema escuro";

  if (animate) {
    document.body.style.transition =
      "background-color 0.4s ease, color 0.4s ease";
  }
}

themeToggle.addEventListener("click", () => {
  const current = document.documentElement.getAttribute("data-theme");
  setTheme(current === "dark" ? "light" : "dark");
});

// ---- GENERATE ----
async function generatePage(tema) {
  setLoading(true);
  hideError();

  try {
    const res = await fetch(API_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tema }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      const erro = new Error(err.message || res.statusText);
      erro.status = res.status;
      throw erro;
    }

    const data = await res.json();

    if (!data.html && !data.completo) {
      throw new Error("Resposta inválida da IA. Tente novamente.");
    }

    currentData = data;
    displayResult(tema, data);
  } catch (err) {
    console.error("Erro ao gerar página:", err);
    showError(getMensagemErro(err));
  } finally {
    setLoading(false);
  }
}

function displayResult(tema, data) {
  // Update meta
  resultTema.textContent = tema.toUpperCase();
  urlSlug.textContent = tema
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
  document.title = `Gerador de Página — ${tema}`;

  // Show result
  resultSection.hidden = false;
  resultSection.scrollIntoView({ behavior: "smooth", block: "start" });

  // Load preview
  loadPreview(data);

  // Load code
  renderCode(htmlCode, data.html || "", "html");
  renderCode(cssCode, data.css || "", "css");
  renderCode(jsCode, data.js || "", "js");
  renderCode(completeCode, data.completo || "", "html");

  showToast("✅ Página gerada com sucesso!");
}

function loadPreview(data) {
  const completo = data.completo || "";
  const completoPareceHTML =
    completo.trim().startsWith("<!DOCTYPE") ||
    completo.trim().startsWith("<html");

  let combined;

  if (completoPareceHTML) {
    combined = completo;
  } else {
    combined = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link href="https://fonts.googleapis.com/css2?family=Open+Sans:wght@300;400;600;700&display=swap" rel="stylesheet">
  <style>${data.css || ""}</style>
</head>
<body>
${data.html || ""}
<script>${data.js || ""}<\/script>
</body>
</html>`;
  }

  const blob = new Blob([combined], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  previewFrame.src = url;
}

// ---- FORMAT + SYNTAX HIGHLIGHT ----
function renderCode(el, code, lang) {
  const formatted = formatCode(code, lang);
  const escaped = escapeHtml(formatted);
  el.innerHTML = highlight(escaped, lang);
}

function formatCode(code, lang) {
  if (!code || !code.trim()) return code;
  if (lang === "html") return formatHtml(code);
  if (lang === "css") return formatCss(code);
  if (lang === "js") return formatJs(code);
  return code;
}

function formatHtml(code) {
  const inlineTags =
    /^(a|span|strong|em|b|i|u|small|label|button|img|input|br|hr|li|td|th|dt|dd|abbr|code|kbd|mark|cite|q|s|sub|sup)$/i;
  const selfClosing =
    /\/>$|^<(area|base|br|col|embed|hr|img|input|link|meta|param|source|track|wbr)/i;
  const pad = (n) => "  ".repeat(Math.max(0, n));
  let indent = 0;

  const flat = code
    .replace(/>\s+</g, "><")
    .replace(/\s{2,}/g, " ")
    .trim();

  const tokens = flat.split(/(?=<)|(?<=>)/).filter((t) => t.trim());
  const lines = [];

  tokens.forEach((token) => {
    const trimmed = token.trim();
    if (!trimmed) return;
    const isClosing = /^<\//.test(trimmed);
    const isSelfClose = selfClosing.test(trimmed);
    const isComment = trimmed.startsWith("<!--");
    const tagNameMatch = trimmed.match(/^<\/?([a-zA-Z][a-zA-Z0-9]*)/);
    const tagName = tagNameMatch ? tagNameMatch[1] : "";
    const isInline = inlineTags.test(tagName);

    if (isClosing && !isSelfClose) indent = Math.max(0, indent - 1);
    lines.push(pad(indent) + trimmed);
    if (!isClosing && !isSelfClose && !isComment && !isInline && tagName)
      indent++;
  });

  return lines.join("\n");
}

function formatCss(code) {
  return code
    .replace(/\s*\{\s*/g, " {\n")
    .replace(/;\s*/g, ";\n")
    .replace(/\s*\}\s*/g, "\n}\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .split("\n")
    .map((line) => {
      const t = line.trim();
      if (!t) return "";
      const isProperty =
        t.includes(":") &&
        !t.endsWith("{") &&
        !t.startsWith("}") &&
        !t.startsWith("/*") &&
        !t.startsWith("@");
      return isProperty ? "  " + t : t;
    })
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function formatJs(code) {
  if ((code.match(/\n/g) || []).length > 5) return code;
  return code
    .replace(/;\s*/g, ";\n")
    .replace(/\{\s*/g, " {\n")
    .replace(/\}\s*/g, "\n}\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function escapeHtml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function highlight(code, lang) {
  if (lang === "html") return highlightHtml(code);
  if (lang === "css") return highlightCss(code);
  if (lang === "js") return highlightJs(code);
  return code;
}

function highlightHtml(code) {
  return code
    .replace(/(&lt;!--[\s\S]*?--&gt;)/g, '<span class="hl-comment">$1</span>')
    .replace(/(&lt;\/?[a-zA-Z][a-zA-Z0-9]*)/g, '<span class="hl-tag">$1</span>')
    .replace(
      /([a-zA-Z-]+=)(&quot;[^&]*&quot;)/g,
      '<span class="hl-attr">$1</span><span class="hl-value">$2</span>',
    )
    .replace(/(\/?&gt;)/g, '<span class="hl-tag">$1</span>');
}

function highlightCss(code) {
  return code
    .replace(/(\/\*[\s\S]*?\*\/)/g, '<span class="hl-comment">$1</span>')
    .replace(/^([^{}\n]+\{)/gm, '<span class="hl-selector">$1</span>')
    .replace(
      /^(\s+)([\w-]+)(\s*:)/gm,
      '$1<span class="hl-property">$2</span>$3',
    )
    .replace(
      /:\s*([\d.]+)(px|rem|em|%|vh|vw|deg|s|ms)/g,
      ': <span class="hl-number">$1</span><span class="hl-unit">$2</span>',
    )
    .replace(/(#[0-9a-fA-F]{3,8})\b/g, '<span class="hl-value">$1</span>');
}

function highlightJs(code) {
  return code
    .replace(/(\/\/[^\n]*)/g, '<span class="hl-comment">$1</span>')
    .replace(/(\/\*[\s\S]*?\*\/)/g, '<span class="hl-comment">$1</span>')
    .replace(
      /\b(const|let|var|function|return|if|else|for|while|class|import|export|default|async|await|new|this|typeof|true|false|null|undefined)\b/g,
      '<span class="hl-keyword">$1</span>',
    )
    .replace(
      /(&quot;[^&]*&quot;|&#039;[^&]*&#039;)/g,
      '<span class="hl-string">$1</span>',
    );
}

// ---- CODE TABS ----
document.querySelectorAll(".tab-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    const tab = btn.dataset.tab;

    document.querySelectorAll(".tab-btn").forEach((b) => {
      b.classList.remove("active");
      b.setAttribute("aria-selected", "false");
    });
    document.querySelectorAll(".code-panel").forEach((p) => {
      p.classList.remove("active");
      p.hidden = true;
    });

    btn.classList.add("active");
    btn.setAttribute("aria-selected", "true");

    const panel = document.getElementById(`code${capitalize(tab)}`);
    if (panel) {
      panel.classList.add("active");
      panel.hidden = false;
    }
  });

  // Keyboard navigation
  btn.addEventListener("keydown", (e) => {
    const tabs = [...document.querySelectorAll(".tab-btn")];
    const idx = tabs.indexOf(btn);
    if (e.key === "ArrowRight") {
      e.preventDefault();
      tabs[(idx + 1) % tabs.length].focus();
    }
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      tabs[(idx - 1 + tabs.length) % tabs.length].focus();
    }
  });
});

function capitalize(str) {
  if (str === "complete") return "Complete";
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// ---- COPY BUTTONS ----
document.querySelectorAll(".copy-btn").forEach((btn) => {
  btn.addEventListener("click", async () => {
    const target = btn.dataset.target;
    let text = "";

    if (target === "html") text = currentData?.html || "";
    else if (target === "css") text = currentData?.css || "";
    else if (target === "js") text = currentData?.js || "";
    else if (target === "complete") text = currentData?.completo || "";

    if (!text) {
      showToast("⚠️ Nada para copiar", true);
      return;
    }

    try {
      await navigator.clipboard.writeText(text);
      btn.classList.add("copied");
      btn.querySelector("span").textContent = "Copiado!";
      showToast("📋 Código copiado!");
      setTimeout(() => {
        btn.classList.remove("copied");
        btn.querySelector("span").textContent = "Copiar";
      }, 2000);
    } catch {
      showToast("❌ Falha ao copiar", true);
    }
  });
});

// ---- PREVIEW SIZE ----
document.querySelectorAll(".size-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".size-btn").forEach((b) => {
      b.classList.remove("active");
      b.setAttribute("aria-pressed", "false");
    });
    btn.classList.add("active");
    btn.setAttribute("aria-pressed", "true");

    const size = btn.dataset.size;
    previewWrapper.className = "preview-frame-wrapper";
    if (size !== "desktop") previewWrapper.classList.add(size);
  });
});

// ---- DOWNLOAD ----
downloadBtn.addEventListener("click", () => {
  if (!currentData) return;
  const content = currentData.completo || "";
  const blob = new Blob([content], { type: "text/html" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `pagina-${(resultTema.textContent || "gerada").toLowerCase()}.html`;
  a.click();
  showToast("⬇️ Download iniciado!");
});

// ---- REGENERATE ----
regenerateBtn.addEventListener("click", () => {
  const tema = temaInput.value.trim();
  if (tema) generatePage(tema);
});

// ---- FORM SUBMIT ----
generatorForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const tema = temaInput.value.trim();
  if (!tema) {
    temaInput.focus();
    showToast("⚠️ Digite um tema para gerar a página!", true);
    temaInput.classList.add("shake");
    setTimeout(() => temaInput.classList.remove("shake"), 500);
    return;
  }
  generatePage(tema);
});

generateBtn.addEventListener("click", () => {
  generatorForm.dispatchEvent(new Event("submit"));
});

temaInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") generatorForm.dispatchEvent(new Event("submit"));
});

// ---- TAG CHIPS ----
document.querySelectorAll(".tag-chip").forEach((chip) => {
  chip.addEventListener("click", () => {
    const tema = chip.dataset.tema;
    temaInput.value = tema;
    temaInput.focus();
    generatePage(tema);
  });
});

// ---- UTILS ----
function setLoading(loading) {
  generateBtn.disabled = loading;
  generateBtn.classList.toggle("loading", loading);
  temaInput.disabled = loading;
  document.querySelectorAll(".tag-chip").forEach((c) => (c.disabled = loading));
}

function getMensagemErro(err) {
  switch (err.status) {
    case 400:
      return "⚠️ O tema enviado é inválido. Digite um tema com pelo menos 2 caracteres.";
    case 429:
      return "⏳ Muitas requisições em pouco tempo. Aguarde alguns segundos e tente novamente.";
    case 500:
      return "🔴 Erro interno no servidor. A IA pode estar sobrecarregada, tente novamente.";
    case 503:
      return "📡 Servidor temporariamente indisponível. Tente novamente em alguns instantes.";
    default:
      return "🔌 Não foi possível conectar ao servidor. Verifique se o backend está rodando.";
  }
}

function showError(msg) {
  errorMsg.textContent = msg;
  errorSection.hidden = false;
  errorSection.scrollIntoView({ behavior: "smooth", block: "center" });
  resultSection.hidden = true;
}

function hideError() {
  errorSection.hidden = true;
}

function showToast(msg, isError = false) {
  toast.textContent = msg;
  toast.className = "toast" + (isError ? " error" : "");
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 3000);
}

// ---- SHAKE ANIMATION (CSS via JS) ----
const style = document.createElement("style");
style.textContent = `
  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    20% { transform: translateX(-8px); }
    40% { transform: translateX(8px); }
    60% { transform: translateX(-5px); }
    80% { transform: translateX(5px); }
  }
  .shake { animation: shake 0.5s ease; }
`;
document.head.appendChild(style);

// ---- INIT ----
initTheme();
initParticles();
temaInput.focus();
// Preenche o ano do copyright dinamicamente
// assim nunca precisa atualizar manualmente
document.getElementById('footerYear').textContent = new Date().getFullYear();

// Auto-detect if backend is running
(async () => {
  try {
    const r = await fetch(`${API_BASE}/health`, {
      signal: AbortSignal.timeout(3000),
    });
    if (!r.ok) throw new Error();
  } catch {
    console.warn("Backend não detectado em", API_BASE);
  }
})();
