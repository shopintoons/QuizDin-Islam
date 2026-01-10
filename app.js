// app.js
const $ = (id) => document.getElementById(id);

const state = {
  homeLevel: "facile",
  category: null,
  listLevel: "facile",
  quizzes: [],        // computed quizzes for current category & level
  activeQuiz: null,   // {id, category, level, index, questions[]}
  currentIndex: 0,
  score: 0,
  locked: false,
  avgPercent: null,
};

// Sections
const home = $("home");
const categories = $("categories");
const quizlist = $("quizlist");
const quiz = $("quiz");
const result = $("result");

const crumbs = $("crumbs");

// Home elements
const categoryGrid = $("categoryGrid");
const allCategoryGrid = $("allCategoryGrid");
const featuredGrid = $("featuredGrid");
const seeAllBtn = $("seeAllBtn");

// Quizlist elements
const quizlistTitle = $("quizlistTitle");
const quizCountLine = $("quizCountLine");
const quizGrid = $("quizGrid");

// Player elements
const progressPill = $("progressPill");
const metaLine = $("metaLine");
const questionText = $("questionText");
const answersEl = $("answers");
const explanationBox = $("explanationBox");
const explanationText = $("explanationText");
const nextBtn = $("nextBtn");
const quitBtn = $("quitBtn");

// Result elements
const scorePercent = $("scorePercent");
const scoreLine = $("scoreLine");
const avgPercent = $("avgPercent");
const resultMsg = $("resultMsg");
const restartBtn = $("restartBtn");
const backToListBtn = $("backToListBtn");
const backHomeBtn = $("backHomeBtn");

// Nav buttons
const backHome1 = $("backHome1");
const backHome2 = $("backHome2");

// Newsletter
const newsletterFreq = $("newsletterFreq");
const emailInput = $("emailInput");
const subscribeBtn = $("subscribeBtn");
const subscribeMsg = $("subscribeMsg");

// Data
const ALL = Array.isArray(window.QUIZ_QUESTIONS) ? window.QUIZ_QUESTIONS : [];

const CATEGORY_ICONS = {
  "Coran": "📖",
  "Piliers": "🧱",
  "Pratiques": "🕌",
  "Ramadan": "🌙",
  "Hajj": "🕋",
  "Prophètes": "👤",
  "Vocabulaire": "🧠",
  "Histoire": "📜"
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

function show(section) {
  [home, categories, quizlist, quiz, result].forEach(s => s.classList.add("hidden"));
  section.classList.remove("hidden");
  renderCrumbs();
}

function renderCrumbs() {
  const parts = [];
  parts.push("Accueil");

  if (state.category) parts.push(state.category);
  if (isVisible(quizlist)) parts.push(`Liste (${capitalize(state.listLevel)})`);
  if (isVisible(quiz) && state.activeQuiz) parts.push(`Quiz #${state.activeQuiz.index + 1}`);
  if (isVisible(result)) parts.push("Score");

  crumbs.innerHTML = parts.map(p => `<span class="crumb">${escapeHtml(p)}</span>`).join("");
}

function isVisible(el){ return !el.classList.contains("hidden"); }

function unique(arr){ return [...new Set(arr)]; }

function capitalize(s) {
  return (s || "").charAt(0).toUpperCase() + (s || "").slice(1);
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function shuffle(array) {
  const a = [...array];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function chunk(array, size) {
  const out = [];
  for (let i=0;i<array.length;i+=size) out.push(array.slice(i, i+size));
  return out;
}

function getCategories() {
  return unique(ALL.map(q => q.category)).sort((a,b)=>a.localeCompare(b,"fr"));
}

function buildQuizzesFor(category, level) {
  const filtered = ALL.filter(q => q.category === category && q.level === level);
  const chunks = chunk(shuffle(filtered), 20);
  // Only keep full quizzes of 20 questions
  const full = chunks.filter(c => c.length === 20);
  // If none full, fall back to same level any category
  if (full.length === 0) {
    const fallback = ALL.filter(q => q.level === level);
    const fchunks = chunk(shuffle(fallback), 20).filter(c => c.length === 20);
    return fchunks.map((qs, idx) => ({
      id: `${level}-${slug(category)}-${idx+1}`,
      category,
      level,
      index: idx,
      questions: qs
    }));
  }
  return full.map((qs, idx) => ({
    id: `${level}-${slug(category)}-${idx+1}`,
    category,
    level,
    index: idx,
    questions: qs
  }));
}

function slug(s){
  return String(s).toLowerCase()
    .normalize("NFD").replace(/\p{Diacritic}/gu,"")
    .replace(/[^a-z0-9]+/g,"-").replace(/(^-|-$)/g,"");
}

function goHome(){
  state.category = null;
  show(home);
}

function goCategories(){
  state.category = null;
  renderAllCategories();
  show(categories);
}

function openCategory(cat){
  state.category = cat;
  state.listLevel = state.homeLevel || "facile";
  renderQuizList();
  show(quizlist);
}

function renderCategoryCards(targetEl, onClick){
  const cats = getCategories();
  targetEl.innerHTML = "";
  cats.forEach(cat => {
    const icon = CATEGORY_ICONS[cat] || "📚";
    const btn = document.createElement("button");
    btn.className = "cardbtn";
    btn.dataset.category = cat;
btn.style.setProperty("--accent", CATEGORY_COLORS[cat] || "#6C4BFF");
    btn.innerHTML = `
      <div class="badgeNum">${icon}</div>
      <div class="cardtitle">${escapeHtml(cat)}</div>
      <div class="cardsub">Quiz par niveaux • séries de 20</div>
    `;
    btn.addEventListener("click", ()=>onClick(cat));
    targetEl.appendChild(btn);
  });
}

function renderHome(){
  // Home level pills
  document.querySelectorAll("[data-home-level]").forEach(b=>{
    b.classList.toggle("active", b.dataset.homeLevel === state.homeLevel);
    b.addEventListener("click", ()=>{
      state.homeLevel = b.dataset.homeLevel;
      document.querySelectorAll("[data-home-level]").forEach(x=>x.classList.toggle("active", x.dataset.homeLevel === state.homeLevel));
      renderFeatured();
    });
  });

  renderCategoryCards(categoryGrid, openCategory);
  renderFeatured();
}

function renderAllCategories(){
  renderCategoryCards(allCategoryGrid, openCategory);
}

function renderFeatured(){
  // Pick 4 featured items: (category, level) pairs that likely have enough questions
  const picks = [
    {category:"Coran", level: state.homeLevel},
    {category:"Piliers", level: state.homeLevel},
    {category:"Prophètes", level: state.homeLevel},
    {category:"Vocabulaire", level: state.homeLevel},
  ];
  featuredGrid.innerHTML = "";
  picks.forEach((p, idx)=>{
    const icon = CATEGORY_ICONS[p.category] || "⭐";
    const btn = document.createElement("button");
    btn.className = "cardbtn";
    btn.innerHTML = `
      <div class="badgeNum">${icon}</div>
      <div class="cardtitle">${escapeHtml(p.category)} • ${capitalize(p.level)}</div>
      <div class="cardsub">Commencer directement →</div>
    `;
    btn.addEventListener("click", ()=>{
      state.category = p.category;
      state.listLevel = p.level;
      renderQuizList();
      show(quizlist);
    });
    featuredGrid.appendChild(btn);
  });
}

function renderQuizList(){
  if (!state.category) return;
  quizlistTitle.textContent = `Quiz ${state.category}`;

  // tabs
  document.querySelectorAll(".tab").forEach(t=>{
    t.classList.toggle("active", t.dataset.level === state.listLevel);
    t.onclick = () => {
      state.listLevel = t.dataset.level;
      document.querySelectorAll(".tab").forEach(x=>x.classList.toggle("active", x.dataset.level === state.listLevel));
      renderQuizList();
    };
  });

  state.quizzes = buildQuizzesFor(state.category, state.listLevel);
  quizCountLine.textContent = `${state.quizzes.length} quiz disponibles • 20 questions • Niveau ${capitalize(state.listLevel)}`;

  quizGrid.innerHTML = "";
  if (state.quizzes.length === 0){
    quizGrid.innerHTML = `<div class="muted">Pas assez de questions pour ce niveau/catégorie. Ajoute des questions dans questions.js.</div>`;
    return;
  }

  state.quizzes.forEach((qz, i)=>{
    const card = document.createElement("div");
    card.className = "quizcard";
    const icon = CATEGORY_ICONS[qz.category] || "📚";
    card.innerHTML = `
      <div class="quizcardTop">
        <div class="quizNo">#${i+1}</div>
        <div class="muted small" style="font-weight:900">${icon} ${escapeHtml(qz.category)}</div>
      </div>
      <div class="quiztitle">${capitalize(qz.level)} • 20 questions</div>
      <div class="quizmeta">Clique pour commencer</div>
    `;
    card.addEventListener("click", ()=>startQuiz(i));
    quizGrid.appendChild(card);
  });
}

function startQuiz(index){
  const qz = state.quizzes[index];
  state.activeQuiz = qz;
  state.currentIndex = 0;
  state.score = 0;
  state.locked = false;
  state.avgPercent = null;

  renderQuestion();
  show(quiz);
}

function renderQuestion(){
  state.locked = false;
  explanationBox.classList.add("hidden");
  nextBtn.classList.add("hidden");
  answersEl.innerHTML = "";

  const q = state.activeQuiz.questions[state.currentIndex];
  progressPill.textContent = `QUESTION ${state.currentIndex + 1} / 20`;
  metaLine.textContent = `${capitalize(state.activeQuiz.level)} • ${state.activeQuiz.category} • Quiz #${state.activeQuiz.index + 1}`;
  questionText.textContent = q.q;

  const letters = ["A","B","C","D"];
  q.options.forEach((opt, idx)=>{
    const btn = document.createElement("button");
    btn.className = "answer";
    btn.innerHTML = `<div class="badge">${letters[idx]}</div><div>${escapeHtml(opt)}</div>`;
    btn.addEventListener("click", ()=>onAnswer(idx, btn));
    answersEl.appendChild(btn);
  });
}

function onAnswer(chosenIndex, chosenBtn){
  if (state.locked) return;
  state.locked = true;

  const q = state.activeQuiz.questions[state.currentIndex];
  const allBtns = [...answersEl.querySelectorAll(".answer")];
  allBtns.forEach(b=>b.classList.add("disabled"));

  const correctBtn = allBtns[q.answerIndex];
  if (chosenIndex === q.answerIndex){
    state.score += 1;
    chosenBtn.classList.add("correct");
  } else {
    chosenBtn.classList.add("wrong");
    if (correctBtn) correctBtn.classList.add("correct");
  }

  explanationText.textContent = q.explain || "—";
  explanationBox.classList.remove("hidden");
  nextBtn.classList.remove("hidden");

  if (state.currentIndex === 19) nextBtn.textContent = "Voir le score →";
  else nextBtn.textContent = "Question suivante →";
}

function finish(){
  const percent = Math.round((state.score / 20) * 100);
  scorePercent.textContent = `${percent}%`;
  scoreLine.textContent = `Vous avez bien répondu à ${state.score} questions sur 20.`;

  if (state.avgPercent === null){
    const base = 74;
    const jitter = Math.floor(Math.random()*15)-7;
    state.avgPercent = Math.max(40, Math.min(92, base + jitter));
  }
  avgPercent.textContent = `${state.avgPercent}%`;

  let msg = "Bien joué !";
  if (percent < 40) msg = "Il va falloir réviser un peu…";
  else if (percent < 60) msg = "Pas mal ! Continue, tu progresses.";
  else if (percent < 80) msg = "Très bien !";
  else msg = "Excellent !";
  resultMsg.textContent = msg;

  show(result);
}

function subscribe(){
  const email = (emailInput.value || "").trim();
  if (!email || !email.includes("@") || !email.includes(".")){
    subscribeMsg.textContent = "Entre un email valide.";
    return;
  }
  const list = JSON.parse(localStorage.getItem("quizdin_newsletter") || "[]");
  const entry = { email, freq: newsletterFreq.value, ts: Date.now() };
  list.push(entry);
  localStorage.setItem("quizdin_newsletter", JSON.stringify(list));
  subscribeMsg.textContent = "Merci ! (enregistré sur ton appareil)";
  emailInput.value = "";
}

function boot(){
  // Buttons
  seeAllBtn.addEventListener("click", goCategories);
  backHome1.addEventListener("click", goHome);
  backHome2.addEventListener("click", goHome);

  quitBtn.addEventListener("click", ()=>{
    show(quizlist);
  });

  nextBtn.addEventListener("click", ()=>{
    if (state.currentIndex === 19){
      finish();
      return;
    }
    state.currentIndex += 1;
    renderQuestion();
  });

  restartBtn.addEventListener("click", ()=>{
    // restart same quiz
    if (!state.activeQuiz) return;
    startQuiz(state.activeQuiz.index);
  });

  backToListBtn.addEventListener("click", ()=>show(quizlist));
  backHomeBtn.addEventListener("click", goHome);

  subscribeBtn.addEventListener("click", subscribe);

  // Init home
  renderHome();
  show(home);
}

boot();
