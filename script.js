import 'https://tomashubelbauer.github.io/github-pages-local-storage/index.js';


const MAX_GUESSES = 5;
const URL = "https://rtest42.github.io/vta-routle";
const SHAPES_FILE = "shapes.json";
const ROUTES_FILE = "routes.json";
const CENTER_COORDS = [37.3340062,-121.8917829];

let map;
let routeLayers = {}; // Store GeoJSON layers for routes
let routeMap = {}; // Store route names for route numbers
let currentRoute;

// Seed function Mulberry32 PRNG
function mulberry32(a) {
    let t = a += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
}

const date = new Date();
const dateToInt = (date.getFullYear() % 100000) * 10000 + (date.getMonth() + 1) * 100 + date.getDate(); // Not actually a number that represents today's date but rather a unique number 

function checkFirstVisit(inputDate) {
    const lastVisit = localStorage.getItem('lastVisit');

    if (inputDate != lastVisit) {
        // User is visiting for the first time today
        localStorage.setItem('lastVisit', inputDate);

        // Set game variables
        localStorage.setItem("guesses", 0);
        localStorage.setItem("status", "unplay");
        localStorage.setItem("startTime", performance.now());
        for (let i = 1; i <= MAX_GUESSES; ++i) {
            localStorage.setItem(`${i}`, null);
        }
    }
}

// Call the function to check first visit
checkFirstVisit(dateToInt);

const checkbox = document.getElementById("hard-mode");

// Load routes from shapes.json
fetch(ROUTES_FILE)
    .then(response => response.json())
    .then(data => {
        routeMap = data;
        return fetch(SHAPES_FILE);
    })
    .then(response => response.json())
    .then(data => {
        // Create map
        map = L.map('map', {
            center: CENTER_COORDS,
            zoom: 11,
            zoomControl: true,
            dragging: true,
            scrollWheelZoom: true,
            doubleClickZoom: true,
            touchZoom: true
        });

        // Store the GeoJSON layers for each route
        for (const shapeId in data) {
            const coordinates = data[shapeId].map(([lat, lon]) => [lon, lat]);

            const routeGeoJSON = {
                "type": "FeatureCollection",
                "features": [{
                    "type": "Feature",
                    "geometry": {
                        "type": "LineString",
                        "coordinates": coordinates
                    },
                    "properties": {
                        "name": shapeId
                    }
                }]
            };

            // Create the GeoJSON layer for each route
            routeLayers[shapeId] = L.geoJSON(routeGeoJSON, {
                style: function () {
                    return {
                        color: 'blue',
                        weight: 3,
                        opacity: 1
                    };
                }
            });
        }

        // Select the route of the day
        currentRoute = getRouteOfTheDay(Object.keys(routeMap));

        // Display the route on the map
        for (const key of Object.keys(routeLayers)) {
            if (key.startsWith(`${currentRoute}_`)) {
                routeLayers[key].addTo(map);
            }
        }

        // Create the route selection buttons
        const buttonContainer = document.getElementById('routeButtons');
        if (buttonContainer) {
            for (const [key, value] of Object.entries(routeMap)) {
                const button = document.createElement('button');
                button.setAttribute("id", key);
                if (localStorage.getItem("hard-mode")) {
                    button.textContent = key;
                } else {
                    button.textContent = `${key} ${value.trim().toLowerCase().replace(/\b\w/g, (match) => match.toUpperCase())}`;
                }
                button.className = 'route-button';
                button.onclick = () => checkGuess(key);
                buttonContainer.appendChild(button);
            }
        }

        // Load stored game variables
        for (let i = 1, n = localStorage.getItem("guesses"); i <= n; ++i) {
            const square = document.getElementById(`square${i}`);
            const guessedRoute = localStorage.getItem(`${i}`);
            if (square && guessedRoute) {
                square.textContent = guessedRoute;
                if (guessedRoute == currentRoute) {
                    square.style.backgroundColor = 'green';
                } else {
                    square.style.backgroundColor = 'red';
                    const button = document.getElementById(guessedRoute);
                    if (button) button.disabled = true;
                    for (const key of Object.keys(routeLayers)) {
                        if (key.startsWith(`${guessedRoute}_`)) {
                            routeLayers[key].setStyle({ color: 'red' });
                            routeLayers[key].addTo(map);
                        }
                    }
                }
            }
        }

        // Load game states
        const gameState = localStorage.getItem("status");
        if (gameState == 'win' || gameState == 'lose') {
            endGame();
        }
        if (gameState != 'unplay') {
            if (checkbox) checkbox.disabled = true;
        }

        if (checkbox) checkbox.checked = localStorage.getItem("hard-mode");
    })
    .catch(error => console.error("Error loading JSON:", error));

// Function to get a random route id from available routes
function getRouteOfTheDay(routeIds) {
    const randomIndex = Math.floor(mulberry32(dateToInt) * routeIds.length);
    return routeIds[randomIndex];
}

// Function to check if the user's guess is correct
function checkGuess(guessedRoute) {
    // If the guess is correct, display the route and end the game
    localStorage.setItem("guesses", parseInt(localStorage.getItem("guesses")) + 1);
    localStorage.setItem(`${localStorage.getItem("guesses")}`, guessedRoute);
    const square = document.getElementById(`square${localStorage.getItem("guesses")}`);
    if (checkbox) checkbox.disabled = true;
    if (square) {
        square.textContent = guessedRoute;
        if (guessedRoute == currentRoute) {
            square.style.backgroundColor = 'green';
            localStorage.setItem("endTime", performance.now());
            localStorage.setItem("status", "win");
            alert(`Correct! Today's route is ${currentRoute} ${routeMap[currentRoute].trim().toLowerCase().replace(/\b\w/g, (match) => match.toUpperCase())}`);
            endGame();
        } else {
            square.style.backgroundColor = 'red';
            localStorage.setItem("status", "play");
            const button = document.getElementById(guessedRoute);
            if (button) button.disabled = true;
            for (const key of Object.keys(routeLayers)) {
                if (key.startsWith(guessedRoute + '_')) {
                    routeLayers[key].setStyle({ color: 'red' });
                    routeLayers[key].addTo(map);
                }
            }
            if (localStorage.getItem("guesses") >= MAX_GUESSES) {
                localStorage.setItem("status", "lose");
                alert(`You ran out of guesses. Today's route is ${currentRoute} ${routeMap[currentRoute].trim().toLowerCase().replace(/\b\w/g, (match) => match.toUpperCase())}`);
                endGame();
            }
        }
    }
}

// Function to end the game
function endGame() {
    const buttons = document.querySelectorAll('.button-container .route-button');
    if (buttons.length) {
        buttons.forEach(button => {
            button.disabled = true; // Disable all buttons after game ends
        });
    }
    const button = document.getElementById(currentRoute);
    if (button) {
        button.style.backgroundColor = 'green';
        button.style.color = 'white';
    }
    const shareButton = document.getElementById('share-button');
    if (shareButton) {
        shareButton.style.display = "block";
    }
    // Add dark mode tile layer
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors, &copy; CartoDB'
    }).addTo(map);
}

// Function to share results
function shareResults() {
    let currentDate = `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
    let hardMode = "";
    if (localStorage.getItem("hard-mode")) {
        hardMode = " - Hard Mode";
    }
    let time = "";
    if (localStorage.getItem("status") == 'win') {
        let elapsedTime = localStorage.getItem("endTime") - localStorage.getItem("startTime");
        time = ` - ${elapsedTime.toFixed(3)}ms`;
    }
    let displayGuesses = ['⬛ ', '⬛ ', '⬛ ', '⬛ ', '⬛ '];
    for (let i = 0, n = localStorage.getItem("guesses"); i < n; ++i) {
        displayGuesses[i] = '🟥 ';
    }
    if (localStorage.getItem("status") == "win") {
        displayGuesses[localStorage.getItem("guesses") - 1] = '🟩 ';
    }
    navigator.clipboard.writeText(`VTA Historoutle ${currentDate}${hardMode}${time}\n${displayGuesses.join('')}\n\n${URL}`);
    alert("Copied to clipboard!");
}

// Function to toggle hard mode
function toggleHardMode() {
    localStorage.setItem("hard-mode", checkbox.checked);
    const buttonContainer = document.getElementById('routeButtons').children;
    const shapes = Object.keys(routeLayers);
    if (buttonContainer) {
        for (let i = 0; i < buttonContainer.length; ++i) {
            const button = buttonContainer[i];
            if (checkbox.checked) {
                button.textContent = button.textContent.slice(0, button.textContent.indexOf(" "));
            } else {
                button.textContent = `${button.textContent} ${routeMap[button.textContent].trim().toLowerCase().replace(/\b\w/g, (match) => match.toUpperCase())}`;
            }
        }
    }
}


document.getElementById("share-button").addEventListener("click", shareResults);
checkbox.addEventListener("change", toggleHardMode);
