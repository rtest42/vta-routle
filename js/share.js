import { MAX_GUESSES, URL, STATES } from './utils.js';

const getTimeText = status => {
    if (status !== STATES.WIN) return '';
    const start = parseFloat(localStorage.getItem("startTime"));
    const end = parseFloat(localStorage.getItem("endTime"));
    const elapsedSeconds = ((end - start) / 1000).toFixed(3);
    return ` - ${elapsedSeconds}s`;
}

const getGuessDisplay = (status, guessCount) => {
    const display = Array(MAX_GUESSES).fill('\u{2B1B} '); // Black square
    for (let i = 0; i < guessCount; ++i) display[i] = '\u{1F7E5} '; // Red square
    if (status === STATES.WIN) display[guessCount - 1] = '\u{1F7E9} '; // Green square
    return display.join('');
}

export async function shareResults() {
    const currentDate = new Intl.DateTimeFormat(navigator.language).format(new Date());
    const isHardMode = localStorage.getItem("hard-mode") === 'true';
    const gameStatus = localStorage.getItem("status");
    const guessCount = parseInt(localStorage.getItem("guesses") || "0");
    const hardModeText = isHardMode ? " - Hard Mode" : "";
    const timeText = getTimeText(gameStatus);
    const guessDisplay = getGuessDisplay(gameStatus, guessCount);
    const shareText = `VTA Historoutle ${currentDate}${hardModeText}${timeText}\n${guessDisplay}\n\n${URL}`;
    const isMobile = navigator.maxTouchPoints > 1;

    try {
        if (navigator.share && isMobile) {
            await navigator.share({ title: `VTA Routle ${currentDate} Results`, text: shareText });
        } else if (navigator.clipboard) {
            await navigator.clipboard.writeText(shareText);
            alert("Copied to clipboard!");
        } else {
            alert("Sharing and copying are not supported in this browser.");
        }
    } catch (err) {
        alert("Failed to share or copy text.");
        console.error(err.message);
    }
}
