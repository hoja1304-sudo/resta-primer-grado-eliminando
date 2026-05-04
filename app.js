const ASSETS = {
  correct: "./assets/bien2x.png",
  wrong: "./assets/como.png",
  objects: [
    "./assets/lapiz.png",
    "./assets/oveja.png",
    "./assets/cone.png",
    "./assets/pollito2.png"
  ]
};

const state = {
  familyMax: 19,
  minuend: 9,
  subtrahend: 5,
  answer: 4,
  removed: 0,
  selected: null,
  objectImage: ASSETS.objects[0],
  audio: true,
  dark: false,
  voice: null
};

const els = {
  menuScreen: document.querySelector("#menuScreen"),
  playScreen: document.querySelector("#playScreen"),
  familyLabel: document.querySelector("#familyLabel"),
  minuendNumber: document.querySelector("#minuendNumber"),
  subtrahendNumber: document.querySelector("#subtrahendNumber"),
  answerCard: document.querySelector("#answerCard"),
  removeStatus: document.querySelector("#removeStatus"),
  objectGrid: document.querySelector("#objectGrid"),
  answerGrid: document.querySelector("#answerGrid"),
  feedback: document.querySelector("#feedback"),
  feedbackImage: document.querySelector("#feedbackImage"),
  feedbackText: document.querySelector("#feedbackText"),
  audioButtons: [document.querySelector("#audioButtonMenu"), document.querySelector("#audioButtonPlay")],
  themeButtons: [document.querySelector("#themeButtonMenu"), document.querySelector("#themeButtonPlay")]
};

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function chooseObjectImage() {
  return ASSETS.objects[randomInt(0, ASSETS.objects.length - 1)];
}

function makeProblem() {
  const minuend = randomInt(1, state.familyMax);
  const subtrahend = randomInt(0, minuend);

  state.minuend = minuend;
  state.subtrahend = subtrahend;
  state.answer = minuend - subtrahend;
  state.removed = 0;
  state.selected = null;
  state.objectImage = chooseObjectImage();
}

function showScreen(name) {
  const play = name === "play";
  els.menuScreen.classList.toggle("is-active", !play);
  els.playScreen.classList.toggle("is-active", play);
}

function startFamily(max) {
  state.familyMax = max;
  showScreen("play");
  newRound();
  speak(`Familia de 1 a ${max}. Elimina los objetos que indica la resta y cuenta cuantos quedan.`);
}

function newRound() {
  makeProblem();
  renderProblem();
  renderAnswers();
  setFeedback("Primero elimina los objetos que indica la resta.", null);
}

function renderProblem() {
  els.familyLabel.textContent = `Familia de 1 a ${state.familyMax}`;
  els.minuendNumber.textContent = state.minuend;
  els.subtrahendNumber.textContent = state.subtrahend;
  els.answerCard.textContent = state.selected ?? "?";
  updateRemoveStatus();
  renderObjects();
}

function renderObjects() {
  els.objectGrid.innerHTML = "";

  for (let index = 0; index < state.minuend; index += 1) {
    const button = document.createElement("button");
    const image = document.createElement("img");
    button.className = "object-button";
    button.type = "button";
    button.setAttribute("aria-label", `Objeto ${index + 1}`);
    button.addEventListener("click", () => removeObject(button));
    image.src = state.objectImage;
    image.alt = "";
    image.style.animationDelay = `${Math.min(index * 22, 240)}ms`;
    button.appendChild(image);
    els.objectGrid.appendChild(button);
  }
}

function renderAnswers() {
  els.answerGrid.innerHTML = "";

  for (let number = 0; number <= state.familyMax; number += 1) {
    const button = document.createElement("button");
    button.className = "answer-bubble";
    button.type = "button";
    button.textContent = number;
    button.addEventListener("click", () => chooseAnswer(number, button));
    els.answerGrid.appendChild(button);
  }
}

function removeObject(button) {
  if (button.classList.contains("is-removed") || state.selected !== null) return;

  if (state.removed >= state.subtrahend) {
    setFeedback("Ya eliminaste los objetos necesarios. Ahora cuenta cuantos quedaron.", null);
    speak("Ya eliminaste los objetos necesarios. Ahora cuenta cuantos quedaron.");
    return;
  }

  button.classList.add("is-removed");
  button.disabled = true;
  state.removed += 1;
  updateRemoveStatus();

  if (state.removed === state.subtrahend) {
    setFeedback("Muy bien. Ahora selecciona cuantos objetos quedaron.", null);
    speak("Muy bien. Ahora selecciona cuantos objetos quedaron.");
  } else {
    const remaining = state.subtrahend - state.removed;
    setFeedback(`Faltan ${remaining} por eliminar.`, null);
  }
}

function updateRemoveStatus() {
  const remaining = state.subtrahend - state.removed;

  if (remaining <= 0) {
    els.removeStatus.textContent = "Cuenta los objetos que quedaron";
    return;
  }

  els.removeStatus.textContent = `Toca ${remaining} objeto${remaining === 1 ? "" : "s"} para eliminar`;
}

function chooseAnswer(number, selectedButton) {
  if (state.selected !== null) return;

  if (state.removed < state.subtrahend) {
    const remaining = state.subtrahend - state.removed;
    setFeedback(`Primero elimina ${remaining} objeto${remaining === 1 ? "" : "s"} mas.`, null);
    speak("Primero elimina los objetos que indica la resta.");
    return;
  }

  state.selected = number;
  els.answerCard.textContent = number;

  const buttons = [...document.querySelectorAll(".answer-bubble")];
  buttons.forEach((button) => {
    button.disabled = true;
    const value = Number(button.textContent);
    if (value === state.answer) button.classList.add("is-correct");
  });

  if (number === state.answer) {
    selectedButton.classList.add("is-correct");
    setFeedback("Muy bien. Esa es la respuesta correcta.", ASSETS.correct);
    speak("Muy bien. Esa es la respuesta correcta.");
  } else {
    selectedButton.classList.add("is-wrong");
    setFeedback(`Observa de nuevo. La respuesta correcta es ${state.answer}.`, ASSETS.wrong);
    speak(`Observa de nuevo. La respuesta correcta es ${state.answer}.`);
  }
}

function setFeedback(text, imageUrl) {
  els.feedbackText.textContent = text;
  els.feedback.classList.toggle("has-image", Boolean(imageUrl));

  if (imageUrl) {
    els.feedbackImage.src = imageUrl;
  } else {
    els.feedbackImage.removeAttribute("src");
  }
}

function chooseSpanishVoice() {
  if (!("speechSynthesis" in window)) return null;
  const voices = window.speechSynthesis.getVoices();
  const preferred = ["es-US", "es-MX", "es-419", "es-CR", "es-CO", "es"];
  return voices.find((voice) => preferred.some((tag) => voice.lang.toLowerCase() === tag.toLowerCase()))
    || voices.find((voice) => voice.lang.toLowerCase().startsWith("es"))
    || null;
}

function loadVoices() {
  state.voice = chooseSpanishVoice();
}

function speak(text) {
  if (!state.audio || !("speechSynthesis" in window)) return;
  if (!state.voice) loadVoices();
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = state.voice?.lang || "es-US";
  utterance.rate = 0.88;
  utterance.pitch = 1;
  if (state.voice) utterance.voice = state.voice;
  window.speechSynthesis.speak(utterance);
}

function toggleAudio() {
  state.audio = !state.audio;
  if (!state.audio && "speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
  syncUtilityButtons();
  if (state.audio) speak("Audio activo.");
}

function toggleTheme() {
  state.dark = !state.dark;
  document.body.classList.toggle("theme-dark", state.dark);
  syncUtilityButtons();
}

function syncUtilityButtons() {
  const audioLabel = state.audio ? "Audio activo" : "Audio apagado";
  const themeLabel = state.dark ? "Claro" : "Claro oscuro";

  els.audioButtons.forEach((button) => {
    button.innerHTML = `<span aria-hidden="true">${state.audio ? "&#9834;" : "&times;"}</span> ${audioLabel}`;
    button.setAttribute("aria-label", audioLabel);
    button.setAttribute("aria-pressed", String(state.audio));
  });

  els.themeButtons.forEach((button) => {
    button.innerHTML = `<span aria-hidden="true">${state.dark ? "&#9728;" : "&#9680;"}</span> ${themeLabel}`;
    button.setAttribute("aria-label", themeLabel);
    button.setAttribute("aria-pressed", String(state.dark));
  });
}

document.querySelectorAll(".family-button").forEach((button) => {
  button.addEventListener("click", () => startFamily(Number(button.dataset.max)));
});

document.querySelector("#menuButton").addEventListener("click", () => {
  showScreen("menu");
});

document.querySelector("#resetButton").addEventListener("click", () => {
  newRound();
  speak("Nueva resta.");
});

els.audioButtons.forEach((button) => button.addEventListener("click", toggleAudio));
els.themeButtons.forEach((button) => button.addEventListener("click", toggleTheme));

if ("speechSynthesis" in window) {
  loadVoices();
  window.speechSynthesis.onvoiceschanged = loadVoices;
}

syncUtilityButtons();
