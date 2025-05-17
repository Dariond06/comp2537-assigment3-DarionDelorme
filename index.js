const board = document.getElementById("game-board");
const startBtn = document.getElementById("start");
const resetBtn = document.getElementById("reset");
const powerUpBtn = document.getElementById("power-up");
const themeBtn = document.getElementById("toggle-theme");
const difficultySelect = document.getElementById("difficulty");

const clicksSpan = document.getElementById("clicks");
const pairsLeftSpan = document.getElementById("pairs-left");
const matchedSpan = document.getElementById("matched");
const totalPairsSpan = document.getElementById("total-pairs");
const timerSpan = document.getElementById("timer");

let pokemonList = [];
let cards = [];
let flipped = [];
let lockBoard = false;
let matchedPairs = 0;
let totalPairs = 0;
let clickCount = 0;
let timeRemaining = 0;
let timer = null;
let theme = "light";

const difficulties = {
  easy: { pairs: 3, time: 15 },
  medium: { pairs: 6, time: 30 },
  hard: { pairs: 9, time: 60 },
};

// Fetch full Pokémon list on load
async function loadPokemonList() {
  const res = await fetch("https://pokeapi.co/api/v2/pokemon?limit=1500");
  const data = await res.json();
  pokemonList = data.results;
}
loadPokemonList();

function shuffle(arr) {
  return arr.sort(() => Math.random() - 0.5);
}

async function getPokemonImages(pairCount) {
  const selected = shuffle(pokemonList).slice(0, pairCount);
  const promises = selected.map(p =>
    fetch(p.url)
      .then(res => res.json())
      .then(data => ({
        name: data.name,
        img: data.sprites.other["official-artwork"].front_default,
      }))
  );
  return Promise.all(promises);
}

function createCard(pokemon, id) {
  const card = document.createElement("div");
  card.className = "card";
  card.dataset.name = pokemon.name;
  card.dataset.id = id;

  card.innerHTML = `
    <div class="inner">
      <div class="front"><img src="${pokemon.img}" alt="${pokemon.name}"/></div>
      <div class="back"></div>
    </div>
  `;

  card.addEventListener("click", () => handleFlip(card));
  return card;
}

function resetStatus() {
  clickCount = 0;
  matchedPairs = 0;
  clicksSpan.textContent = 0;
  matchedSpan.textContent = 0;
  pairsLeftSpan.textContent = totalPairs;
  totalPairsSpan.textContent = totalPairs;
  timerSpan.textContent = timeRemaining;
}

function startTimer(duration) {
  clearInterval(timer);
  timeRemaining = duration;
  timerSpan.textContent = timeRemaining;
  timer = setInterval(() => {
    timeRemaining--;
    timerSpan.textContent = timeRemaining;
    if (timeRemaining <= 0) {
      clearInterval(timer);
      endGame(false);
    }
  }, 1000);
}

function handleFlip(card) {
  if (lockBoard || card.classList.contains("matched") || flipped.includes(card)) return;

  card.classList.add("flip");
  flipped.push(card);

  if (flipped.length === 2) {
    lockBoard = true;
    clickCount++;
    clicksSpan.textContent = clickCount;

    const [card1, card2] = flipped;
    if (card1.dataset.name === card2.dataset.name && card1.dataset.id !== card2.dataset.id) {
      card1.classList.add("matched");
      card2.classList.add("matched");
      matchedPairs++;
      matchedSpan.textContent = matchedPairs;
      pairsLeftSpan.textContent = totalPairs - matchedPairs;
      flipped = [];
      lockBoard = false;

      if (matchedPairs === totalPairs) {
        endGame(true);
      }
    } else {
      setTimeout(() => {
        card1.classList.remove("flip");
        card2.classList.remove("flip");
        flipped = [];
        lockBoard = false;
      }, 1000);
    }
  }
}

async function startGame() {
  board.innerHTML = "";
  const difficulty = difficultySelect.value;
  totalPairs = difficulties[difficulty].pairs;
  const time = difficulties[difficulty].time;

  document.body.classList.remove("easy", "medium", "hard");
  document.body.classList.add(difficulty);

  resetStatus();
  startTimer(time);

  const images = await getPokemonImages(totalPairs);
  const allCards = shuffle([...images, ...images].map((p, i) => createCard(p, i)));
  allCards.forEach(card => board.appendChild(card));
  cards = allCards;
}

function endGame(won) {
  lockBoard = true;
  clearInterval(timer);
  setTimeout(() => {
    alert(won ? "You Win!" : "Game Over!");
  }, 200);
}

function resetGame() {
  clearInterval(timer);
  board.innerHTML = "";
  flipped = [];
  lockBoard = false;
  matchedPairs = 0;
  clickCount = 0;
  cards = [];
  clicksSpan.textContent = 0;
  matchedSpan.textContent = 0;
  pairsLeftSpan.textContent = 0;
  totalPairsSpan.textContent = 0;
  timerSpan.textContent = 0;
}

function powerUp() {
  if (!cards.length) return;
  lockBoard = true;
  cards.forEach(card => card.classList.add("flip"));
  setTimeout(() => {
    cards.forEach(card => {
      if (!card.classList.contains("matched")) card.classList.remove("flip");
    });
    lockBoard = false;
  }, 3000);
}

function toggleTheme() {
  document.body.classList.toggle("dark");
}

startBtn.addEventListener("click", startGame);
resetBtn.addEventListener("click", resetGame);
powerUpBtn.addEventListener("click", powerUp);
themeBtn.addEventListener("click", toggleTheme);
