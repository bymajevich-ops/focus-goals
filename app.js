const storageKey = "focus-goals-v1";
const defaults = [
  { id: crypto.randomUUID(), title: "Прочитать 2 книги", done: 1, target: 2, unit: "книги", color: "violet" },
  { id: crypto.randomUUID(), title: "Тренироваться регулярно", done: 3, target: 12, unit: "тренировок", color: "green" }
];
let goals = JSON.parse(localStorage.getItem(storageKey) || "null") || defaults;
const $ = (selector) => document.querySelector(selector);
const save = () => localStorage.setItem(storageKey, JSON.stringify(goals));
const plural = (number, unit) => `${number} из ${unit}`;

function updateSummary() {
  const target = goals.reduce((sum, goal) => sum + goal.target, 0);
  const done = goals.reduce((sum, goal) => sum + goal.done, 0);
  const percent = target ? Math.round((done / target) * 100) : 0;
  $("#totalProgress").textContent = `${percent}%`;
  $("#totalBar").style.width = `${percent}%`;
  $("#goalCount").textContent = `${goals.length} ${goals.length === 1 ? "активная" : "активных"}`;
  $("#overviewText").textContent = goals.length ? `Уже сделано ${done} шагов из ${target}. Продолжай!` : "Добавь первую цель — начнём спокойно.";
}

function render() {
  const list = $("#goalList");
  list.innerHTML = "";
  if (!goals.length) list.innerHTML = '<div class="empty"><strong>Здесь появятся твои цели</strong>Начни с одной маленькой и понятной.</div>';
  goals.forEach((goal) => {
    const card = $("#goalTemplate").content.firstElementChild.cloneNode(true);
    const percent = Math.round((goal.done / goal.target) * 100);
    card.dataset.color = goal.color;
    card.querySelector("h3").textContent = goal.title;
    card.querySelector(".done-count").textContent = `${goal.done} / ${goal.target}`;
    card.querySelector(".percent").textContent = `${percent}%`;
    card.querySelector(".unit-label").textContent = plural(goal.target, goal.unit || "шагов");
    card.querySelector(".progress span").style.width = `${percent}%`;
    card.querySelector(".plus").onclick = () => changeProgress(goal.id, 1);
    card.querySelector(".minus").onclick = () => changeProgress(goal.id, -1);
    card.querySelector(".delete-button").onclick = () => { goals = goals.filter((item) => item.id !== goal.id); save(); render(); };
    list.append(card);
  });
  updateSummary();
}
function changeProgress(id, amount) {
  const goal = goals.find((item) => item.id === id);
  goal.done = Math.max(0, Math.min(goal.target, goal.done + amount));
  save(); render();
}
function openDialog() { $("#goalForm").reset(); $("#goalTarget").value = 7; $("#goalUnit").value = "дней"; $("#goalDialog").showModal(); }
$("#addGoal").onclick = openDialog; $("#addGoalTop").onclick = openDialog; $("#closeDialog").onclick = () => $("#goalDialog").close();
$("#goalForm").addEventListener("submit", (event) => { event.preventDefault(); const data = new FormData(event.currentTarget); goals.unshift({ id:crypto.randomUUID(), title:data.get("title").trim(), target:Number(data.get("target")), done:0, unit:data.get("unit").trim() || "шагов", color:data.get("color") }); save(); $("#goalDialog").close(); render(); });
$("#today").textContent = new Intl.DateTimeFormat("ru-RU", { weekday:"long", day:"numeric", month:"long" }).format(new Date());

const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition;
async function createGoalFromVoice(phrase) {
  const parsed = understandGoalRequest(phrase);
  goals.unshift({ id:crypto.randomUUID(), ...parsed, color:"green" }); save(); render();
  $("#voiceStatus").textContent = "Цель добавлена.";
}

function understandGoalRequest(phrase) {
  const raw = phrase.replace(/[.!,?]/g, "").replace(/\s+/g, " ").trim();
  const lower = raw.toLowerCase();
  const amount = lower.match(/(\d{1,4})\s*(книг[аи]?|раз[а]?|дн(?:ей|я|ь)?|урок(?:ов|а)?|шаг(?:ов|а)?|трениров(?:ок|ки)?|глав(?:ы|а)?)/i);
  const target = amount ? Number(amount[1]) : 1;
  const forms = { "книга":"книг", "книги":"книг", "книг":"книг", "раз":"раз", "раза":"раз", "дней":"дней", "дня":"дней", "день":"дней", "уроков":"уроков", "урока":"уроков", "шагов":"шагов", "шага":"шагов", "тренировок":"тренировок", "тренировки":"тренировок", "главы":"глав", "глава":"глав" };
  const unit = amount ? (forms[amount[2].toLowerCase()] || amount[2].toLowerCase()) : "шагов";
  let title = lower
    .replace(/^(я )?(хочу |хотел(?:а)? бы |можешь |пожалуйста |добавь |создай |сделай |нужно |надо )+/i, "")
    .replace(/^(добавить |создать )?(новую )?цель\s*/i, "")
    .replace(/\s+(за|в течение|до конца)\s+.+$/i, "")
    .replace(/\s+(можешь|пожалуйста|сделай|создай|добавь)\s*$/i, "")
    .trim();
  const action = title.match(/(прочитать|выучить|пройти|сделать|написать|ходить|тренироваться|бегать|заниматься)/i);
  if (!action && amount) title = `Сделать ${target} ${unit}`;
  if (!title) title = "Новая цель";
  title = title[0].toUpperCase() + title.slice(1);
  return { title, target, unit, done: Math.min(1, target) };
}
function openVoiceDialog() {
  $("#voiceText").textContent = "";
  $("#voiceStatus").textContent = Recognition ? "Нажми кнопку и скажи цель." : "На этом устройстве голосовой ввод недоступен.";
  $("#startVoice").disabled = !Recognition;
  $("#voiceDialog").showModal();
}
$("#voiceGoal").onclick = openVoiceDialog;
$("#closeVoiceDialog").onclick = () => { recognition?.abort(); $("#voiceDialog").close(); };
$("#startVoice").onclick = () => {
  if (!Recognition) return;
  recognition?.abort();
  recognition = new Recognition(); recognition.lang = "ru-RU"; recognition.interimResults = true; recognition.maxAlternatives = 1;
  $("#voiceStatus").textContent = "Слушаю…"; $("#startVoice").textContent = "Слушаю…"; $("#voiceOrb").classList.add("is-listening");
  recognition.onresult = (event) => { const phrase = [...event.results].map((result) => result[0].transcript).join(""); $("#voiceText").textContent = `«${phrase}»`; if (event.results[event.results.length - 1].isFinal) { createGoalFromVoice(phrase); $("#startVoice").textContent = "Сказать ещё"; } };
  recognition.onerror = () => { $("#voiceStatus").textContent = "Не удалось распознать фразу. Попробуй ещё раз."; $("#startVoice").textContent = "Повторить"; };
  recognition.onend = () => $("#voiceOrb").classList.remove("is-listening");
  recognition.start();
};
if ("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js");
render();
