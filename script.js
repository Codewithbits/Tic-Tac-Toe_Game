/* =========================================
   TIC-TAC-TOE — NEON ARENA
   Game Logic & UI Controller
   ========================================= */

// --- Variables & State ---
let board = ["", "", "", "", "", "", "", "", ""];
let currentPlayer = "X";
let gameActive = false;

let totalRounds = 5;
let currentRound = 1;
let scoreYou = 0;
let scoreAI = 0;
let scoreDraws = 0;

// Win combinations
const winConditions = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // Cols
    [0, 4, 8], [2, 4, 6]             // Diagonals
];

// Screen Navigation
const screens = {
    landing: document.getElementById('landingScreen'),
    round: document.getElementById('roundScreen'),
    game: document.getElementById('gameScreen'),
    result: document.getElementById('resultScreen')
};

function switchScreen(screenName) {
    Object.values(screens).forEach(screen => screen.classList.remove('active'));
    screens[screenName].classList.add('active');
}

// --- Menu Functions ---
function showRoundSelect() {
    switchScreen('round');
}

function goBack() {
    switchScreen('landing');
}

function quitGame() {
    window.close(); // Only works if opened via script, but works conceptually
}

// --- Round Selection ---
function selectRound(rounds) {
    document.querySelectorAll('.round-btn').forEach(btn => btn.classList.remove('selected'));
    document.querySelector(`.round-btn[data-rounds="${rounds}"]`)?.classList.add('selected');
    totalRounds = rounds;
    document.getElementById('customRoundInput').value = '';
}

document.getElementById('customRoundInput').addEventListener('input', (e) => {
    document.querySelectorAll('.round-btn').forEach(btn => btn.classList.remove('selected'));
    let val = parseInt(e.target.value);
    if (val > 0) totalRounds = val;
});

// --- Game Initialization ---
function startGame() {
    if (!totalRounds || totalRounds <= 0) totalRounds = 1;
    currentRound = 1;
    scoreYou = 0;
    scoreAI = 0;
    scoreDraws = 0;
    updateScoreBoard();
    resetBoard();
    switchScreen('game');
}

function updateScoreBoard() {
    document.getElementById('scorePlayer').innerText = scoreYou;
    document.getElementById('scoreAI').innerText = scoreAI;
    document.getElementById('scoreDraws').innerText = scoreDraws;
    document.getElementById('totalRounds').innerText = totalRounds;
    document.getElementById('currentRound').innerText = currentRound;
}

// --- Board Interaction ---
function handleCellClick(index) {
    if (!gameActive || board[index] !== "" || currentPlayer !== "X") return;
    
    makeMove(index, "X");
    
    if (gameActive) {
        currentPlayer = "O";
        updateTurnIndicator();
        setTimeout(aiMove, 500); // AI delay for realism
    }
}

function makeMove(index, player) {
    board[index] = player;
    const cell = document.querySelector(`.cell[data-index="${index}"]`);
    cell.classList.add('taken', player === "X" ? 'x-mark' : 'o-mark');
    cell.innerText = player;
    
    checkResult();
}

function updateTurnIndicator() {
    const status = document.getElementById('gameStatus');
    const indP = document.getElementById('indicatorPlayer');
    const indA = document.getElementById('indicatorAI');
    
    status.className = 'game-status';
    
    if (currentPlayer === "X") {
        status.innerText = "YOUR TURN";
        indP.classList.add('active');
        indA.classList.remove('active');
    } else {
        status.innerText = "AI COMPUTING...";
        indA.classList.add('active');
        indP.classList.remove('active');
    }
}

// --- AI Logic ---
function aiMove() {
    if (!gameActive) return;
    
    // 1. Try to win
    let move = findBestMove("O");
    // 2. Try to block
    if (move === -1) move = findBestMove("X");
    // 3. Take center
    if (move === -1 && board[4] === "") move = 4;
    // 4. Take random available
    if (move === -1) {
        let available = board.map((val, idx) => val === "" ? idx : null).filter(val => val !== null);
        if (available.length > 0) {
            move = available[Math.floor(Math.random() * available.length)];
        }
    }
    
    if (move !== -1) {
        makeMove(move, "O");
        if (gameActive) {
            currentPlayer = "X";
            updateTurnIndicator();
        }
    }
}

function findBestMove(player) {
    for (let i = 0; i < winConditions.length; i++) {
        const [a, b, c] = winConditions[i];
        if (board[a] === player && board[b] === player && board[c] === "") return c;
        if (board[a] === player && board[c] === player && board[b] === "") return b;
        if (board[b] === player && board[c] === player && board[a] === "") return a;
    }
    return -1;
}

// --- Result Checking ---
function checkResult() {
    let roundWon = false;
    let winningLine = [];
    let winner = "";

    for (let i = 0; i < winConditions.length; i++) {
        const [a, b, c] = winConditions[i];
        if (board[a] && board[a] === board[b] && board[a] === board[c]) {
            roundWon = true;
            winningLine = [a, b, c];
            winner = board[a];
            break;
        }
    }

    const status = document.getElementById('gameStatus');

    if (roundWon) {
        gameActive = false;
        highlightWin(winningLine, winner);
        
        if (winner === "X") {
            scoreYou++;
            status.innerText = "ROUND WON!";
            status.className = 'game-status status-win';
        } else {
            scoreAI++;
            status.innerText = "ROUND LOST!";
            status.className = 'game-status status-lose';
        }
        
        setTimeout(endRound, 2000);
        return;
    }

    if (!board.includes("")) {
        gameActive = false;
        scoreDraws++;
        status.innerText = "DRAW!";
        status.className = 'game-status status-draw';
        setTimeout(endRound, 2000);
    }
}

function highlightWin(line, winner) {
    line.forEach(idx => {
        document.querySelector(`.cell[data-index="${idx}"]`).classList.add('win-cell');
    });
    
    // Draw SVG Line
    const svg = document.getElementById('winLineSvg');
    const svgLine = document.getElementById('winLine');
    const cells = line.map(idx => document.querySelector(`.cell[data-index="${idx}"]`));
    
    const boardRect = document.getElementById('gameBoard').getBoundingClientRect();
    const startRect = cells[0].getBoundingClientRect();
    const endRect = cells[2].getBoundingClientRect();
    
    const x1 = startRect.left + startRect.width/2 - boardRect.left;
    const y1 = startRect.top + startRect.height/2 - boardRect.top;
    const x2 = endRect.left + endRect.width/2 - boardRect.left;
    const y2 = endRect.top + endRect.height/2 - boardRect.top;
    
    // Extend line slightly
    const dx = x2 - x1;
    const dy = y2 - y1;
    const length = Math.sqrt(dx*dx + dy*dy);
    const extension = 20; // px
    
    const ex1 = x1 - (dx/length) * extension;
    const ey1 = y1 - (dy/length) * extension;
    const ex2 = x2 + (dx/length) * extension;
    const ey2 = y2 + (dy/length) * extension;
    
    svgLine.setAttribute('x1', ex1);
    svgLine.setAttribute('y1', ey1);
    svgLine.setAttribute('x2', ex2);
    svgLine.setAttribute('y2', ey2);
    
    if(winner === "X") svgLine.style.stroke = "var(--green)";
    else svgLine.style.stroke = "var(--red)";
    
    svgLine.classList.add('drawn');
}

// --- Round & Match Management ---
function endRound() {
    updateScoreBoard();
    
    if (currentRound >= totalRounds) {
        showFinalResults();
    } else {
        currentRound++;
        updateScoreBoard();
        resetBoard();
    }
}

function resetBoard() {
    board = ["", "", "", "", "", "", "", "", ""];
    document.querySelectorAll('.cell').forEach(cell => {
        cell.className = 'cell';
        cell.innerText = '';
    });
    
    const svgLine = document.getElementById('winLine');
    svgLine.classList.remove('drawn');
    
    currentPlayer = "X";
    gameActive = true;
    updateTurnIndicator();
}

function showFinalResults() {
    document.getElementById('finalPlayer').innerText = scoreYou;
    document.getElementById('finalAI').innerText = scoreAI;
    document.getElementById('finalDraws').innerText = scoreDraws;
    
    const title = document.getElementById('resultTitle');
    const sub = document.getElementById('resultSubtitle');
    const icon = document.getElementById('resultIcon');
    
    title.className = 'result-title';
    
    if (scoreYou > scoreAI) {
        title.innerText = "VICTORY!";
        title.classList.add('win');
        sub.innerText = "You dominated the neon arena.";
        icon.innerText = "🏆";
    } else if (scoreAI > scoreYou) {
        title.innerText = "DEFEAT!";
        title.classList.add('lose');
        sub.innerText = "The machine proved superior.";
        icon.innerText = "💀";
    } else {
        title.innerText = "STALEMATE!";
        title.classList.add('draw');
        sub.innerText = "A battle of equals.";
        icon.innerText = "⚖️";
    }
    
    switchScreen('result');
}

function playAgain() {
    switchScreen('round');
}

function backToMenu() {
    switchScreen('landing');
}

// --- Particle Background Animation ---
const canvas = document.getElementById('particleCanvas');
const ctx = canvas.getContext('2d');

let particles = [];

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();

class Particle {
    constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 2 + 0.5;
        this.speedX = Math.random() * 1 - 0.5;
        this.speedY = Math.random() * -1 - 0.5;
        this.color = Math.random() > 0.5 ? '#00f0ff' : '#bf5fff';
        this.opacity = Math.random() * 0.5 + 0.1;
    }
    
    update() {
        this.x += this.speedX;
        this.y += this.speedY;
        
        if (this.y < 0) {
            this.y = canvas.height;
            this.x = Math.random() * canvas.width;
        }
        if (this.x < 0) this.x = canvas.width;
        if (this.x > canvas.width) this.x = 0;
    }
    
    draw() {
        ctx.globalAlpha = this.opacity;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 10;
        ctx.shadowColor = this.color;
    }
}

function initParticles() {
    particles = [];
    const particleCount = window.innerWidth < 600 ? 30 : 70;
    for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle());
    }
}

function animateParticles() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(p => {
        p.update();
        p.draw();
    });
    requestAnimationFrame(animateParticles);
}

initParticles();
animateParticles();

// Init on load
document.addEventListener('DOMContentLoaded', () => {
    switchScreen('landing');
});
