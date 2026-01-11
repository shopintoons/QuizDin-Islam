/* global QUESTIONS */

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

const $ = (id) => document.getElementById(id);

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

const state = {
  level: "Facile",
  category: null,
  activeQuiz: null,
  currentIndex: 0,
  score: 0,
  locked: false
};

function show(section){
  [home, categories, quizList, quiz, result].forEach(s => s.classList.add("hidden"));
  section.classList.remove("hidden");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function capitalize(s){ return (s || "").charAt(0).toUpperCase() + (s || "").slice(1); }

function getCategories(){
  const set = new Set();
  QUESTIONS.forEach(qz => set.add(qz.category));
  return Array.from(set);
}

function quizzesBy(category, level){
  return QUESTIONS.filter(qz => qz.category === category && qz.level === level);
}

function renderFeatured(){
  featuredGrid.innerHTML = "";
  // 4 cartes "incontournables" = 4 catégories si possible
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
  quizListMeta.textContent = `• 20 questions • Niveau ${state.level}`;

  // Accent global par catégorie pour l'écran quiz-list
  document.documentElement.style.setProperty("--accent", CATEGORY_COLORS[cat] || "#2a8c7f");

  // tabs active
  document.querySelectorAll(".tab").forEach(t => {
    t.classList.toggle("active", t.dataset.level === state.level);
  });

  renderQuizGrid();
  show(quizList);
}

function renderQuizGrid(){
  quizGrid.innerHTML = "";

  const list = quizzesBy(state.category, state.level);
  quizListMeta.textContent = `${list.length} quiz disponibles • 20 questions • Niveau ${state.level}`;

  list.forEach((qz, i) => {
    const card = document.createElement("div");
    card.className = "quizcard";
    card.style.setProperty("--accent", CATEGORY_COLORS[state.category] || "#2a8c7f"); // <-- COLORÉ

    card.innerHTML = `
      <div class="quizNo">#${(qz.index ?? (i+1))}</div>
      <div class="quizmeta">${CATEGORY_ICONS[state.category] || "❓"} <b>${state.category}</b></div>
      <div class="quiztitle">${state.level} • 20 questions</div>
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
  progressPill.textContent = `QUESTION ${state.currentIndex + 1} / 20`;
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
  const correct = q.answer; // index 0..3

  const buttons = Array.from(answersEl.querySelectorAll(".answer"));
  buttons.forEach(b => b.classList.add("disabled"));

  if(chosenIndex === correct){
    state.score += 1;
    buttons[chosenIndex].classList.add("correct");
  }else{
    buttons[chosenIndex].classList.add("wrong");
    buttons[correct].classList.add("correct");
  }

  explainBox.textContent = q.explain || "Explication à venir.";
  explainBox.classList.remove("hidden");
  nextBtn.classList.remove("hidden");

  if(state.currentIndex === 19){
    nextBtn.textContent = "Voir mon score →";
  }else{
    nextBtn.textContent = "Question suivante →";
  }
}

function next(){
  if(state.currentIndex === 19){
    showResult();
    return;
  }
  state.currentIndex += 1;
  renderQuestion();
}

function showResult(){
  const percent = Math.round((state.score / 20) * 100);
  scorePercent.textContent = `${percent}%`;
  scoreGood.textContent = `${state.score}`;
  show(result);
}

/* EVENTS */

// level pills (home)
document.querySelectorAll(".pillbtn[data-level]").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".pillbtn[data-level]").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    state.level = btn.dataset.level;
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

/* INIT */
renderFeatured();
show(home);
