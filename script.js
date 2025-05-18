import 'https://tomashubelbauer.github.io/github-pages-local-storage/index.js';

const MAX_GUESSES = 5;
const URL = "https://rtest42.github.io/vta-routle";
const SHAPES_DIR = "shapes";
const ROUTES_URL = "routes.json";
const CENTER_COORDS = [37.3340062, -121.8917829];

let map;
const routeLayers = {}; // GeoJSON layers for routes
let routeMap = {}; // Route names for route numbers
let currentRoute;

const date = new Date();
const dateToInt = (date.getFullYear() % 100000) * 10000 + (date.getMonth() + 1) * 100 + date.getDate();
const checkbox = document.getElementById("hard-mode");

function mulberry32(num) { // Seed function PRNG
    let t = num + 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
}

function getRouteOfTheDay(routeIds) {
    const randomIndex = Math.floor(mulberry32(dateToInt) * routeIds.length);
    return routeIds[randomIndex];
}

function checkFirstVisitOfTheDay(inputDate) {
    const lastVisit = localStorage.getItem('lastVisit');
    if (inputDate !== parseInt(lastVisit || "0")) { // User is visiting for the first time today
        localStorage.setItem('lastVisit', inputDate.toString());
        localStorage.setItem("guesses", "0");
        localStorage.setItem("status", "unplay");
        // localStorage.setItem("startTime", performance.now().toString()); // Moved to after all contents are loaded
        for (let i = 1; i <= MAX_GUESSES; ++i) {
            localStorage.setItem(`${i}`, "");
        }
        return true;
    }
    return false;
}

function formatRouteName(routeName) {
    return routeName.trim().toLowerCase().replace(/\b\w/g, (match) => match.toUpperCase());
}

async function initGame() {
    const isNewDay = checkFirstVisitOfTheDay(dateToInt);

    try {
        const routeRes = await fetch(ROUTES_URL);
        routeMap = await routeRes.json();
        
        currentRoute = getRouteOfTheDay(Object.keys(routeMap));

        const shapesRes = await fetch(`${SHAPES_DIR}/${currentRoute}.json`);
        const shapeData = await shapesRes.json();

        initMap(shapeData);
        drawCurrentRoute();
        setupButtons();
        loadGameState();
    } catch (err) {
        console.error("Error loading JSON:", err);
    }
    
    return isNewDay;
}

function initMap(shapes) {
    map = L.map('map', {
        center: CENTER_COORDS,
        zoom: 11,
        zoomControl: true,
        dragging: true,
        scrollWheelZoom: true,
        doubleClickZoom: true,
        touchZoom: true
    });

    loadShape(shapes, 'blue');
}

function loadShape(shapes, clr) {
    for (const shapeID in shapes) {
        const coordinates = shapes[shapeID].map(([lat, lon]) => [lon, lat]);

        const geoJSON = {
            type: "FeatureCollection",
            features: [{
                type: "Feature",
                geometry: { type: "LineString", coordinates: coordinates },
                properties: { name: shapeID }
            }]
        };

        routeLayers[shapeID] = L.geoJSON(geoJSON, {
            style: { color: clr, weight: 3, opacity: 1 }
        });

        routeLayers[shapeID].addTo(map);
    }
}

function drawCurrentRoute() {
    for (const key in routeLayers) {
        if (key.startsWith(`${currentRoute}_`)) {
            routeLayers[key].addTo(map);
        }
    }
}

function setupButtons() {
    const container = document.getElementById('routeButtons');
    if (!container) return;

    for (const [key, value] of Object.entries(routeMap)) {
        const button = document.createElement('button');
        button.dataset.routeID = key;
        button.type = 'button';
        button.id = key;
        button.className = 'route-button';
        button.onclick = () => checkGuess(key);
        button.textContent = (localStorage.getItem("hard-mode") === 'true') ? key : `${key} ${formatRouteName(value)}`;
        container.appendChild(button);
    }
}

async function loadGameState() {
    const guesses = parseInt(localStorage.getItem("guesses") || "0")
    for (let i = 1; i <= guesses; ++i) {
        const square = document.getElementById(`square${i}`);
        const guessedRoute = localStorage.getItem(`${i}`);
        if (square && guessedRoute) {
            square.textContent = guessedRoute;
            if (guessedRoute === currentRoute) {
                square.style.backgroundColor = 'green';
            } else {
                square.style.backgroundColor = 'red';
                const btn = document.getElementById(guessedRoute);
                if (btn) btn.disabled = true;
                try {
                    const shapesRes = await fetch(`${SHAPES_DIR}/${guessedRoute}.json`);
                    const shapeData = await shapesRes.json();
                    loadShape(shapeData, 'red');
                } catch (err) {
                    console.error("Failed to load route", err);
                }
            }
        }
    }

    const state = localStorage.getItem("status");
    if (state === 'win' || state === 'lose') endGame();
    if (state !== 'unplay' && checkbox) checkbox.disabled = true;
    if (checkbox) checkbox.checked = (localStorage.getItem("hard-mode") === 'true');
}

async function checkGuess(guessedRoute) {
    const guessNum = parseInt(localStorage.getItem("guesses") || "0") + 1;
    const displayRoute = `${currentRoute} ${formatRouteName(routeMap[currentRoute])}`;
    localStorage.setItem("guesses", guessNum.toString());
    localStorage.setItem(`${guessNum}`, guessedRoute);
    const square = document.getElementById(`square${guessNum}`);
    if (checkbox) checkbox.disabled = true;
    if (!square) return;

    square.textContent = guessedRoute;
    if (guessedRoute === currentRoute) {
        square.style.backgroundColor = 'green';
        localStorage.setItem("endTime", performance.now().toString());
        localStorage.setItem("status", "win");
        alert(`Correct! Today's route is ${displayRoute}`);
        endGame();
    } else {
        square.style.backgroundColor = 'red';
        localStorage.setItem("status", "play");
        const btn = document.getElementById(guessedRoute);
        if (btn) btn.disabled = true;
        try {
            const shapesRes = await fetch(`${SHAPES_DIR}/${guessedRoute}.json`);
            const shapeData = await shapesRes.json();
            loadShape(shapeData, 'red');
        } catch (err) {
            console.error("Failed to load route", err);
        } finally {
            if (guessNum >= MAX_GUESSES) {
                localStorage.setItem("status", "lose");
                alert(`You ran out of guesses. Today's route is ${displayRoute}`);
                endGame();
            }
        }
    }
}

function endGame() {
    document.querySelectorAll('.button-container .route-button').forEach(btn => btn.disabled = true);

    const winBtn = document.getElementById(currentRoute);
    if (winBtn) {
        winBtn.style.backgroundColor = 'green';
        winBtn.style.color = 'white';
    }
    const shareBtn = document.getElementById('share-button');
    if (shareBtn) shareBtn.style.display = "block";

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors, &copy; CartoDB'
    }).addTo(map);
}

// Function to share results
async function shareResults() {
    const currentDate = new Intl.DateTimeFormat(navigator.language).format(new Date());
    const isHardMode = localStorage.getItem("hard-mode") === 'true';
    const gameStatus = localStorage.getItem("status");
    const guessCount = parseInt(localStorage.getItem("guesses") || "0");
    const hardModeText = isHardMode ? " - Hard Mode" : "";
    const timeText = getTimeText(gameStatus);
    const guessDisplay = getGuessDisplay(gameStatus, guessCount);
    const shareText = `VTA Historoutle ${currentDate}${hardModeText}${timeText}\n${guessDisplay}\n\n${URL}`;

    try {
        if (navigator.share) {
            await navigator.share({ title: `VTA Routle ${currentDate} Results`, text: shareText });
        } else if (navigator.clipboard) { // Fallback
            await navigator.clipboard.writeText(shareText);
            alert("Copied to clipboard!");
        } else {
            alert("Sharing and copying are not supported in this browser.");
        }
    } catch (err) {
        alert("Failed to share or copy text.");
        console.error(err);
    }
}

function getTimeText(status) {
    if (status !== 'win') return '';
    const start = parseFloat(localStorage.getItem("startTime"));
    const end = parseFloat(localStorage.getItem("endTime"));
    const elapsedSeconds = ((end - start) / 1000).toFixed(3);
    return ` - ${elapsedSeconds}s`;
}

function getGuessDisplay(status, guessCount) {
    const display = Array(MAX_GUESSES).fill('\u{2B1B} '); // black square
    for (let i = 0; i < guessCount; ++i) display[i] = '\u{1F7E5} '; // red square
    if (status === 'win') display[guessCount - 1] = '\u{1F7E9} '; // green square
    return display.join('');
}

function toggleHardMode() {
    const checked = checkbox.checked;
    localStorage.setItem("hard-mode", checked.toString());
    const container = document.getElementById('routeButtons');
    if (!container) return;

    for (const btn of container.children) {
        const key = btn.dataset.routeID;
        btn.textContent = checked ? key : `${key} ${formatRouteName(routeMap[key])}`;
    }
}

// Add event listeners via mouse button for share button and hard mode toggling
document.getElementById("share-button").addEventListener("click", shareResults);
checkbox?.addEventListener("change", toggleHardMode);

window.onload = async () => {
    try {
        const isNewDay = await initGame();
        if (isNewDay) localStorage.setItem("startTime", performance.now().toString());
    } catch (err) {
        console.error(err);
    }
};
