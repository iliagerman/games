const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Set canvas resolution to match CSS/Game Logic
canvas.width = 800;
canvas.height = 450;

// Audio Context
let audioCtx;

function initAudio() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    } else if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
}

function playSound(type) {
    if (!audioCtx) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);

    if (type === 'jump') {
        osc.frequency.setValueAtTime(300, audioCtx.currentTime);
        osc.frequency.linearRampToValueAtTime(500, audioCtx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.3);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.3);
    } else if (type === 'collect') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, audioCtx.currentTime);
        osc.frequency.setValueAtTime(800, audioCtx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.2);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.2);
    } else if (type === 'gameover') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(200, audioCtx.currentTime);
        osc.frequency.linearRampToValueAtTime(50, audioCtx.currentTime + 0.5);
        gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
        gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.5);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.5);
    }
}

// Game State
let gameState = 'START'; // START, PLAYING, GAMEOVER
let score = 0;
let lives = 5; // Start with 5 lives
let sceneTimer = 0;
let gameTick = 0; // For animation
let currentScene = 'BIKINI_BOTTOM';
// Scenes: BIKINI_BOTTOM -> KELP_FOREST -> JELLYFISH_FIELDS -> DEEP_OCEAN -> KRUSTY_KRAB
let bgCreatures = []; // Swimming jellyfish & fish (background only, not enemies)

// Audio
let musicInterval = null;
let noteIndex = 0;

// Elements
const startScreen = document.getElementById('start-screen');
const gameOverScreen = document.getElementById('game-over-screen');
const scoreDisplay = document.getElementById('score');
const finalScoreDisplay = document.getElementById('final-score');
const startBtn = document.getElementById('start-btn');
const restartBtn = document.getElementById('restart-btn');

// Event Listeners
startBtn.addEventListener('click', () => { initAudio(); startGame(); });
restartBtn.addEventListener('click', () => { initAudio(); resetGame(); });
window.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
        e.preventDefault();
        initAudio();
        handleInput();
    }
});
canvas.addEventListener('click', () => { initAudio(); handleInput(); });

// Mobile touch support
canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    initAudio();
    handleInput();
}, { passive: false });
startBtn.addEventListener('touchstart', (e) => {
    e.preventDefault();
    initAudio();
    startGame();
}, { passive: false });
restartBtn.addEventListener('touchstart', (e) => {
    e.preventDefault();
    initAudio();
    resetGame();
}, { passive: false });
// Prevent scrolling/zooming on the game area
document.getElementById('game-container').addEventListener('touchmove', (e) => {
    e.preventDefault();
}, { passive: false });

function handleInput() {
    if (gameState === 'START') startGame();
    else if (gameState === 'PLAYING') playerJump();
    else if (gameState === 'GAMEOVER') resetGame();
}

function startGame() {
    gameState = 'PLAYING';
    startScreen.classList.add('hidden');
    gameOverScreen.classList.add('hidden');
    score = 0;
    lives = 5; // Reset lives
    sceneTimer = 0;
    currentScene = 'BIKINI_BOTTOM';

    // Reset entities
    player.y = 300;
    player.vy = 0;
    player.invulnerable = 0;
    obstacles = [];
    collectibles = [];
    bgCharacters = [];
    bgCreatures = [];

    // Resume audio context if needed
    if (audioCtx && audioCtx.state === 'suspended') {
        audioCtx.resume();
    }

    startMusic();
    gameLoop();
}

function resetGame() {
    gameState = 'START';
    gameOverScreen.classList.add('hidden');
    startScreen.classList.remove('hidden');
    stopMusic();
}

// --- MUSIC SYSTEM (Weak 8-bit style) ---
function startMusic() {
    if (musicInterval) clearInterval(musicInterval);
    noteIndex = 0;
    // Simple cheerful melody (C Major scale-ish)
    const melody = [
        392.00, 0, 392.00, 440.00, 392.00, 0, 493.88, 523.25, // G, G, A, G, B, C
        523.25, 0, 392.00, 329.63, 261.63, 0, 293.66, 329.63, // C, G, E, C, D, E (SpongeBob-ish feel)
        392.00, 0, 392.00, 392.00, 440.00, 0, 392.00, 349.23, // G, G, G, A, G, F
        329.63, 0, 293.66, 0, 261.63, 0, 261.63, 0            // E, D, C, C
    ];

    musicInterval = setInterval(() => {
        const freq = melody[noteIndex % melody.length];
        noteIndex++;

        if (freq > 0 && audioCtx && audioCtx.state === 'running') {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.connect(gain);
            gain.connect(audioCtx.destination);

            osc.type = 'square'; // 8-bit sound
            osc.frequency.setValueAtTime(freq, audioCtx.currentTime);

            // Short blip
            gain.gain.setValueAtTime(0.05, audioCtx.currentTime); // Low volume
            gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.15);

            osc.start();
            osc.stop(audioCtx.currentTime + 0.2);
        }
    }, 200); // 300bpm-ish (fast paced)
}

function stopMusic() {
    if (musicInterval) clearInterval(musicInterval);
}

function playerJump() {
    if (player.grounded || player.y > 250) {
        player.vy = -14;
        player.grounded = false;
        playSound('jump');
    }
}

function updateScoreUI() {
    // Score is now drawn in drawUI
}

// Entities
const player = {
    x: 100,
    y: 300,
    width: 50,
    height: 50,
    vy: 0,
    grounded: false,
    invulnerable: 0
};

let obstacles = [];
let collectibles = [];
let bgCharacters = [];

function gameLoop() {
    if (gameState !== 'PLAYING') return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    gameTick++;
    if (player.invulnerable > 0) player.invulnerable--;

    updatePhysics();
    spawnEntities();
    checkCollisions();
    updateScene();

    drawBackground();
    drawBgCharacters();
    drawBgCreatures();
    drawEntities();
    drawUI();

    requestAnimationFrame(gameLoop);
}

function updatePhysics() {
    player.vy += 0.4; // Low gravity
    player.y += player.vy;

    if (player.y >= 350) {
        player.y = 350;
        player.vy = 0;
        player.grounded = true;
    }

    // Scroll speed (slowed down for better gameplay)
    obstacles.forEach(o => o.x -= 2);
    collectibles.forEach(c => c.x -= 2);
    bgCharacters.forEach(b => b.x -= 1.5);
    bgCreatures.forEach(c => {
        c.x -= c.speed;
        c.y += Math.sin(gameTick * c.wobbleSpeed + c.wobbleOffset) * 0.3;
    });

    obstacles = obstacles.filter(o => o.x + o.width > 0);
    collectibles = collectibles.filter(c => c.x + c.width > 0);
    bgCharacters = bgCharacters.filter(b => b.x + b.width > -100);
    bgCreatures = bgCreatures.filter(c => c.x > -60);
}

function spawnEntities() {
    // 1. Bg Characters (in the background, smaller & higher)
    if (Math.random() < 0.005) {
        const friends = ['Patrick', 'Squidward', 'Gary'];
        const type = friends[Math.floor(Math.random() * friends.length)];
        bgCharacters.push({
            x: 800,
            y: 200 + Math.random() * 80, // Mid-background, NOT on the course
            width: 25,
            height: 38,
            type: type
        });
    }

    // 2. Obstacles (only blocks now — jellyfish are background creatures)
    if (obstacles.length === 0 || (800 - obstacles[obstacles.length - 1].x > 300)) {
        if (Math.random() < 0.01) {
            const typeProb = Math.random();
            let newObstacle;

            if (typeProb < 0.55) {
                newObstacle = { x: 800, y: 350, width: 40, height: 40, type: 'block' };
            } else {
                newObstacle = { x: 800, y: 330, width: 40, height: 60, type: 'tall_block' };
            }
            obstacles.push(newObstacle);
        }
    }

    // 3. Background swimming creatures (jellyfish & fish — NOT enemies)
    if (Math.random() < 0.008 && bgCreatures.length < 8) {
        const creatureTypes = ['jellyfish', 'fish_blue', 'fish_yellow', 'fish_green'];
        const type = creatureTypes[Math.floor(Math.random() * creatureTypes.length)];
        const yPos = 80 + Math.random() * 250; // Swim anywhere above the ground
        bgCreatures.push({
            x: 820,
            y: yPos,
            type: type,
            speed: 0.6 + Math.random() * 0.8, // Gentle swim speed
            wobbleSpeed: 0.02 + Math.random() * 0.03,
            wobbleOffset: Math.random() * Math.PI * 2
        });
    }

    // 3. Collectibles
    if (Math.random() < 0.01) {
        collectibles.push({ x: 800, y: 250 - Math.random() * 50, width: 30, height: 30, type: 'patty' });
    }
}

function checkCollisions() {
    const padding = 12;

    obstacles.forEach(o => {
        if (player.x + padding < o.x + o.width - padding &&
            player.x + player.width - padding > o.x + padding &&
            player.y + padding < o.y + o.height - padding &&
            player.y + player.height - padding > o.y + padding) {

            if (player.invulnerable <= 0) {
                lives--;
                player.invulnerable = 60; // 1s invincibility

                // Hurt Sound
                if (audioCtx && audioCtx.state !== 'suspended') {
                    const osc = audioCtx.createOscillator();
                    const gain = audioCtx.createGain();
                    osc.connect(gain);
                    gain.connect(audioCtx.destination);
                    osc.type = 'sawtooth';
                    osc.frequency.setValueAtTime(150, audioCtx.currentTime);
                    osc.frequency.exponentialRampToValueAtTime(50, audioCtx.currentTime + 0.2);
                    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
                    gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.2);
                    osc.start();
                    osc.stop(audioCtx.currentTime + 0.2);
                }

                if (lives <= 0) {
                    gameState = 'GAMEOVER';
                    gameOverScreen.classList.remove('hidden');
                    finalScoreDisplay.innerText = score;
                    playSound('gameover');
                    stopMusic();
                }
            }
        }
    });

    collectibles.forEach((c, index) => {
        if (player.x < c.x + c.width &&
            player.x + player.width > c.x &&
            player.y < c.y + c.height &&
            player.y + player.height > c.y) {

            score++;

            // BONUS LIFE every 10 points (max 6)
            if (score % 10 === 0) {
                if (lives < 6) {
                    lives++;
                    playSound('collect'); // Re-use collect sound or make 'powerup'
                    // Maybe powerup sound?
                }
            }

            collectibles.splice(index, 1);
            playSound('collect');
        }
    });
}

function updateScene() {
    sceneTimer++;
    if (sceneTimer > 1200) { // Switch every 20 seconds for more variety
        sceneTimer = 0;
        switchScene();
    }
}

function switchScene() {
    const sequence = ['BIKINI_BOTTOM', 'KELP_FOREST', 'GOO_LAGOON', 'JELLYFISH_FIELDS', 'CHUM_BUCKET', 'DEEP_OCEAN', 'GLOVE_WORLD', 'KRUSTY_KRAB', 'FLYING_DUTCHMAN', 'BOATING_SCHOOL'];
    let idx = sequence.indexOf(currentScene);
    idx = (idx + 1) % sequence.length;
    currentScene = sequence[idx];
    console.log("Scene: " + currentScene);
}

function drawBackground() {
    // 1. Sky/Base Color (all underwater!)
    let skyColor = '#6EC6E6'; // Bikini Bottom ocean blue (from the show)
    if (currentScene === 'KELP_FOREST') skyColor = '#1B5E4B';
    if (currentScene === 'JELLYFISH_FIELDS') skyColor = '#7DD4F0';
    if (currentScene === 'DEEP_OCEAN') skyColor = '#050520';
    if (currentScene === 'KRUSTY_KRAB') skyColor = '#D4956B';
    if (currentScene === 'GOO_LAGOON') skyColor = '#4FC3F7';
    if (currentScene === 'CHUM_BUCKET') skyColor = '#2C3E50';
    if (currentScene === 'GLOVE_WORLD') skyColor = '#9B59B6';
    if (currentScene === 'FLYING_DUTCHMAN') skyColor = '#1A3A2A';
    if (currentScene === 'BOATING_SCHOOL') skyColor = '#87CEEB';

    ctx.fillStyle = skyColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 2. Background Details
    if (currentScene === 'BIKINI_BOTTOM') {
        // --- Iconic Bikini Bottom skyline ---
        // Sandy ocean floor gradient at bottom
        let grad = ctx.createLinearGradient(0, 300, 0, 400);
        grad.addColorStop(0, 'rgba(230, 194, 136, 0)');
        grad.addColorStop(1, 'rgba(230, 194, 136, 0.4)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 300, canvas.width, 100);

        // SpongeBob's Pineapple House (scrolling background)
        let houseX = (200 - gameTick / 5) % (canvas.width + 300);
        if (houseX < -100) houseX += canvas.width + 300;
        ctx.globalAlpha = 0.6;
        // Pineapple body
        ctx.fillStyle = '#FF8C00';
        ctx.beginPath();
        ctx.ellipse(houseX + 25, 280, 28, 50, 0, 0, Math.PI * 2);
        ctx.fill();
        // Pineapple cross-hatch pattern
        ctx.strokeStyle = '#CC6600';
        ctx.lineWidth = 1;
        for (let i = -40; i < 40; i += 12) {
            ctx.beginPath();
            ctx.moveTo(houseX, 280 + i); ctx.lineTo(houseX + 50, 280 + i);
            ctx.stroke();
        }
        // Pineapple leaves
        ctx.fillStyle = '#228B22';
        ctx.beginPath();
        ctx.ellipse(houseX + 25, 225, 8, 20, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(houseX + 15, 228, 6, 18, -0.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(houseX + 35, 228, 6, 18, 0.4, 0, Math.PI * 2);
        ctx.fill();
        // Door
        ctx.fillStyle = '#654321';
        ctx.beginPath();
        ctx.arc(houseX + 25, 310, 8, Math.PI, 0);
        ctx.fillRect(houseX + 17, 310, 16, 15);
        ctx.fill();
        // Window (porthole)
        ctx.fillStyle = '#87CEEB';
        ctx.beginPath(); ctx.arc(houseX + 25, 280, 6, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#A0A0A0'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(houseX + 25, 280, 6, 0, Math.PI * 2); ctx.stroke();

        // Squidward's Easter Island Head House
        let squidX = (450 - gameTick / 5) % (canvas.width + 300);
        if (squidX < -80) squidX += canvas.width + 300;
        ctx.fillStyle = '#708090';
        // Head shape
        ctx.beginPath();
        ctx.moveTo(squidX + 10, 330);
        ctx.lineTo(squidX + 5, 260);
        ctx.lineTo(squidX + 15, 245);
        ctx.lineTo(squidX + 35, 245);
        ctx.lineTo(squidX + 45, 260);
        ctx.lineTo(squidX + 40, 330);
        ctx.fill();
        // Nose
        ctx.fillStyle = '#607080';
        ctx.beginPath();
        ctx.moveTo(squidX + 25, 270);
        ctx.lineTo(squidX + 20, 300);
        ctx.lineTo(squidX + 30, 300);
        ctx.fill();
        // Eyes (window holes)
        ctx.fillStyle = '#4682B4';
        ctx.fillRect(squidX + 14, 265, 8, 8);
        ctx.fillRect(squidX + 28, 265, 8, 8);

        // Patrick's Rock
        let patX = (650 - gameTick / 5) % (canvas.width + 300);
        if (patX < -60) patX += canvas.width + 300;
        ctx.fillStyle = '#8B7355';
        ctx.beginPath();
        ctx.moveTo(patX, 340);
        ctx.quadraticCurveTo(patX + 25, 290, patX + 50, 340);
        ctx.fill();
        ctx.globalAlpha = 1.0;

        // Scattered coral
        ctx.fillStyle = 'rgba(255, 120, 100, 0.35)';
        for (let c = 0; c < 4; c++) {
            let cx = (c * 250 + 80 - gameTick / 6) % (canvas.width + 200);
            if (cx < -30) cx += canvas.width + 200;
            ctx.beginPath();
            ctx.moveTo(cx, 390);
            ctx.lineTo(cx + 8, 355);
            ctx.lineTo(cx + 16, 365);
            ctx.lineTo(cx + 24, 350);
            ctx.lineTo(cx + 32, 390);
            ctx.fill();
        }
    }
    else if (currentScene === 'KELP_FOREST') {
        // --- Dark, dense underwater kelp forest ---
        // Murky water gradient
        let grad = ctx.createLinearGradient(0, 0, 0, 400);
        grad.addColorStop(0, 'rgba(0, 50, 30, 0.3)');
        grad.addColorStop(1, 'rgba(0, 80, 40, 0.5)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, canvas.width, 400);

        // Far background kelp (thin, faded)
        ctx.globalAlpha = 0.3;
        ctx.fillStyle = '#2E5E2E';
        for (let k = 0; k < 12; k++) {
            let kx = (k * 90 - gameTick / 6) % (canvas.width + 100);
            if (kx < -20) kx += canvas.width + 100;
            // Wavy stalk
            ctx.beginPath();
            ctx.moveTo(kx, 400);
            for (let y = 400; y > 50; y -= 5) {
                let wave = Math.sin((y + gameTick * 0.3) / 40) * 8;
                ctx.lineTo(kx + wave, y);
            }
            ctx.lineTo(kx + 12, 50);
            for (let y = 50; y < 400; y += 5) {
                let wave = Math.sin((y + gameTick * 0.3) / 40) * 8;
                ctx.lineTo(kx + 12 + wave, y);
            }
            ctx.fill();
        }
        ctx.globalAlpha = 1.0;

        // Foreground kelp (thicker, detailed)
        ctx.fillStyle = '#006400';
        for (let k = 0; k < 6; k++) {
            let kx = (k * 160 - gameTick / 3) % (canvas.width + 150);
            if (kx < -30) kx += canvas.width + 150;
            // Stalk
            ctx.fillRect(kx, 80, 15, 320);
            // Leaves on alternating sides
            ctx.fillStyle = '#228B22';
            ctx.beginPath();
            ctx.ellipse(kx + 25, 150, 25, 8, 0.3, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.ellipse(kx - 10, 220, 22, 7, -0.3, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.ellipse(kx + 20, 300, 20, 6, 0.2, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#006400';
        }

        // Light rays filtering through
        ctx.globalAlpha = 0.08;
        ctx.fillStyle = '#98FB98';
        for (let r = 0; r < 4; r++) {
            let rx = (r * 220 + 50 - gameTick / 10) % (canvas.width + 200);
            if (rx < -40) rx += canvas.width + 200;
            ctx.beginPath();
            ctx.moveTo(rx, 0);
            ctx.lineTo(rx + 30, 0);
            ctx.lineTo(rx + 60, 400);
            ctx.lineTo(rx - 30, 400);
            ctx.fill();
        }
        ctx.globalAlpha = 1.0;
    }
    else if (currentScene === 'JELLYFISH_FIELDS') {
        // --- Bright green fields from the show ---
        // Lighter water at top
        let grad = ctx.createLinearGradient(0, 0, 0, 400);
        grad.addColorStop(0, '#7DD4F0');
        grad.addColorStop(1, '#5ABFA0');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, canvas.width, 400);

        // Rolling green hills (layered for depth)
        // Far hills
        ctx.fillStyle = '#6DBF6D';
        ctx.beginPath();
        ctx.moveTo(0, 400);
        for (let x = 0; x <= canvas.width; x += 8) {
            ctx.lineTo(x, 340 + Math.sin((x + gameTick * 0.2) / 120) * 25);
        }
        ctx.lineTo(canvas.width, 400);
        ctx.fill();

        // Near hills
        ctx.fillStyle = '#4CAF50';
        ctx.beginPath();
        ctx.moveTo(0, 400);
        for (let x = 0; x <= canvas.width; x += 8) {
            ctx.lineTo(x, 360 + Math.sin((x + gameTick * 0.3 + 100) / 90) * 20);
        }
        ctx.lineTo(canvas.width, 400);
        ctx.fill();

        // Floating jellyfish (iconic to the show)
        const jellyColors = ['#FF69B4', '#DA70D6', '#FF6EB4', '#BA55D3', '#FF82AB'];
        ctx.globalAlpha = 0.4;
        for (let j = 0; j < 8; j++) {
            let jx = (j * 120 - gameTick * 0.2) % (canvas.width + 100);
            if (jx < -20) jx += canvas.width + 100;
            let jy = 60 + (j * 35) % 180 + Math.sin(gameTick * 0.025 + j * 1.5) * 20;
            ctx.fillStyle = jellyColors[j % jellyColors.length];
            // Bell
            ctx.beginPath();
            ctx.arc(jx, jy, 10 + (j % 3) * 3, Math.PI, 0);
            ctx.fill();
            // Tentacles
            ctx.strokeStyle = jellyColors[j % jellyColors.length];
            ctx.lineWidth = 1;
            for (let t = 0; t < 3; t++) {
                ctx.beginPath();
                ctx.moveTo(jx - 5 + t * 5, jy);
                for (let s = 0; s < 12; s += 3) {
                    ctx.lineTo(jx - 5 + t * 5 + Math.sin(gameTick * 0.06 + t + s) * 3, jy + s);
                }
                ctx.stroke();
            }
        }
        ctx.globalAlpha = 1.0;

        // Colorful sea flowers (from the show - tall stalks with round flowers)
        const flowerColors = ['#FF6347', '#FFD700', '#FF69B4', '#9370DB', '#00CED1', '#FF4500'];
        for (let f = 0; f < 10; f++) {
            let fx = (f * 95 - gameTick / 4) % (canvas.width + 100);
            if (fx < -15) fx += canvas.width + 100;
            let stemH = 25 + (f % 3) * 10;
            // Stem
            ctx.fillStyle = '#2E8B57';
            ctx.fillRect(fx + 3, 388 - stemH, 3, stemH);
            // Flower head
            ctx.fillStyle = flowerColors[f % flowerColors.length];
            ctx.beginPath();
            ctx.arc(fx + 4, 386 - stemH, 5, 0, Math.PI * 2);
            ctx.fill();
            // Center
            ctx.fillStyle = '#FFD700';
            ctx.beginPath();
            ctx.arc(fx + 4, 386 - stemH, 2, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    else if (currentScene === 'DEEP_OCEAN') {
        // --- Rock Bottom / Deep ocean from the show ---
        // Very dark gradient
        let grad = ctx.createLinearGradient(0, 0, 0, 400);
        grad.addColorStop(0, '#050520');
        grad.addColorStop(0.5, '#0A0A40');
        grad.addColorStop(1, '#0D0D30');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, canvas.width, 400);

        // Bioluminescent particles (flickering)
        for (let i = 0; i < 40; i++) {
            let bx = (i * 73 + gameTick * 0.3) % canvas.width;
            let by = (i * 31 + 20) % 350;
            let brightness = Math.abs(Math.sin(gameTick / 15 + i * 0.7));
            let colors = ['#00FFFF', '#7FFFD4', '#00FF7F', '#FF69B4', '#FFD700'];
            ctx.fillStyle = colors[i % colors.length];
            ctx.globalAlpha = brightness * 0.5;
            let size = 2 + (i % 3);
            ctx.beginPath();
            ctx.arc(bx, by, size, 0, Math.PI * 2);
            ctx.fill();
            // Glow effect
            ctx.globalAlpha = brightness * 0.15;
            ctx.beginPath();
            ctx.arc(bx, by, size * 3, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1.0;

        // Angler fish light in far background
        let anglerX = (500 - gameTick / 8) % (canvas.width + 200);
        if (anglerX < -40) anglerX += canvas.width + 200;
        ctx.globalAlpha = 0.4;
        // Light lure
        ctx.fillStyle = '#FFFF00';
        ctx.beginPath();
        ctx.arc(anglerX, 150, 5 + Math.sin(gameTick * 0.1) * 2, 0, Math.PI * 2);
        ctx.fill();
        // Glow
        ctx.globalAlpha = 0.1;
        ctx.fillStyle = '#FFFF80';
        ctx.beginPath();
        ctx.arc(anglerX, 150, 25, 0, Math.PI * 2);
        ctx.fill();
        // Body silhouette
        ctx.globalAlpha = 0.3;
        ctx.fillStyle = '#0A0A30';
        ctx.beginPath();
        ctx.ellipse(anglerX + 15, 165, 20, 12, 0.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;

        // Spooky rock formations
        ctx.fillStyle = '#1A1A3A';
        for (let r = 0; r < 5; r++) {
            let rx = (r * 190 - gameTick / 6) % (canvas.width + 150);
            if (rx < -60) rx += canvas.width + 150;
            ctx.beginPath();
            ctx.moveTo(rx, 400);
            ctx.lineTo(rx + 15, 340 - r * 10);
            ctx.lineTo(rx + 30, 350);
            ctx.lineTo(rx + 45, 335 - r * 5);
            ctx.lineTo(rx + 60, 400);
            ctx.fill();
        }
    }
    else if (currentScene === 'KRUSTY_KRAB') {
        // --- Krusty Krab interior (warm, cozy restaurant) ---
        // Warm wooden walls
        ctx.fillStyle = '#C4956B';
        ctx.fillRect(0, 0, canvas.width, 400);

        // Wood plank texture
        ctx.strokeStyle = '#A67B55';
        ctx.lineWidth = 1;
        for (let i = 0; i < 10; i++) {
            ctx.beginPath();
            ctx.moveTo(0, i * 42);
            ctx.lineTo(canvas.width, i * 42);
            ctx.stroke();
        }
        // Vertical plank seams
        ctx.strokeStyle = 'rgba(120, 80, 40, 0.3)';
        for (let v = 0; v < 10; v++) {
            let vx = v * 100 + 50;
            ctx.beginPath();
            ctx.moveTo(vx, 0);
            ctx.lineTo(vx, 400);
            ctx.stroke();
        }

        // Port-hole windows (round, like a boat)
        for (let w = 0; w < 3; w++) {
            let wx = (w * 280 + 100 - gameTick / 10) % (canvas.width + 200);
            if (wx < -40) wx += canvas.width + 200;
            // Window frame
            ctx.fillStyle = '#A0A0A0';
            ctx.beginPath(); ctx.arc(wx, 120, 28, 0, Math.PI * 2); ctx.fill();
            // Glass (ocean view)
            ctx.fillStyle = '#6EC6E6';
            ctx.beginPath(); ctx.arc(wx, 120, 22, 0, Math.PI * 2); ctx.fill();
            // Cross frame
            ctx.strokeStyle = '#808080';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(wx - 22, 120); ctx.lineTo(wx + 22, 120);
            ctx.moveTo(wx, 98); ctx.lineTo(wx, 142);
            ctx.stroke();
            // Bolts
            ctx.fillStyle = '#606060';
            for (let b = 0; b < 8; b++) {
                let angle = b * Math.PI / 4;
                ctx.beginPath();
                ctx.arc(wx + Math.cos(angle) * 25, 120 + Math.sin(angle) * 25, 2, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        // Ordering counter
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(0, 280, canvas.width, 15);
        ctx.fillStyle = '#A0522D';
        ctx.fillRect(0, 275, canvas.width, 5);

        // Menu board on wall
        let menuX = (400 - gameTick / 10) % (canvas.width + 250);
        if (menuX < -100) menuX += canvas.width + 250;
        ctx.fillStyle = '#2F4F4F';
        ctx.fillRect(menuX, 40, 110, 80);
        ctx.strokeStyle = '#8B4513';
        ctx.lineWidth = 3;
        ctx.strokeRect(menuX, 40, 110, 80);
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 12px monospace';
        ctx.fillText('GALLEY GRUB', menuX + 8, 58);
        ctx.fillStyle = 'white';
        ctx.font = '9px monospace';
        ctx.fillText('Krabby Patty  $1', menuX + 8, 75);
        ctx.fillText('Kelp Shake   $1', menuX + 8, 88);
        ctx.fillText('Coral Bits   $1', menuX + 8, 101);
        ctx.fillText('Seafoam Soda $1', menuX + 8, 114);
    }
    else if (currentScene === 'GOO_LAGOON') {
        // --- Goo Lagoon (underwater beach) ---
        // Beach sand gradient
        let grad = ctx.createLinearGradient(0, 250, 0, 400);
        grad.addColorStop(0, 'rgba(244, 220, 160, 0)');
        grad.addColorStop(1, 'rgba(244, 220, 160, 0.6)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 250, canvas.width, 150);

        // Lifeguard tower
        let towerX = (350 - gameTick / 8) % (canvas.width + 300);
        if (towerX < -80) towerX += canvas.width + 300;
        ctx.globalAlpha = 0.5;
        // Legs
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(towerX + 5, 280, 5, 110);
        ctx.fillRect(towerX + 50, 280, 5, 110);
        // Platform
        ctx.fillStyle = '#DEB887';
        ctx.fillRect(towerX, 260, 60, 25);
        // Roof
        ctx.fillStyle = '#FF6347';
        ctx.beginPath();
        ctx.moveTo(towerX - 5, 260);
        ctx.lineTo(towerX + 30, 240);
        ctx.lineTo(towerX + 65, 260);
        ctx.fill();
        ctx.globalAlpha = 1.0;

        // Beach umbrellas
        const umbrellaColors = ['#FF4500', '#1E90FF', '#FFD700'];
        for (let u = 0; u < 3; u++) {
            let ux = (u * 280 + 100 - gameTick / 6) % (canvas.width + 200);
            if (ux < -40) ux += canvas.width + 200;
            ctx.globalAlpha = 0.45;
            ctx.fillStyle = '#8B4513';
            ctx.fillRect(ux + 18, 300, 4, 90);
            ctx.fillStyle = umbrellaColors[u];
            ctx.beginPath();
            ctx.arc(ux + 20, 300, 25, Math.PI, 0);
            ctx.fill();
            // Stripes
            ctx.fillStyle = 'rgba(255,255,255,0.3)';
            ctx.beginPath();
            ctx.moveTo(ux + 20, 275); ctx.lineTo(ux + 10, 300); ctx.lineTo(ux + 20, 300);
            ctx.fill();
            ctx.beginPath();
            ctx.moveTo(ux + 20, 275); ctx.lineTo(ux + 30, 300); ctx.lineTo(ux + 40, 300);
            ctx.fill();
            ctx.globalAlpha = 1.0;
        }

        // Goo (green gooey water patches)
        ctx.fillStyle = 'rgba(100, 200, 100, 0.25)';
        for (let g = 0; g < 5; g++) {
            let gx = (g * 200 + 50 - gameTick / 5) % (canvas.width + 150);
            if (gx < -40) gx += canvas.width + 150;
            ctx.beginPath();
            ctx.ellipse(gx, 380, 35, 8, 0, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    else if (currentScene === 'CHUM_BUCKET') {
        // --- Chum Bucket (Plankton's restaurant) ---
        // Dark industrial atmosphere
        let grad = ctx.createLinearGradient(0, 0, 0, 400);
        grad.addColorStop(0, '#2C3E50');
        grad.addColorStop(1, '#1A252F');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, canvas.width, 400);

        // The Chum Bucket building (bucket shape)
        let bucketX = (400 - gameTick / 7) % (canvas.width + 350);
        if (bucketX < -120) bucketX += canvas.width + 350;
        ctx.globalAlpha = 0.55;
        // Bucket body
        ctx.fillStyle = '#27AE60';
        ctx.beginPath();
        ctx.moveTo(bucketX, 220);
        ctx.lineTo(bucketX + 20, 350);
        ctx.lineTo(bucketX + 100, 350);
        ctx.lineTo(bucketX + 120, 220);
        ctx.fill();
        // Bucket rim
        ctx.fillStyle = '#2ECC71';
        ctx.fillRect(bucketX - 5, 215, 130, 12);
        // Handle
        ctx.strokeStyle = '#2ECC71';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(bucketX + 60, 200, 35, Math.PI, 0);
        ctx.stroke();
        // Label
        ctx.fillStyle = '#ECF0F1';
        ctx.font = 'bold 10px monospace';
        ctx.fillText('CHUM', bucketX + 38, 275);
        ctx.fillText('BUCKET', bucketX + 32, 290);
        // Glowing eye (Plankton's computer wife Karen)
        ctx.fillStyle = '#00FF00';
        ctx.fillRect(bucketX + 40, 305, 40, 25);
        ctx.fillStyle = '#003300';
        ctx.fillRect(bucketX + 42, 307, 36, 21);
        ctx.fillStyle = '#00FF00';
        let scanLine = (gameTick * 2) % 21;
        ctx.fillRect(bucketX + 42, 307 + scanLine, 36, 2);
        ctx.globalAlpha = 1.0;

        // Scattered nuts and bolts (industrial feel)
        ctx.fillStyle = 'rgba(150, 150, 150, 0.3)';
        for (let n = 0; n < 6; n++) {
            let nx = (n * 160 + 30 - gameTick / 5) % (canvas.width + 100);
            if (nx < -10) nx += canvas.width + 100;
            ctx.beginPath();
            ctx.arc(nx, 370 + (n % 3) * 5, 3, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    else if (currentScene === 'GLOVE_WORLD') {
        // --- Glove World! (amusement park) ---
        // Fun purple/pink sky
        let grad = ctx.createLinearGradient(0, 0, 0, 400);
        grad.addColorStop(0, '#9B59B6');
        grad.addColorStop(1, '#E91E63');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, canvas.width, 400);

        // Ferris wheel in background
        let wheelX = (500 - gameTick / 10) % (canvas.width + 300);
        if (wheelX < -100) wheelX += canvas.width + 300;
        ctx.globalAlpha = 0.4;
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(wheelX, 180, 80, 0, Math.PI * 2);
        ctx.stroke();
        // Spokes
        for (let s = 0; s < 8; s++) {
            let angle = s * Math.PI / 4 + gameTick * 0.005;
            ctx.beginPath();
            ctx.moveTo(wheelX, 180);
            ctx.lineTo(wheelX + Math.cos(angle) * 80, 180 + Math.sin(angle) * 80);
            ctx.stroke();
            // Gondola
            ctx.fillStyle = ['#FF6347', '#4169E1', '#FFD700', '#32CD32'][s % 4];
            ctx.fillRect(wheelX + Math.cos(angle) * 80 - 6, 180 + Math.sin(angle) * 80 - 4, 12, 8);
        }
        // Support pillar
        ctx.fillStyle = '#808080';
        ctx.fillRect(wheelX - 5, 260, 10, 130);
        ctx.globalAlpha = 1.0;

        // Glove-shaped balloons
        const balloonColors = ['#FF69B4', '#87CEEB', '#98FB98', '#DDA0DD', '#FFD700'];
        for (let b = 0; b < 5; b++) {
            let bx = (b * 180 + 80 - gameTick / 5) % (canvas.width + 200);
            if (bx < -25) bx += canvas.width + 200;
            let by = 100 + b * 40 + Math.sin(gameTick * 0.03 + b) * 10;
            ctx.globalAlpha = 0.5;
            // Balloon (glove shape - palm + fingers)
            ctx.fillStyle = balloonColors[b];
            ctx.beginPath();
            ctx.ellipse(bx, by, 10, 12, 0, 0, Math.PI * 2);
            ctx.fill();
            // Fingers
            for (let f = 0; f < 4; f++) {
                let angle = -0.8 + f * 0.5;
                ctx.beginPath();
                ctx.ellipse(bx + Math.cos(angle) * 10, by + Math.sin(angle) * 10 - 8, 3, 6, angle, 0, Math.PI * 2);
                ctx.fill();
            }
            // String
            ctx.strokeStyle = balloonColors[b];
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(bx, by + 12);
            ctx.lineTo(bx + Math.sin(gameTick * 0.02 + b) * 5, by + 35);
            ctx.stroke();
            ctx.globalAlpha = 1.0;
        }

        // "GLOVE WORLD!" sign
        let signX = (200 - gameTick / 8) % (canvas.width + 250);
        if (signX < -120) signX += canvas.width + 250;
        ctx.globalAlpha = 0.6;
        ctx.fillStyle = '#FF4500';
        ctx.fillRect(signX, 50, 150, 40);
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 14px monospace';
        ctx.fillText('GLOVE WORLD!', signX + 10, 76);
        ctx.globalAlpha = 1.0;
    }
    else if (currentScene === 'FLYING_DUTCHMAN') {
        // --- Flying Dutchman's ship (spooky green waters) ---
        // Eerie green fog
        let grad = ctx.createLinearGradient(0, 0, 0, 400);
        grad.addColorStop(0, '#0D2818');
        grad.addColorStop(0.5, '#1A3A2A');
        grad.addColorStop(1, '#0A2010');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, canvas.width, 400);

        // Ghost ship silhouette
        let shipX = (400 - gameTick / 12) % (canvas.width + 400);
        if (shipX < -200) shipX += canvas.width + 400;
        ctx.globalAlpha = 0.35;
        // Hull
        ctx.fillStyle = '#2F4F2F';
        ctx.beginPath();
        ctx.moveTo(shipX, 250);
        ctx.lineTo(shipX + 30, 300);
        ctx.lineTo(shipX + 170, 300);
        ctx.lineTo(shipX + 200, 250);
        ctx.lineTo(shipX + 210, 240);
        ctx.fill();
        // Mast
        ctx.fillStyle = '#3B3B3B';
        ctx.fillRect(shipX + 80, 120, 5, 130);
        ctx.fillRect(shipX + 140, 150, 4, 100);
        // Torn sails
        ctx.fillStyle = '#556B4E';
        ctx.beginPath();
        ctx.moveTo(shipX + 85, 130);
        ctx.lineTo(shipX + 85, 200);
        ctx.lineTo(shipX + 130, 190);
        ctx.lineTo(shipX + 130, 140);
        ctx.fill();
        // Skull flag
        ctx.fillStyle = '#333';
        ctx.fillRect(shipX + 78, 115, 12, 10);
        ctx.fillStyle = '#ADFF2F';
        ctx.beginPath(); ctx.arc(shipX + 84, 118, 3, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = 1.0;

        // Ghostly green particles
        for (let g = 0; g < 25; g++) {
            let gx = (g * 67 + gameTick * 0.4) % canvas.width;
            let gy = (g * 41 + 30) % 380;
            let brightness = Math.abs(Math.sin(gameTick / 12 + g * 0.8));
            ctx.fillStyle = '#ADFF2F';
            ctx.globalAlpha = brightness * 0.3;
            ctx.beginPath();
            ctx.arc(gx, gy, 2 + (g % 2), 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1.0;

        // Floating treasure chests
        for (let t = 0; t < 2; t++) {
            let tx = (t * 400 + 200 - gameTick / 6) % (canvas.width + 200);
            if (tx < -30) tx += canvas.width + 200;
            ctx.globalAlpha = 0.4;
            ctx.fillStyle = '#8B6914';
            ctx.fillRect(tx, 350, 25, 18);
            ctx.fillStyle = '#FFD700';
            ctx.fillRect(tx + 8, 348, 9, 4);
            ctx.globalAlpha = 1.0;
        }
    }
    else if (currentScene === 'BOATING_SCHOOL') {
        // --- Mrs. Puff's Boating School ---
        // Nice school-day blue
        let grad = ctx.createLinearGradient(0, 0, 0, 400);
        grad.addColorStop(0, '#87CEEB');
        grad.addColorStop(1, '#B0E0E6');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, canvas.width, 400);

        // School building
        let schoolX = (300 - gameTick / 8) % (canvas.width + 400);
        if (schoolX < -160) schoolX += canvas.width + 400;
        ctx.globalAlpha = 0.5;
        // Building
        ctx.fillStyle = '#E8D4A0';
        ctx.fillRect(schoolX, 200, 150, 180);
        // Roof
        ctx.fillStyle = '#CC3333';
        ctx.beginPath();
        ctx.moveTo(schoolX - 10, 200);
        ctx.lineTo(schoolX + 75, 160);
        ctx.lineTo(schoolX + 160, 200);
        ctx.fill();
        // Sign
        ctx.fillStyle = '#2196F3';
        ctx.fillRect(schoolX + 25, 210, 100, 25);
        ctx.fillStyle = 'white';
        ctx.font = 'bold 8px monospace';
        ctx.fillText('MRS. PUFFS', schoolX + 30, 222);
        ctx.fillText('BOATING SCHOOL', schoolX + 27, 232);
        // Windows
        ctx.fillStyle = '#87CEEB';
        ctx.fillRect(schoolX + 20, 250, 25, 25);
        ctx.fillRect(schoolX + 55, 250, 25, 25);
        ctx.fillRect(schoolX + 100, 250, 25, 25);
        // Door
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(schoolX + 60, 320, 30, 60);
        ctx.globalAlpha = 1.0;

        // Driving cones
        const coneColors = ['#FF6600', '#FF6600', '#FF6600'];
        for (let cone = 0; cone < 6; cone++) {
            let cx = (cone * 150 + 50 - gameTick / 4) % (canvas.width + 100);
            if (cx < -15) cx += canvas.width + 100;
            ctx.globalAlpha = 0.5;
            ctx.fillStyle = '#FF6600';
            ctx.beginPath();
            ctx.moveTo(cx, 390);
            ctx.lineTo(cx + 6, 365);
            ctx.lineTo(cx + 12, 390);
            ctx.fill();
            // White stripes
            ctx.fillStyle = 'white';
            ctx.fillRect(cx + 3, 375, 6, 3);
            ctx.globalAlpha = 1.0;
        }

        // Road markings in background
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 2;
        ctx.setLineDash([15, 15]);
        let dashOffset = (gameTick * 2) % 30;
        ctx.lineDashOffset = -dashOffset;
        ctx.beginPath();
        ctx.moveTo(0, 370);
        ctx.lineTo(canvas.width, 370);
        ctx.stroke();
        ctx.setLineDash([]);
    }

    // Underwater bubbles on ALL scenes
    drawUnderwaterBubbles();

    // 3. Scrolling Ground (Blocks)
    drawScrollingGround();
}

function drawFlowerCloud(x, y) {
    ctx.beginPath();
    ctx.arc(x, y, 30, 0, Math.PI * 2);
    ctx.arc(x + 40, y, 30, 0, Math.PI * 2);
    ctx.arc(x + 20, y - 30, 30, 0, Math.PI * 2);
    ctx.arc(x + 20, y + 30, 30, 0, Math.PI * 2);
    ctx.fill();
    // Center dot
    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(x + 20, y, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalCompositeOperation = 'source-over';
}

function drawUnderwaterBubbles() {
    // Subtle floating bubbles on every scene
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 12; i++) {
        let bx = (i * 73 + gameTick * 0.4) % canvas.width;
        let by = (300 - (gameTick * 0.3 + i * 50) % 350);
        if (by < -10) by += 350;
        let radius = 2 + (i % 3);
        ctx.beginPath();
        ctx.arc(bx, by, radius, 0, Math.PI * 2);
        ctx.stroke();
    }
}

function drawScrollingGround() {
    let blockWidth = 40;
    let scrollSpeed = 2;
    let offset = (gameTick * scrollSpeed) % blockWidth;

    // Ground Color based on scene (all underwater-themed)
    let mainColor = '#E6C288'; // Sandy ocean floor
    let detailColor = '#D6B278';

    if (currentScene === 'KELP_FOREST') { mainColor = '#556B2F'; detailColor = '#6B8E23'; }
    if (currentScene === 'JELLYFISH_FIELDS') { mainColor = '#7CCD7C'; detailColor = '#548B54'; }
    if (currentScene === 'DEEP_OCEAN') { mainColor = '#483D8B'; detailColor = '#2F4F4F'; }
    if (currentScene === 'KRUSTY_KRAB') { mainColor = '#CD853F'; detailColor = '#A0522D'; }
    if (currentScene === 'GOO_LAGOON') { mainColor = '#F4DC96'; detailColor = '#DAC070'; }
    if (currentScene === 'CHUM_BUCKET') { mainColor = '#34495E'; detailColor = '#2C3E50'; }
    if (currentScene === 'GLOVE_WORLD') { mainColor = '#8E44AD'; detailColor = '#7D3C98'; }
    if (currentScene === 'FLYING_DUTCHMAN') { mainColor = '#1C3A1C'; detailColor = '#0D2D0D'; }
    if (currentScene === 'BOATING_SCHOOL') { mainColor = '#808080'; detailColor = '#696969'; }

    for (let x = -blockWidth; x < canvas.width + blockWidth; x += blockWidth) {
        let drawX = x - offset;
        let groundY = 400;

        ctx.fillStyle = mainColor;
        ctx.fillRect(drawX, groundY, blockWidth, blockWidth);

        // Krusty Krab checkered red/cream floor (like the show!)
        if (currentScene === 'KRUSTY_KRAB') {
            let tileIdx = Math.floor((drawX + offset) / blockWidth);
            if (tileIdx % 2 === 0) {
                ctx.fillStyle = '#CC3333'; // Red tile
                ctx.fillRect(drawX + 1, groundY + 1, blockWidth / 2 - 2, blockWidth / 2 - 2);
                ctx.fillStyle = '#F5DEB3'; // Cream tile
                ctx.fillRect(drawX + blockWidth / 2 + 1, groundY + 1, blockWidth / 2 - 2, blockWidth / 2 - 2);
                ctx.fillStyle = '#F5DEB3';
                ctx.fillRect(drawX + 1, groundY + blockWidth / 2 + 1, blockWidth / 2 - 2, blockWidth / 2 - 2);
                ctx.fillStyle = '#CC3333';
                ctx.fillRect(drawX + blockWidth / 2 + 1, groundY + blockWidth / 2 + 1, blockWidth / 2 - 2, blockWidth / 2 - 2);
            } else {
                ctx.fillStyle = '#F5DEB3';
                ctx.fillRect(drawX + 1, groundY + 1, blockWidth / 2 - 2, blockWidth / 2 - 2);
                ctx.fillStyle = '#CC3333';
                ctx.fillRect(drawX + blockWidth / 2 + 1, groundY + 1, blockWidth / 2 - 2, blockWidth / 2 - 2);
                ctx.fillStyle = '#CC3333';
                ctx.fillRect(drawX + 1, groundY + blockWidth / 2 + 1, blockWidth / 2 - 2, blockWidth / 2 - 2);
                ctx.fillStyle = '#F5DEB3';
                ctx.fillRect(drawX + blockWidth / 2 + 1, groundY + blockWidth / 2 + 1, blockWidth / 2 - 2, blockWidth / 2 - 2);
            }
        } else {
            ctx.fillStyle = detailColor;
            ctx.fillRect(drawX + 5, groundY + 5, 8, 8);
            ctx.fillRect(drawX + 25, groundY + 25, 6, 6);
        }

        ctx.strokeStyle = 'rgba(0,0,0,0.1)';
        ctx.lineWidth = 2;
        ctx.strokeRect(drawX, groundY, blockWidth, blockWidth);
    }
}

function drawBgCharacters() {
    bgCharacters.forEach(char => {
        let bob = Math.sin(gameTick * 0.1) * 3;

        ctx.save();
        ctx.globalAlpha = 0.45; // Semi-transparent — clearly in background
        let scale = char.width / 40; // Scale down compared to original 40px width
        ctx.translate(char.x, char.y + bob);
        ctx.scale(scale, scale);

        if (char.type === 'Patrick') {
            ctx.fillStyle = '#FF7F50';
            ctx.beginPath();
            ctx.moveTo(20, 0);
            ctx.lineTo(25, 15);
            ctx.lineTo(40, 15);
            ctx.lineTo(30, 25);
            ctx.lineTo(35, 45);
            ctx.lineTo(20, 40);
            ctx.lineTo(5, 45);
            ctx.lineTo(10, 25);
            ctx.lineTo(0, 15);
            ctx.lineTo(15, 15);
            ctx.closePath();
            ctx.fill();

            ctx.fillStyle = '#00FF00';
            ctx.fillRect(5, 30, 30, 10);
            ctx.fillStyle = '#800080';
            ctx.beginPath(); ctx.arc(10, 35, 2, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(30, 33, 2, 0, Math.PI * 2); ctx.fill();

            ctx.fillStyle = 'white';
            ctx.beginPath(); ctx.arc(15, 15, 3, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(25, 15, 3, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = 'black';
            ctx.beginPath(); ctx.arc(15, 15, 1, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(25, 15, 1, 0, Math.PI * 2); ctx.fill();
        }
        else if (char.type === 'Squidward') {
            ctx.fillStyle = '#8FBC8F';
            ctx.beginPath();
            ctx.ellipse(20, 15, 12, 14, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.ellipse(20, 25, 5, 8, 0, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = 'white';
            ctx.fillRect(14, 10, 5, 6);
            ctx.fillRect(21, 10, 5, 6);
            ctx.fillStyle = '#8B0000';
            ctx.fillRect(16, 13, 2, 2);
            ctx.fillRect(23, 13, 2, 2);
            ctx.fillStyle = '#8FBC8F';
            ctx.fillRect(14, 10, 12, 3);

            ctx.fillStyle = '#CD853F';
            ctx.fillRect(10, 30, 20, 15);

            ctx.fillStyle = '#8FBC8F';
            ctx.fillRect(10, 45, 5, 10);
            ctx.fillRect(17, 45, 5, 10);
            ctx.fillRect(24, 45, 5, 10);
            ctx.fillRect(31, 45, 5, 10);
        }
        else if (char.type === 'Gary') {
            ctx.fillStyle = '#FF69B4';
            ctx.beginPath();
            ctx.arc(25, 25, 15, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#800080';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(25, 25, 10, 0, Math.PI * 1.5);
            ctx.stroke();
            ctx.fillStyle = '#87CEEB';
            ctx.beginPath();
            ctx.ellipse(25, 40, 20, 8, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#87CEEB';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(35, 35);
            ctx.lineTo(40, 15);
            ctx.stroke();
            ctx.fillStyle = 'white';
            ctx.beginPath(); ctx.arc(40, 15, 5, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = 'red';
            ctx.beginPath(); ctx.arc(41, 15, 2, 0, Math.PI * 2); ctx.fill();
        }

        ctx.restore();
    });
}

function drawBgCreatures() {
    bgCreatures.forEach(c => {
        ctx.save();
        ctx.globalAlpha = 0.55;

        if (c.type === 'jellyfish') {
            let bob = Math.sin(gameTick * 0.04 + c.wobbleOffset) * 4;
            // Dome
            ctx.fillStyle = '#FF69B4';
            ctx.beginPath();
            ctx.arc(c.x, c.y + bob, 14, Math.PI, 0);
            ctx.fill();
            // Inner dome
            ctx.fillStyle = '#FFB6C1';
            ctx.beginPath();
            ctx.arc(c.x, c.y + bob, 9, Math.PI, 0);
            ctx.fill();
            // Spots
            ctx.fillStyle = '#FF1493';
            ctx.beginPath(); ctx.arc(c.x - 4, c.y - 3 + bob, 1.5, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(c.x + 5, c.y - 5 + bob, 1.5, 0, Math.PI * 2); ctx.fill();
            // Wavy tentacles
            ctx.strokeStyle = 'rgba(255, 105, 180, 0.6)';
            ctx.lineWidth = 1.5;
            for (let t = 0; t < 4; t++) {
                let tx = c.x - 8 + t * 6;
                ctx.beginPath();
                ctx.moveTo(tx, c.y + bob);
                for (let s = 0; s < 18; s += 3) {
                    let wave = Math.sin(gameTick * 0.06 + t + s * 0.4) * 3;
                    ctx.lineTo(tx + wave, c.y + bob + s);
                }
                ctx.stroke();
            }
        }
        else if (c.type === 'fish_blue') {
            // Simple tropical fish — blue
            ctx.fillStyle = '#4169E1';
            ctx.beginPath();
            ctx.ellipse(c.x, c.y, 12, 7, 0, 0, Math.PI * 2);
            ctx.fill();
            // Tail
            ctx.beginPath();
            ctx.moveTo(c.x + 12, c.y);
            ctx.lineTo(c.x + 20, c.y - 6);
            ctx.lineTo(c.x + 20, c.y + 6);
            ctx.fill();
            // Eye
            ctx.fillStyle = 'white';
            ctx.beginPath(); ctx.arc(c.x - 5, c.y - 1, 3, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = 'black';
            ctx.beginPath(); ctx.arc(c.x - 5, c.y - 1, 1.5, 0, Math.PI * 2); ctx.fill();
            // Stripe
            ctx.fillStyle = '#87CEFA';
            ctx.fillRect(c.x - 2, c.y - 6, 4, 12);
        }
        else if (c.type === 'fish_yellow') {
            // Yellow puffer-ish fish
            ctx.fillStyle = '#FFD700';
            ctx.beginPath();
            ctx.ellipse(c.x, c.y, 10, 8, 0, 0, Math.PI * 2);
            ctx.fill();
            // Tail
            ctx.fillStyle = '#FFA500';
            ctx.beginPath();
            ctx.moveTo(c.x + 10, c.y);
            ctx.lineTo(c.x + 17, c.y - 5);
            ctx.lineTo(c.x + 17, c.y + 5);
            ctx.fill();
            // Eye
            ctx.fillStyle = 'white';
            ctx.beginPath(); ctx.arc(c.x - 4, c.y - 2, 3, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = 'black';
            ctx.beginPath(); ctx.arc(c.x - 4, c.y - 2, 1.5, 0, Math.PI * 2); ctx.fill();
            // Lips
            ctx.fillStyle = '#FF6347';
            ctx.beginPath(); ctx.arc(c.x - 10, c.y + 1, 2, 0, Math.PI * 2); ctx.fill();
        }
        else if (c.type === 'fish_green') {
            // Green fish
            ctx.fillStyle = '#3CB371';
            ctx.beginPath();
            ctx.ellipse(c.x, c.y, 11, 6, 0, 0, Math.PI * 2);
            ctx.fill();
            // Top fin
            ctx.fillStyle = '#2E8B57';
            ctx.beginPath();
            ctx.moveTo(c.x - 3, c.y - 6);
            ctx.lineTo(c.x + 5, c.y - 12);
            ctx.lineTo(c.x + 8, c.y - 6);
            ctx.fill();
            // Tail
            ctx.beginPath();
            ctx.moveTo(c.x + 11, c.y);
            ctx.lineTo(c.x + 18, c.y - 5);
            ctx.lineTo(c.x + 18, c.y + 5);
            ctx.fill();
            // Eye
            ctx.fillStyle = 'white';
            ctx.beginPath(); ctx.arc(c.x - 5, c.y - 1, 2.5, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = 'black';
            ctx.beginPath(); ctx.arc(c.x - 5, c.y - 1, 1.2, 0, Math.PI * 2); ctx.fill();
        }

        ctx.restore();
    });
}

function drawEntities() {
    // Player Draw Logic (Same as before but ensure invulnerability flash)
    if (player.invulnerable > 0 && Math.floor(gameTick / 4) % 2 === 0) return;

    // Body
    let bounce = player.grounded ? Math.sin(gameTick * 0.5) * 2 : 0;
    ctx.fillStyle = '#F7E414';
    ctx.fillRect(player.x, player.y + bounce, player.width, player.height);

    // Sponge details...
    ctx.fillStyle = '#CCAE1D';
    ctx.beginPath(); ctx.arc(player.x + 10, player.y + 10 + bounce, 5, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(player.x + 40, player.y + 35 + bounce, 4, 0, Math.PI * 2); ctx.fill();

    // Face
    ctx.fillStyle = 'white';
    ctx.beginPath(); ctx.arc(player.x + 15, player.y + 15 + bounce, 8, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(player.x + 35, player.y + 15 + bounce, 8, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#87CEEB';
    ctx.beginPath(); ctx.arc(player.x + 15, player.y + 15 + bounce, 3, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(player.x + 35, player.y + 15 + bounce, 3, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'black'; // Pupil
    ctx.beginPath(); ctx.arc(player.x + 15, player.y + 15 + bounce, 1, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(player.x + 35, player.y + 15 + bounce, 1, 0, Math.PI * 2); ctx.fill();

    // Smile
    ctx.beginPath(); ctx.arc(player.x + 25, player.y + 30 + bounce, 10, 0, Math.PI, false); ctx.stroke();
    // Teeth
    ctx.fillStyle = 'white'; ctx.fillRect(player.x + 20, player.y + 30 + bounce, 4, 4); ctx.fillRect(player.x + 26, player.y + 30 + bounce, 4, 4);

    // Clothes
    ctx.fillStyle = '#8B4513'; ctx.fillRect(player.x, player.y + 40 + bounce, player.width, 10);
    ctx.fillStyle = 'white'; ctx.fillRect(player.x, player.y + 35 + bounce, player.width, 5);
    ctx.fillStyle = 'red'; ctx.beginPath(); ctx.moveTo(player.x + 20, player.y + 35 + bounce); ctx.lineTo(player.x + 30, player.y + 35 + bounce); ctx.lineTo(player.x + 25, player.y + 45 + bounce); ctx.fill();

    // Legs
    ctx.fillStyle = '#F7E414';
    let leftLegY, rightLegY, leftLegH, rightLegH;
    if (player.grounded) {
        if (Math.sin(gameTick * 0.5) > 0) {
            leftLegY = player.y + 50 + bounce; leftLegH = 10;
            rightLegY = player.y + 48 + bounce; rightLegH = 8;
        } else {
            leftLegY = player.y + 48 + bounce; leftLegH = 8;
            rightLegY = player.y + 50 + bounce; rightLegH = 10;
        }
    } else {
        leftLegY = player.y + 45 + bounce; leftLegH = 8;
        rightLegY = player.y + 48 + bounce; rightLegH = 8;
    }
    ctx.fillRect(player.x + 10, leftLegY, 5, leftLegH);
    ctx.fillRect(player.x + 30, rightLegY, 5, rightLegH);

    // Shoes (both left and right!)
    ctx.fillStyle = 'black';
    ctx.fillRect(player.x + 8, leftLegY + leftLegH, 10, 5);   // left shoe
    ctx.fillRect(player.x + 28, rightLegY + rightLegH, 10, 5); // right shoe

    // Obstacles
    obstacles.forEach(o => {
        if (o.type === 'jellyfish') {
            // Jellyfish are now background-only - skip any legacy jellyfish obstacles
            return;
        }

        // Blocks Rendering
        let blockColor = '#5D4037'; // Dirt default
        let topColor = '#388E3C';
        if (currentScene === 'KELP_FOREST') { blockColor = '#2F4F4F'; topColor = '#556B2F'; }
        if (currentScene === 'JELLYFISH_FIELDS') { blockColor = '#556B2F'; topColor = '#7CCD7C'; }
        if (currentScene === 'KRUSTY_KRAB') { blockColor = '#8B6914'; topColor = '#B8860B'; }
        if (currentScene === 'GOO_LAGOON') { blockColor = '#C4A035'; topColor = '#E6C288'; }
        if (currentScene === 'CHUM_BUCKET') { blockColor = '#1A5C2E'; topColor = '#27AE60'; }
        if (currentScene === 'GLOVE_WORLD') { blockColor = '#6C3483'; topColor = '#AF7AC5'; }
        if (currentScene === 'FLYING_DUTCHMAN') { blockColor = '#1A3A1A'; topColor = '#2F4F2F'; }
        if (currentScene === 'BOATING_SCHOOL') { blockColor = '#555555'; topColor = '#888888'; }

        ctx.fillStyle = blockColor;
        ctx.fillRect(o.x, o.y, o.width, o.height);
        ctx.fillStyle = topColor;
        ctx.fillRect(o.x, o.y, o.width, 10);

        // Border
        ctx.strokeStyle = 'rgba(0,0,0,0.3)';
        ctx.strokeRect(o.x, o.y, o.width, o.height);
    });

    // Collectibles
    collectibles.forEach(c => {
        // Bun bottom
        ctx.fillStyle = '#F4A460'; ctx.fillRect(c.x, c.y + 20, c.width, 10);
        // Lettuce
        ctx.fillStyle = 'green'; ctx.fillRect(c.x, c.y + 15, c.width, 5);
        // Patty
        ctx.fillStyle = '#8B4513'; ctx.fillRect(c.x, c.y + 10, c.width, 5);
        // Bun top
        ctx.fillStyle = '#F4A460'; ctx.beginPath(); ctx.arc(c.x + c.width / 2, c.y + 10, c.width / 2, Math.PI, 0); ctx.fill();
    });
}

function drawUI() {
    // Score (Top Left)
    ctx.fillStyle = 'white';
    ctx.font = '30px "VT323", monospace';
    ctx.fillText(`Score: ${score}`, 20, 40);

    // Lives (Below Score - No overlap)
    // Use a filled heart path instead of emoji for consistency
    ctx.fillStyle = '#FF0000';
    for (let i = 0; i < lives; i++) {
        let hx = 30 + i * 35; // Spaced out
        let hy = 70; // Lower y position

        ctx.save();
        ctx.translate(hx, hy);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.bezierCurveTo(-5, -5, -10, 0, 0, 10);
        ctx.bezierCurveTo(10, 0, 5, -5, 0, 0);
        ctx.fill();
        ctx.restore();

        // Backup emoji just in case path is small
        ctx.font = '24px Arial';
        ctx.fillText('❤️', 20 + i * 35, 80);
    }
}
