let players = [];
let questions = [];
let currentTurn = 0;
let questionsAnswered = 0;
let usedQuestions = [];

const setupDiv = document.getElementById("setup");
const gameDiv = document.getElementById("game");
const resultsDiv = document.getElementById("results");
const playersForm = document.getElementById("players-form");
const playersListDiv = document.getElementById("players-list");
const addPlayerBtn = document.getElementById("add-player");
const playerTurnH2 = document.getElementById("player-turn");
const questionTextP = document.getElementById("question-text");
const categoryLabel = document.getElementById("category-label");
const nextBtn = document.getElementById("next-question");
const questionsCountP = document.getElementById("questions-count");
const restartBtn = document.getElementById("restart");
const mainContainer = document.getElementById("main-container");
// Cambiar el selector del botón de cerrar
const closeBtn = document.getElementById("end-game");

addPlayerBtn.addEventListener("click", () => {
  const wrapper = document.createElement("div");
  wrapper.className = "player-input";
  const input = document.createElement("input");
  input.type = "text";
  input.name = "player";
  input.placeholder = "Nombre del jugador";
  input.required = true;
  const removeBtn = document.createElement("button");
  removeBtn.type = "button";
  removeBtn.className = "remove-player";
  removeBtn.title = "Eliminar jugador";
  removeBtn.textContent = "🗑️";
  wrapper.appendChild(input);
  wrapper.appendChild(removeBtn);
  playersListDiv.appendChild(wrapper);
  updateRemoveButtons();
});

function updateRemoveButtons() {
  const wrappers = playersListDiv.querySelectorAll(".player-input");
  const removeBtns = playersListDiv.querySelectorAll(".remove-player");
  if (wrappers.length > 2) {
    removeBtns.forEach((btn) => (btn.style.display = "inline-block"));
  } else {
    removeBtns.forEach((btn) => (btn.style.display = "none"));
  }
}

playersListDiv.addEventListener("click", function (e) {
  if (e.target.classList.contains("remove-player")) {
    const wrappers = playersListDiv.querySelectorAll(".player-input");
    if (wrappers.length > 2) {
      e.target.parentElement.remove();
      updateRemoveButtons();
    }
  }
});

playersForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const inputs = playersListDiv.querySelectorAll('input[name="player"]');
  players = Array.from(inputs)
    .map((i) => i.value.trim())
    .filter(Boolean);
  if (players.length < 2) {
    alert("Debes ingresar al menos 2 participantes.");
    return;
  }
  setupDiv.style.display = "none";
  questions = [];
  let fetchError = false;
  try {
    await fetchQuestions();
  } catch (err) {
    fetchError = true;
  }
  if (!Array.isArray(questions) || questions.length === 0) {
    setupDiv.style.display = "";
    alert(
      fetchError
        ? "No se pudieron cargar las preguntas. Error en el servidor."
        : "No hay preguntas disponibles."
    );
    return;
  }
  currentTurn = 0;
  questionsAnswered = 0;
  usedQuestions = [];
  showQuestion();
  gameDiv.style.display = "";
  closeBtn.style.display = "";
});

async function fetchQuestions() {
  const res = await fetch("http://localhost:5005/api/trueties");

  if (!res.ok) throw new Error("Error de red");
  let allQuestions = await res.json();
  if (!Array.isArray(allQuestions)) allQuestions = [];
  questions = allQuestions;
  const question1 = allQuestions.find(
    (q) => q._id === "680cbc93d0649b1e889b157c"
  );
  const question2 = allQuestions.find(
    (q) => q._id === "680cbcb4d0649b1e889b157d"
  );

  if (question1 && question2) {
    questions = questions.filter(
      (q) => q._id !== question1._id && q._id !== question2._id
    );

    const insertPos1 = Math.min(
      Math.max(3, Math.floor(Math.random() * 8) + 3),
      questions.length
    );
    questions.splice(insertPos1, 0, question1);

    const insertPos2 = Math.min(
      Math.max(3, Math.floor(Math.random() * 8) + 3),
      questions.length
    );
    questions.splice(insertPos2, 0, question2);
  }
  shuffleArray(questions);
}

const alternatingBackgrounds = ["#2C4054", "#402C54"];
let bgIndex = 0;

function setAlternatingBackground() {
  bgIndex = (bgIndex + 1) % alternatingBackgrounds.length;
  document.body.style.background = alternatingBackgrounds[bgIndex];
}

let spicyInterval = Math.floor(Math.random() * 2) + 3; // 3 or 4
let spicyCountdown = spicyInterval;

function showQuestion() {
  if (questions.length === 0) {
    questionTextP.textContent = "No hay preguntas disponibles.";
    nextBtn.disabled = true;
    return;
  }
  let qIdx = -1;
  let spicyIdx = -1;
  let regularIdx = -1;
  for (let i = 0; i < questions.length; i++) {
    if (!usedQuestions.includes(i) && questions[i].category === "spicy") {
      spicyIdx = i;
      break;
    }
  }
  for (let i = 0; i < questions.length; i++) {
    if (!usedQuestions.includes(i) && questions[i].category !== "spicy") {
      regularIdx = i;
      break;
    }
  }
  if (spicyCountdown === 0 && spicyIdx !== -1) {
    qIdx = spicyIdx;
    spicyInterval = Math.floor(Math.random() * 2) + 3; // 3 or 4
    spicyCountdown = spicyInterval;
  } else if (regularIdx !== -1) {
    qIdx = regularIdx;
    spicyCountdown--;
  } else if (spicyIdx !== -1) {
    qIdx = spicyIdx;
  } else {
    questionTextP.textContent = "¡Se han acabado las preguntas!";
    nextBtn.disabled = true;
    return;
  }
  const player = players[currentTurn];
  let q = questions[qIdx];
  let questionStr = q.question;
  if (questionStr.includes("[user]")) {
    const others = players.filter((p, idx) => idx !== currentTurn);
    const other = others[Math.floor(Math.random() * others.length)];
    questionStr = questionStr.replace("[user]", other);
  }
  playerTurnH2.textContent = player + ",";
  questionTextP.textContent = questionStr;
  setAlternatingBackground();
  usedQuestions.push(qIdx);
  nextBtn.disabled = false;
}

function getNextQuestionIdx() {
  for (let i = 0; i < questions.length; i++) {
    if (!usedQuestions.includes(i)) return i;
  }
  return -1;
}

nextBtn.addEventListener("click", () => {
  questionsAnswered++;
  currentTurn = (currentTurn + 1) % players.length;
  showQuestion();
});

closeBtn.addEventListener("click", () => {
  gameDiv.style.display = "none";
  resultsDiv.style.display = "";
  questionsCountP.textContent = `Preguntas respondidas: ${questionsAnswered}`;
});

restartBtn.addEventListener("click", () => {
  resultsDiv.style.display = "none";
  setupDiv.style.display = "";
  const wrappers = playersListDiv.querySelectorAll(".player-input");
  wrappers.forEach((wrapper, idx) => {
    const input = wrapper.querySelector('input[name="player"]');
    if (idx > 1) wrapper.remove();
    else input.value = "";
  });
  updateRemoveButtons();
  closeBtn.style.display = "none";
});

closeBtn.style.display = "none";
