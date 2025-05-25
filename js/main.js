import { initGame } from './game.js';

window.onload = async () => {
    try {
        const isNewDay = await initGame();
        if (isNewDay) localStorage.setItem("startTime", performance.now().toString());
    } catch (err) {
        console.error("Error loading game:", err.message);
    }
};
