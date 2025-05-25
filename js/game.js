import { initMap, loadRouteShape, map } from './map.js';
import { formatRouteName, getRouteOfTheDay, dateToSeed, MAX_GUESSES, STATES } from './utils.js';
import { shareResults } from './share.js';

let routeMap = {};
let currentRoute = null;

const checkbox = document.getElementById("hard-mode");

function checkFirstVisit(seed) {
    const lastVisit = localStorage.getItem("lastVisit");
    if (parseInt(lastVisit || "0") !== seed) {
        localStorage.setItem("lastVisit", seed.toString());
        localStorage.setItem("guesses", "0");
        localStorage.setItem("status", STATES.NEW);
        for (let i = 1; i <= MAX_GUESSES; ++i) localStorage.setItem(`${i}`, "");
        return true;
    }
    return false;
}

export async function initGame() {
    const seed = dateToSeed();
    const isNewDay = checkFirstVisit(seed);

    try {
        const routeRes = await fetch('routes.json');
        routeMap = await routeRes.json();
        currentRoute = getRouteOfTheDay(Object.keys(routeMap), seed);

        document.getElementById("share-button")?.addEventListener("click", shareResults);
        checkbox?.addEventListener("change", () => {
            const checked = checkbox.checked;
            localStorage.setItem("hard-mode", checked.toString());
            const container = document.getElementById('route-buttons');
            for (const btn of container?.children) {
                const key = btn.dataset.routeID;
                btn.textContent = checked ? key : `${key} ${formatRouteName(routeMap[key])}`;
            }
        });

        initMap();
        setupButtons();
        await loadRouteShape(currentRoute, 'blue');
        await loadGameState();
    } catch (err) {
        console.error("Error initializing game:", err.message);
    }

    return isNewDay;
}

function setupButtons() {
    const container = document.getElementById('route-buttons');
    for (const [key, value] of Object.entries(routeMap)) {
        const button = document.createElement('button');
        button.dataset.routeID = key;
        button.type = 'button';
        button.id = key;
        button.className = 'route-button';
        button.onclick = () => checkGuess(key);
        button.textContent = (localStorage.getItem("hard-mode") === 'true') ? key : `${key} ${formatRouteName(value)}`;
        container?.appendChild(button);
    }
}

async function loadGameState() {
    const guesses = parseInt(localStorage.getItem("guesses") || "0");
    for (let i = 1; i <= guesses; ++i) {
        const square = document.getElementById(`square-${i}`);
        const guessedRoute = localStorage.getItem(`${i}`);
        if (square && guessedRoute) await markGuessSquare(square, guessedRoute);
    }

    const state = localStorage.getItem("status");
    if (state === STATES.WIN || state === STATES.LOSE) endGame();
    if (state !== STATES.NEW && checkbox) checkbox.disabled = true;
    if (checkbox) checkbox.checked = localStorage.getItem("hard-mode") === 'true';
}

async function checkGuess(guessedRoute) {
    const guessNum = parseInt(localStorage.getItem("guesses") || "0") + 1;
    localStorage.setItem("guesses", guessNum.toString());
    localStorage.setItem(`${guessNum}`, guessedRoute);

    const square = document.getElementById(`square-${guessNum}`);
    if (!square) return;

    if (checkbox) checkbox.disabled = true;
    await markGuessSquare(square, guessedRoute);

    const displayRoute = `${currentRoute} ${formatRouteName(routeMap[currentRoute])}`;

    if (guessedRoute === currentRoute) {
        localStorage.setItem("endTime", performance.now().toString());
        localStorage.setItem("status", STATES.WIN);
        alert(`Correct! Today's route is ${displayRoute}`);
        endGame();
    } else {
        localStorage.setItem("status", STATES.PLAY);
        if (guessNum >= MAX_GUESSES) {
            localStorage.setItem("status", STATES.LOSE);
            alert(`You ran out of guesses. Today's route is ${displayRoute}`);
            endGame();
        }
    }
}

async function markGuessSquare(square, guessedRoute) {
    square.textContent = guessedRoute;
    if (guessedRoute === currentRoute) {
        square.style.backgroundColor = 'green';
    } else {
        square.style.backgroundColor = 'red';
        const btn = document.getElementById(guessedRoute);
        if (btn) btn.disabled = true;
        await loadRouteShape(guessedRoute, 'red');
    }
}

function endGame() {
    document.querySelectorAll('.button-container .route-button')?.forEach(btn => btn.disabled = true);

    const winBtn = document.getElementById(currentRoute);
    if (winBtn) {
        winBtn.style.backgroundColor = 'green';
        winBtn.style.color = 'white';
    }

    const shareBtn = document.getElementById('share-button');
    if (shareBtn) shareBtn.style.display = "block";

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>, &copy; <a href="https://carto.com/attributions">CARTO</a>'
    }).addTo(map);
}
