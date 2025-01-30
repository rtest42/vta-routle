import 'https://tomashubelbauer.github.io/github-pages-local-storage/index.js';
document.addEventListener('DOMContentLoaded', function () {
    const MAX_GUESSES = 5;
    const basePath = "https://rtest42.github.io/vta-routle";
    const SHAPES_FILE = "shapes.json";
    const CENTER_COORDS = [37.2228401, -121.7776057];

    let map;
    let routeLayers = {}; // Store GeoJSON layers for routes
    let currentRoute;

    // Seed function Mulberry32 PRNG
    function mulberry32(a) {
        let t = a += 0x6D2B79F5;
        t = Math.imul(t ^ t >>> 15, t | 1);
        t ^= t + Math.imul(t ^ t >>> 7, t | 61);
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
    }

    const date = new Date();
    const today = date.toISOString().split('T')[0]; // Get current date in YYYY-MM-DD format
    const dateToInt = parseInt(today.replace(/-/g, "")); // Removes hyphens and convert string to integer

    function checkFirstVisit(inputDate) {
        const lastVisit = localStorage.getItem('lastVisit');

        if (inputDate !== lastVisit) {
            // User is visiting for the first time today
            localStorage.setItem('lastVisit', inputDate);

            // Set game variables
            localStorage.setItem("guesses", 0);
            localStorage.setItem("status", "unplay");
            for (let i = 1; i <= MAX_GUESSES; ++i) {
                localStorage.setItem(`${i}`, null);
            }
        }
    }

    // Call the function to check first visit
    checkFirstVisit(today);

    // Load routes from shapes.json
    fetch(`${basePath}/${SHAPES_FILE}`)
        .then(response => response.json())
        .then(data => {
            // Create map
            map = L.map('map', {
                center: CENTER_COORDS,
                zoom: 11,
                zoomControl: false,
                dragging: false,
                scrollWheelZoom: false,
                doubleClickZoom: false,
                touchZoom: false
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
                            "name": `${shapeId}`
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
            currentRoute = getRouteOfTheDay(Object.keys(routeLayers));

            // Display the route on the map
            routeLayers[currentRoute].addTo(map);

            map.fitBounds(routeLayers[currentRoute].getBounds());

            // Create the route selection buttons
            const buttonContainer = document.getElementById('routeButtons');
            if (buttonContainer) {
                for (const shapeId in routeLayers) {
                    const button = document.createElement('button');
                    button.setAttribute("id", shapeId);
                    button.textContent = shapeId;
                    button.className = 'route-button';
                    button.onclick = () => checkGuess(shapeId);
                    buttonContainer.appendChild(button);
                }
            }

            // Load stored game variables
            for (let i = 1, n = localStorage.getItem("guesses"); i <= n; ++i) {
                const square = document.getElementById(`square${i}`);
                const guessedRoute = localStorage.getItem(`${i}`);
                if (square && guessedRoute) {
                    square.textContent = shortenRoute(guessedRoute);
                    if (guessedRoute == currentRoute) {
                        square.style.backgroundColor = 'green';
                    } else {
                        square.style.backgroundColor = 'red';
                        const button = document.getElementById(guessedRoute);
                        if (button) button.disabled = true;
                        routeLayers[guessedRoute].setStyle({ color: 'red' });
                        routeLayers[guessedRoute].addTo(map);
                    }
                }
            }

            // Load game states
            const gameState = localStorage.getItem("status");
            if (gameState == 'win' || gameState == 'lose') {
                endGame();
            }
        })
        .catch(error => console.error("Error loading JSON:", error));

    // Function to get a random route id from available routes
    function getRouteOfTheDay(routeIds) {
        const randomIndex = Math.floor(mulberry32(dateToInt) * routeIds.length);
        return routeIds[randomIndex];
    }

    // Function to only get the route number or letter
    function shortenRoute(route) {
        if (route == null) {
            return "";
        }

        const spaceIndex1 = route.indexOf(' ');
        const firstWord = route.slice(0, spaceIndex1);
        const spaceIndex2 = route.indexOf(' ', spaceIndex1 + 1);
        const secondWord = route.slice(spaceIndex1 + 1, spaceIndex2);
        if (firstWord == 'Express' || firstWord == 'Rapid') {
            return secondWord;
        } else if (secondWord == 'Line') {
            return firstWord[0];
        } else {
            return firstWord;
        }
    }

    // Function to check if the user's guess is correct
    function checkGuess(guessedRoute) {
        // If the guess is correct, display the route and end the game
        localStorage.setItem("guesses", parseInt(localStorage.getItem("guesses")) + 1);
        localStorage.setItem(`${localStorage.getItem("guesses")}`, guessedRoute);
        const square = document.getElementById(`square${localStorage.getItem("guesses")}`);
        if (square) {
            square.textContent = shortenRoute(guessedRoute);
            if (guessedRoute == currentRoute) {
                square.style.backgroundColor = 'green';
                localStorage.setItem("status", "win");
                alert(`Correct! Today's route is ${currentRoute}`);
                endGame();
            } else {
                square.style.backgroundColor = 'red';
                localStorage.setItem("status", "play");
                const button = document.getElementById(guessedRoute);
                if (button) button.disabled = true;
                routeLayers[guessedRoute].setStyle({ color: 'red' });
                routeLayers[guessedRoute].addTo(map);
                if (localStorage.getItem("guesses") >= MAX_GUESSES) {
                    localStorage.setItem("status", "lose");
                    alert(`You ran out of guesses. Today's route is ${currentRoute}`);
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

    function shareResults() {
        let currentDate = `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
        let displayGuesses = [' ⬛', ' ⬛', ' ⬛', ' ⬛', ' ⬛'];
        for (let i = 0, n = localStorage.getItem("guesses"); i < n; ++i) {
            displayGuesses[i] = '🟥 ';
        }
        if (localStorage.getItem("status") === "win") {
            displayGuesses[localStorage.getItem("guesses") - 1] = '🟩 ';
        }
        navigator.clipboard.writeText(`VTA Routle ${currentDate}\n${displayGuesses.join('')}\n\nhttps://rtest42.github.io/vta-routle/`);
        alert("Copied to clipboard!");
    }

    document.getElementById("share-button").addEventListener("click", shareResults);
});