/* global QUESTIONS */

/* ====== CONFIG ====== */
const CATEGORY_ICONS = {
  "Coran": "📖",
  "Piliers": "🧱",
  "Pratiques": "🕌",
  "Ramadan": "🌙",
  "Hajj": "🕋",
  "Prophètes": "👤",
  "Vocabulaire": "🧠",
  "Histoire": "📜",
};

const CATEGORY_COLORS = {
  "Coran": "#2D6A4F",
  "Piliers": "#6C4BFF",
  "Pratiques": "#1D4ED8",
  "Ramadan": "#8B5CF6",
  "Hajj": "#D97706",
  "Prophètes": "#0EA5E9",
  "Vocabulaire": "#10B981",
  "Histoire": "#F43F5E"
};

const QUIZ_SIZE = 20;

/* ====== HELPERS ====== */
const $ = (id) => document.getElementById(id);

function show(section){
  [home, categories, quizList, quiz, result].forEach(s => s.classList.add("hidden"));
  section.classList.remove("hidden");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function normalizeLevel(lvl){
  return String(lvl || "").trim().toLowerCase(); // "facile"|"moyen"|"difficile"
}
function displayLevel(lvl){
  const n = normalizeLevel(lvl);
  if(!n) return "";
  return n.charAt(0).toUpperCase() + n.slice(1);
}

function chunk(arr, size){
  const out = [];
  for(let i=0; i<arr.length; i+=size) out.push(arr.slice(i, i+size));
  return out;
}

/* ====== DOM ====== */
const home = $("home");
const categories = $("categories");
const quizList = $("quizList");
const quiz = $("quiz");
const result = $("result");

const featuredGrid = $("featuredGrid");
const categoryGrid = $("categoryGrid");
const quizGrid = $("quizGrid");

const quizListTitle = $("quizListTitle");
const quizListMeta = $("quizListMeta");

const progressPill = $("progressPill");
const metaLine = $("metaLine");
const questionText = $("questionText");
const answersEl = $("answers");
const explainBox = $("explainBox");
const nextBtn = $("nextBtn");

const quitBtn = $("quitBtn");
const retryBtn = $("retryBtn");
const scorePercent = $("scorePercent");
const scoreGood = $("scoreGood");

/* ====== DATA: build quizzes from question-bank ====== */
/**
 * Accepts either:
 *  - window.QUESTIONS = quiz packs
 *  - window.QUIZ_QUESTIONS = question bank
 *  - window.QUESTIONS = question bank (your case)
 */
function detectSource(){
  // 1) If your questions.js used window.QUIZ_QUESTIONS
  if (Array.isArray(window.QUIZ_QUESTIONS)) return window.QUIZ_QUESTIONS;

  // 2) If global QUESTIONS exists
  if (Array.isArray(window.QUESTIONS)) return window.QUESTIONS;

  // 3) If global QUESTIONS constant injected
  if (Array.isArray(typeof QUESTIONS !== "undefined" ? QUESTIONS : null)) return QUESTIONS;

  return [];
}

function isQuizPack(obj){
  return obj && typeof obj === "object" && Array.isArray(obj.questions);
}
function isSingleQuestion(obj){
  return obj && typeof obj === "object" && typeof obj.q === "string" && Array.isArray(obj.options);
}

function buildQuizzesFromQuestions(questionBank){
  // group by category + level(normalized)
  const map = new Map();

  questionBank.forEach((q) => {
    if(!isSingleQuestion(q)) return;

    const cat = String(q.category || "").trim();
    const lvlN = normalizeLevel(q.level);
    if(!cat || !lvlN) return;

    const key = `${cat}__${lvlN}`;
    if(!map.has(key)) map.set(key, []);
    map.get(key).push(q);
  });

  const quizzes = [];

  for (const [key, arr] of map.entries()){
    const [cat, lvlN] = key.split("__");
    const lvlD = displayLevel(lvlN);

    // On fait des séries de 20 (on garde l’ordre d’origine)
    const packs = chunk(arr, QUIZ_SIZE);

    packs.forEach((pack, idx) => {
      // si tu veux STRICT 20 seulement, décommente la ligne suivante :
      // if (pack.length < QUIZ_SIZE) return;

      quizzes.push({
        category: cat,
        level: lvlD,              // "Facile" / "Moyen" / "Difficile"
        levelNorm: lvlN,          // "facile" / "moyen" / "difficile"
        index: idx + 1,
        questions: pack
      });
    });
  }

  // Tri stable : catégorie puis niveau puis index
  const levelOrder = { facile: 1, moyen: 2, difficile: 3 };
  quizzes.sort((a,b) => {
    if(a.category !== b.category) return a.category.localeCompare(b.category, "fr");
    const ao = levelOrder[a.levelNorm] || 99;
    const bo = levelOrder[b.levelNorm] || 99;
    if(ao !== bo) return ao - bo;
    return (a.index || 0) - (b.index || 0);
  });

  return quizzes;
}

const SOURCE = detectSource();
const QUIZZES = (SOURCE.length && isQuizPack(SOURCE[0]))
  ? SOURCE
  : buildQuizzesFromQuestions(SOURCE);

/* ====== STATE ====== */
const state = {
  level: "Facile",
  category: null,
  activeQuiz: null,
  currentIndex: 0,
  score: 0,
  locked: false
};

/* ====== LOGIC ====== */
function getCategories(){
  const set = new Set();
  QUIZZES.forEach(qz => set.add(qz.category));
  return Array.from(set);
}

function quizzesBy(category, levelDisplay){
  const lvlN = normalizeLevel(levelDisplay);
  return QUIZZES.filter(qz =>
    qz.category === category &&
    normalizeLevel(qz.level || qz.levelNorm) === lvlN
  );
}

function renderFeatured(){
  featuredGrid.innerHTML = "";
  const cats = getCategories().slice(0, 4);
  cats.forEach(cat => {
    featuredGrid.appendChild(makeCategoryCard(cat, true));
  });
}

function makeCategoryCard(cat, isFeatured){
  const btn = document.createElement("button");
  btn.className = "cardbtn";
  btn.style.setProperty("--accent", CATEGORY_COLORS[cat] || "#6C4BFF");

  const icon = CATEGORY_ICONS[cat] || "❓";
  btn.innerHTML = `
    <div class="badgeNum">${icon}</div>
    <div class="cardtitle">${cat}${isFeatured ? " • " + state.level : ""}</div>
    <div class="cardsub">${isFeatured ? "Commencer directement →" : "Quiz par niveaux • séries de 20"}</div>
  `;

  btn.addEventListener("click", () => {
    state.category = cat;
    openQuizList(cat);
  });

  return btn;
}

function renderCategories(){
  categoryGrid.innerHTML = "";
  getCategories().forEach(cat => {
    categoryGrid.appendChild(makeCategoryCard(cat, false));
  });
}

function openQuizList(cat){
  state.category = cat;
  quizListTitle.textContent = `Quiz ${cat}`;
  quizListMeta.textContent = `• ${QUIZ_SIZE} questions • Niveau ${state.level}`;

  document.documentElement.style.setProperty("--accent", CATEGORY_COLORS[cat] || "#2a8c7f");

  document.querySelectorAll(".tab").forEach(t => {
    t.classList.toggle("active", t.dataset.level === state.level);
  });

  renderQuizGrid();
  show(quizList);
}

function renderQuizGrid(){
  quizGrid.innerHTML = "";

  const list = quizzesBy(state.category, state.level);
  quizListMeta.textContent = `${list.length} quiz disponibles • ${QUIZ_SIZE} questions • Niveau ${state.level}`;

  list.forEach((qz, i) => {
    const card = document.createElement("div");
    card.className = "quizcard";
    card.style.setProperty("--accent", CATEGORY_COLORS[state.category] || "#2a8c7f");

    card.innerHTML = `
      <div class="quizNo">#${(qz.index ?? (i+1))}</div>
      <div class="quizmeta">${CATEGORY_ICONS[state.category] || "❓"} <b>${state.category}</b></div>
      <div class="quiztitle">${state.level} • ${QUIZ_SIZE} questions</div>
      <div class="quizmeta">Clique pour commencer</div>
    `;

    card.addEventListener("click", () => startQuiz(qz, i));
    quizGrid.appendChild(card);
  });
}

function startQuiz(qz, indexFallback){
  state.activeQuiz = {
    ...qz,
    index: (qz.index ?? (indexFallback + 1))
  };
  state.currentIndex = 0;
  state.score = 0;
  state.locked = false;

  renderQuestion();
  show(quiz);
}

function renderQuestion(){
  state.locked = false;
  explainBox.classList.add("hidden");
  nextBtn.classList.add("hidden");
  answersEl.innerHTML = "";

  const accent = (CATEGORY_COLORS[state.activeQuiz.category] || "#2a8c7f");
  document.documentElement.style.setProperty("--accent", accent);

  const q = state.activeQuiz.questions[state.currentIndex];

  progressPill.textContent = `QUESTION ${state.currentIndex + 1} / ${QUIZ_SIZE}`;
  metaLine.textContent = `${state.activeQuiz.level} • ${state.activeQuiz.category} • Quiz #${state.activeQuiz.index}`;
  questionText.textContent = q.q;

  const letters = ["A","B","C","D"];
  q.options.forEach((opt, idx) => {
    const btn = document.createElement("button");
    btn.className = "answer";
    btn.innerHTML = `<span class="badge">${letters[idx]}</span> <span>${opt}</span>`;
    btn.addEventListener("click", () => chooseAnswer(idx));
    answersEl.appendChild(btn);
  });
}

function chooseAnswer(chosenIndex){
  if(state.locked) return;
  state.locked = true;

  const q = state.activeQuiz.questions[state.currentIndex];

  // IMPORTANT: ton fichier utilise answerIndex (et parfois certains utilisent answer)
  const correct = (typeof q.answerIndex === "number")
    ? q.answerIndex
    : q.answer;

  const buttons = Array.from(answersEl.querySelectorAll(".answer"));
  buttons.forEach(b => b.classList.add("disabled"));

  if(chosenIndex === correct){
    state.score += 1;
    buttons[chosenIndex].classList.add("correct");
  }else{
    buttons[chosenIndex].classList.add("wrong");
    if (buttons[correct]) buttons[correct].classList.add("correct");
  }

  explainBox.textContent = q.explain || "Explication à venir.";
  explainBox.classList.remove("hidden");
  nextBtn.classList.remove("hidden");

  if(state.currentIndex === (QUIZ_SIZE - 1)){
    nextBtn.textContent = "Voir mon score →";
  }else{
    nextBtn.textContent = "Question suivante →";
  }
}

function next(){
  if(state.currentIndex === (QUIZ_SIZE - 1)){
    showResult();
    return;
  }
  state.currentIndex += 1;
  renderQuestion();
}

function showResult(){
  const percent = Math.round((state.score / QUIZ_SIZE) * 100);
  scorePercent.textContent = `${percent}%`;
  scoreGood.textContent = `${state.score}`;
  show(result);
}

/* ====== EVENTS ====== */

// level pills (home)
document.querySelectorAll(".pillbtn[data-level]").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".pillbtn[data-level]").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    state.level = btn.dataset.level; // "Facile" / "Moyen" / "Difficile"
    renderFeatured();
  });
});

$("btnCategories").addEventListener("click", () => {
  renderCategories();
  show(categories);
});

$("backHome1").addEventListener("click", () => show(home));
$("backHome2").addEventListener("click", () => show(home));
$("backHome3").addEventListener("click", () => show(home));

document.querySelectorAll(".tab").forEach(t => {
  t.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach(x => x.classList.remove("active"));
    t.classList.add("active");
    state.level = t.dataset.level;
    renderQuizGrid();
  });
});

nextBtn.addEventListener("click", next);

quitBtn.addEventListener("click", () => {
  show(quizList);
});

retryBtn.addEventListener("click", () => {
  startQuiz(state.activeQuiz, state.activeQuiz.index - 1);
});

/* ====== INIT ====== */
renderFeatured();
show(home);

// Debug utile (tu peux supprimer après)
console.log("SOURCE length:", SOURCE.length);
console.log("QUIZZES length:", QUIZZES.length);
console.log("Categories:", getCategories());
