/* ==========================================================================
   LEAD BOT — Yapon Malaka Test Markazi
   Sends form submissions instantly to Telegram group + 3 admins.
   ========================================================================== */

const TG_BOT_TOKEN = '8614627035:AAHXfp2nGGP9LZi3FKnM__Z4bBHAUWRlL54';
const TG_GROUP_ID  = '-5272640089';      // Lead-receiving group chat
const TG_ADMIN_IDS = ['223253692', '524551673', '7664791220'];

/* -------------------- Telegram low-level send -------------------- */
async function tgSend(chatId, html) {
  const url = `https://api.telegram.org/bot${TG_BOT_TOKEN}/sendMessage`;
  const body = {
    chat_id: chatId,
    text: html,
    parse_mode: 'HTML',
    disable_web_page_preview: true
  };
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const json = await res.json();
    if (!json.ok) console.warn('[lead] Telegram error for', chatId, json);
    return json.ok === true;
  } catch (e) {
    console.warn('[lead] Network error sending to', chatId, e);
    return false;
  }
}

/* Escape HTML for Telegram parse_mode=HTML */
function esc(s) {
  if (s == null) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/* -------------------- Build lead message -------------------- */
function buildLeadMessage(data) {
  const ts = new Date().toLocaleString('uz-UZ', {
    timeZone: 'Asia/Tashkent',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit'
  });

  const lines = [
    '🔥 <b>YANGI LEAD — Yapon Malaka Markazi</b>',
    '',
    `📌 <b>Yo'nalish:</b> ${esc(data.intent || '—')}`,
    `👤 <b>Ism:</b> ${esc(data.name || '—')}`,
    `📞 <b>Telefon:</b> <code>${esc(data.phone || '—')}</code>`,
  ];
  if (data.age)        lines.push(`🎂 <b>Yosh:</b> ${esc(data.age)}`);
  if (data.level)      lines.push(`📚 <b>Yapon tili darajasi:</b> ${esc(data.level)}`);
  if (data.city)       lines.push(`🏙️ <b>Shahar:</b> ${esc(data.city)}`);
  if (data.message)    lines.push(`💬 <b>Xabar:</b>\n${esc(data.message)}`);

  lines.push('');
  lines.push(`🌐 <b>Sayt:</b> ${esc(data.lang || 'uz')} | ${esc(data.page || location.pathname)}`);
  lines.push(`🕒 <b>Vaqt (Toshkent):</b> ${esc(ts)}`);
  if (data.utm) lines.push(`🔗 <b>UTM:</b> ${esc(data.utm)}`);
  if (data.ref) lines.push(`↩️ <b>Referrer:</b> ${esc(data.ref)}`);

  return lines.join('\n');
}

/* -------------------- Public submit -------------------- */
async function submitLead(data) {
  const msg = buildLeadMessage(data);
  const targets = [TG_GROUP_ID, ...TG_ADMIN_IDS];
  const results = await Promise.allSettled(targets.map(id => tgSend(id, msg)));
  const okCount = results.filter(r => r.status === 'fulfilled' && r.value === true).length;
  return { ok: okCount > 0, total: targets.length, delivered: okCount };
}

/* -------------------- Modal logic -------------------- */
const APPLY_PRESETS = {
  job: {
    title: { uz: "🇯🇵 Yaponiyada ishga joylashish", ru: "🇯🇵 Трудоустройство в Японии", jp: "🇯🇵 日本での就職申込" },
    sub:   { uz: "Tokutei Ginou tizimi orqali to'g'ridan-to'g'ri yapon kompaniyasiga.", ru: "Прямое трудоустройство через систему Tokutei Ginou.", jp: "特定技能制度による直接就職。" },
    needLevel: true
  },
  course: {
    title: { uz: "📚 Yapon tili + Tokutei Ginou kursi", ru: "📚 Курс японского + Tokutei Ginou", jp: "📚 日本語＋特定技能コース" },
    sub:   { uz: "Boshlangichdan JFT-Basic / JLPT N4 darajasiga.", ru: "С нуля до уровня JFT-Basic / JLPT N4.", jp: "ゼロからJFT-Basic / JLPT N4まで。" },
    needLevel: true
  },
  zero: {
    title: { uz: "🌱 Yapon tili — noldan", ru: "🌱 Японский язык — с нуля", jp: "🌱 日本語ゼロから" },
    sub:   { uz: "Tajribali ustozlar bilan birinchi qadam.", ru: "Первый шаг с опытными преподавателями.", jp: "経験豊富な先生と一緒に最初の一歩。" },
    needLevel: false
  },
  learn: {
    title: { uz: "❓ Yapon tilini o'rganmoqchimisiz?", ru: "❓ Хотите изучать японский?", jp: "❓ 日本語を学びたいですか？" },
    sub:   { uz: "Bepul konsultatsiya — sizga eng mos darsni tanlaymiz.", ru: "Бесплатная консультация — подберём подходящий курс.", jp: "無料相談 — あなたに最適なコースをご提案します。" },
    needLevel: false
  }
};

function openApply(intentKey) {
  const lang = (window.currentLang || document.documentElement.lang || 'uz');
  const preset = APPLY_PRESETS[intentKey] || APPLY_PRESETS.learn;
  const m = document.getElementById('applyModal');
  if (!m) return;
  m.dataset.intent = intentKey;
  document.getElementById('applyTitle').textContent = preset.title[lang] || preset.title.uz;
  document.getElementById('applySub').textContent   = preset.sub[lang]   || preset.sub.uz;

  // Show / hide JP-level select
  const lvlWrap = document.getElementById('applyLevelWrap');
  if (lvlWrap) lvlWrap.style.display = preset.needLevel ? 'block' : 'none';

  m.classList.add('show');
  document.body.style.overflow = 'hidden';
  setTimeout(() => { const f = m.querySelector('input[name=name]'); if (f) f.focus(); }, 250);
}

function closeApply() {
  const m = document.getElementById('applyModal');
  if (!m) return;
  m.classList.remove('show');
  document.body.style.overflow = '';
}

/* Form submit handler */
async function handleApplySubmit(e) {
  e.preventDefault();
  const form = e.target;
  const btn = form.querySelector('button[type=submit]');
  const status = document.getElementById('applyStatus');
  const intent = document.getElementById('applyModal').dataset.intent || 'learn';
  const lang = window.currentLang || 'uz';
  const presetTitle = (APPLY_PRESETS[intent] && APPLY_PRESETS[intent].title[lang]) || intent;

  const data = {
    intent: presetTitle,
    name:   form.name.value.trim(),
    phone:  form.phone.value.trim(),
    age:    form.age ? form.age.value.trim() : '',
    level:  form.level ? form.level.value : '',
    city:   form.city ? form.city.value.trim() : '',
    message: form.message ? form.message.value.trim() : '',
    lang:   lang,
    page:   location.pathname + location.hash,
    utm:    location.search || '',
    ref:    document.referrer || ''
  };

  if (!data.name || !data.phone) {
    status.textContent = "⚠️ Iltimos, ism va telefon raqamingizni kiriting.";
    status.style.color = '#C9111A';
    return;
  }

  btn.disabled = true;
  const orig = btn.textContent;
  btn.textContent = '⏳ Yuborilmoqda...';
  status.textContent = '';

  const result = await submitLead(data);

  if (result.ok) {
    status.style.color = '#1a7f37';
    status.innerHTML = `✅ Arizangiz qabul qilindi! Tez orada bog'lanamiz.<br><small style="color:#666">(${result.delivered}/${result.total} kanalga yetkazildi)</small>`;
    form.reset();
    // Track conversion (Google Analytics if present)
    if (typeof gtag === 'function') gtag('event', 'lead_submit', { intent });
    setTimeout(closeApply, 2800);
  } else {
    status.style.color = '#C9111A';
    status.textContent = "⚠️ Xatolik yuz berdi. Iltimos, +998 97 275 60 50 raqamiga qo'ng'iroq qiling yoki @yaponmalaka ga yozing.";
    btn.disabled = false;
    btn.textContent = orig;
  }
}

/* -------------------- Init on DOM ready -------------------- */
document.addEventListener('DOMContentLoaded', () => {
  // Wire all data-apply triggers
  document.querySelectorAll('[data-apply]').forEach(el => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      openApply(el.getAttribute('data-apply'));
    });
  });

  // Modal close handlers
  const m = document.getElementById('applyModal');
  if (m) {
    m.addEventListener('click', (e) => { if (e.target === m) closeApply(); });
    const x = m.querySelector('.modal-close');
    if (x) x.addEventListener('click', closeApply);
    const f = m.querySelector('form');
    if (f) f.addEventListener('submit', handleApplySubmit);
  }
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeApply(); });
});

window.openApply = openApply;
window.submitLead = submitLead;
