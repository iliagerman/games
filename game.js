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
        osc.type = 'triangle';
        if (gameMode === 'scary') osc.type = 'sawtooth'; // Rougher jump sound
        else if (gameMode === 'tmnt') osc.type = 'triangle'; // Ninja whoosh

        let startFreq = 300, endFreq = 450;
        if (gameMode === 'scary') { startFreq = 150; endFreq = 200; } // Low moan jump
        else if (gameMode === 'cat') { startFreq = 400; endFreq = 600; } // Higher meow-ish
        else if (gameMode === 'tmnt') { startFreq = 250; endFreq = 500; } // Ninja whoosh

        osc.frequency.setValueAtTime(startFreq, audioCtx.currentTime);
        osc.frequency.linearRampToValueAtTime(endFreq, audioCtx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.1);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.1);
    } else if (type === 'collect') {
        osc.type = 'sine';
        let freq = 600;
        if (gameMode === 'scary') {
            osc.type = 'square'; freq = 200; // Eerie chime
            osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
            osc.frequency.linearRampToValueAtTime(freq - 50, audioCtx.currentTime + 0.1);
        } else if (gameMode === 'tmnt') {
            osc.type = 'sine'; freq = 700; // Pizza ding
            osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
            osc.frequency.linearRampToValueAtTime(freq + 200, audioCtx.currentTime + 0.1);
        } else {
            if (gameMode === 'cat') freq = 800;
            osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
            osc.frequency.linearRampToValueAtTime(freq + 200, audioCtx.currentTime + 0.1);
        }

        gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.1);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.1);
    } else if (type === 'gameover') {
        osc.type = 'sawtooth';
        if (gameMode === 'scary') osc.type = 'square';
        else if (gameMode === 'tmnt') osc.type = 'sawtooth';

        osc.frequency.setValueAtTime(150, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(50, audioCtx.currentTime + 0.5);
        gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
        gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.5);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.5);
    } else if (type === 'shoot') {
        osc.type = 'square';
        osc.frequency.setValueAtTime(800, audioCtx.currentTime);
        osc.frequency.linearRampToValueAtTime(400, audioCtx.currentTime + 0.05);
        gain.gain.setValueAtTime(0.06, audioCtx.currentTime);
        gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.05);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.05);
    } else if (type === 'powerup') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(400, audioCtx.currentTime);
        osc.frequency.linearRampToValueAtTime(1200, audioCtx.currentTime + 0.3);
        gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
        gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.3);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.3);
    } else if (type === 'powerup_end') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(800, audioCtx.currentTime);
        osc.frequency.linearRampToValueAtTime(200, audioCtx.currentTime + 0.25);
        gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.25);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.25);
    } else if (type === 'explosion') {
        // 8-bit explosion: noise burst with pitch drop
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(600, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(80, audioCtx.currentTime + 0.2);
        gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
        gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.25);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.25);
        // Layer a second noise for crunch
        const osc2 = audioCtx.createOscillator();
        const gain2 = audioCtx.createGain();
        osc2.connect(gain2);
        gain2.connect(audioCtx.destination);
        osc2.type = 'square';
        osc2.frequency.setValueAtTime(200, audioCtx.currentTime);
        osc2.frequency.linearRampToValueAtTime(50, audioCtx.currentTime + 0.15);
        gain2.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gain2.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.2);
        osc2.start();
        osc2.stop(audioCtx.currentTime + 0.2);
    } else if (type === 'destroy_reward') {
        // Triumphant ascending arpeggio
        osc.type = 'square';
        osc.frequency.setValueAtTime(523, audioCtx.currentTime);
        osc.frequency.setValueAtTime(659, audioCtx.currentTime + 0.06);
        osc.frequency.setValueAtTime(784, audioCtx.currentTime + 0.12);
        osc.frequency.setValueAtTime(1047, audioCtx.currentTime + 0.18);
        gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.3);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.3);
    } else if (type === 'quiz_tick') {
        osc.type = 'square';
        osc.frequency.setValueAtTime(880, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.04, audioCtx.currentTime);
        gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.05);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.05);
    } else if (type === 'quiz_timeout') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(300, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + 0.4);
        gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
        gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.4);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.4);
    }
}

// Game State
let gameState = 'SELECT'; // SELECT, LEVEL, START, PLAYING, GAMEOVER
let gameMode = null; // 'spongebob', 'cat', 'bluey', 'scary', or 'tmnt'
let gameLevel = 'easy'; // 'easy', 'medium', 'hard'
let gameSpeed = 1.0; // 0.5 – 2.0, controlled by settings
let settingsOpen = false;
let quizActive = false;
let currentQuiz = null;
let score = 0;
let lives = 5; // Start with 5 lives
let sceneTimer = 0;
let gameTick = 0; // For animation
let currentScene = 'BIKINI_BOTTOM';
// Scenes: BIKINI_BOTTOM -> KELP_FOREST -> JELLYFISH_FIELDS -> DEEP_OCEAN -> KRUSTY_KRAB
let bgCreatures = []; // Swimming jellyfish & fish (background only, not enemies)

// Progressive Difficulty
let difficultyMultiplier = 1.0; // scales 1.0 -> ~2.5
let baseScrollSpeed = 2;
let sceneSpeedBoost = 0; // +0.3 per scene change
let baseSpawnRate = 0.02;
let difficultyTier = 0; // 0-3, gates which enemy types appear

// Enemy System
let projectiles = []; // enemy-fired projectiles
let playerProjectiles = []; // player-fired projectiles (shooting power-up)

// Riddle & Power-up System
let riddleActive = false;
let currentRiddle = null;
let riddleTimer = 0;
let riddleMaxTime = 600; // 10 seconds at 60fps
let activePowerUp = null; // null / 'triple_jump' / 'shooting' / 'invulnerable'
let powerUpTimer = 0;
let powerUpMaxTimer = 600; // 10 seconds at 60fps

// Audio
let musicInterval = null;
let noteIndex = 0;
let currentMusicTempo = 200; // ms per note, gets faster over time
let musicMelody = null; // cached melody for tempo changes

// Particle System
let particles = [];

// Elements
const selectScreen = document.getElementById('select-screen');
const startScreen = document.getElementById('start-screen');
const gameOverScreen = document.getElementById('game-over-screen');
const gameTitle = document.getElementById('game-title');
const scoreDisplay = document.getElementById('score');
const finalScoreDisplay = document.getElementById('final-score');
const startBtn = document.getElementById('start-btn');
const restartBtn = document.getElementById('restart-btn');
const selectSpongebob = document.getElementById('select-spongebob');
const selectCat = document.getElementById('select-cat');
const selectBluey = document.getElementById('select-bluey');
const selectScary = document.getElementById('select-scary');
const selectTmnt = document.getElementById('select-tmnt');
const settingsBtn = document.getElementById('settings-btn');
const settingsOverlay = document.getElementById('settings-overlay');
const settingsCloseBtn = document.getElementById('settings-close-btn');
const speedSlider = document.getElementById('speed-slider');
const speedValue = document.getElementById('speed-value');
const settingsMenuBtn = document.getElementById('settings-menu-btn');
const levelScreen = document.getElementById('level-screen');
const levelTitle = document.getElementById('level-title');
const levelEasyBtn = document.getElementById('level-easy');
const levelMediumBtn = document.getElementById('level-medium');
const levelHardBtn = document.getElementById('level-hard');
const levelBackBtn = document.getElementById('level-back-btn');
const quizOverlay = document.getElementById('quiz-overlay');
const quizCanvas = document.getElementById('quizCanvas');
const quizCtx = quizCanvas.getContext('2d');
const quizQuestionText = document.getElementById('quiz-question-text');
const quizAnswersDiv = document.getElementById('quiz-answers');
const quizAnswerBtns = document.querySelectorAll('.quiz-answer-btn');
const quizResult = document.getElementById('quiz-result');

function selectMode(mode) {
    gameMode = mode;
    selectScreen.classList.add('hidden');
    levelScreen.classList.remove('hidden');
    gameState = 'LEVEL';
    const titles = {
        spongebob: "SpongeBob's Blocky Dash",
        cat: "Cat's Blocky Dash",
        bluey: "Bluey's Blocky Dash",
        scary: "Nightmare Dash",
        tmnt: "TMNT Blocky Dash"
    };
    gameTitle.textContent = titles[mode] || "Blocky Dash";
}

function selectLevel(level) {
    gameLevel = level;
    levelScreen.classList.add('hidden');
    startScreen.classList.remove('hidden');
    gameState = 'START';
}

// Event Listeners
const modeButtons = { spongebob: selectSpongebob, cat: selectCat, bluey: selectBluey, scary: selectScary, tmnt: selectTmnt };
Object.entries(modeButtons).forEach(([mode, btn]) => {
    btn.addEventListener('click', () => { initAudio(); selectMode(mode); });
    btn.addEventListener('touchstart', (e) => { e.preventDefault(); initAudio(); selectMode(mode); }, { passive: false });
});

// Level Selection
const levelButtons = { easy: levelEasyBtn, medium: levelMediumBtn, hard: levelHardBtn };
Object.entries(levelButtons).forEach(([level, btn]) => {
    btn.addEventListener('click', () => { selectLevel(level); });
    btn.addEventListener('touchstart', (e) => { e.preventDefault(); selectLevel(level); }, { passive: false });
});
levelBackBtn.addEventListener('click', () => {
    levelScreen.classList.add('hidden');
    selectScreen.classList.remove('hidden');
    gameState = 'SELECT';
    gameMode = null;
});
levelBackBtn.addEventListener('touchstart', (e) => { e.preventDefault(); levelBackBtn.click(); }, { passive: false });

// Settings
settingsBtn.addEventListener('click', () => {
    if (quizActive) return;
    settingsOverlay.classList.remove('hidden');
    gameSpeed = parseFloat(speedSlider.value); // Ensure it's synced
});
settingsBtn.addEventListener('touchstart', (e) => { e.preventDefault(); settingsBtn.click(); }, { passive: false });
settingsCloseBtn.addEventListener('click', () => {
    settingsOverlay.classList.add('hidden');
});
settingsCloseBtn.addEventListener('touchstart', (e) => { e.preventDefault(); settingsCloseBtn.click(); }, { passive: false });
settingsMenuBtn.addEventListener('click', () => {
    initAudio();
    stopMusic();
    resetGame();
    selectScreen.classList.remove('hidden');
    startScreen.classList.add('hidden');
    gameOverScreen.classList.add('hidden');
    settingsOverlay.classList.add('hidden');
    levelScreen.classList.add('hidden');
    quizOverlay.classList.add('hidden');
    settingsBtn.classList.add('hidden');
    menuBtn.classList.add('hidden');
    quizActive = false;
});
settingsMenuBtn.addEventListener('touchstart', (e) => { e.preventDefault(); settingsMenuBtn.click(); }, { passive: false });
speedSlider.addEventListener('input', (e) => {
    gameSpeed = parseFloat(e.target.value);
    speedValue.textContent = gameSpeed.toFixed(1) + 'x';
});

startBtn.addEventListener('click', () => { initAudio(); startGame(); });
restartBtn.addEventListener('click', () => { initAudio(); resetGame(); });
window.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
        e.preventDefault();
        if (e.repeat) return; // Ignore key repeat — prevents burning both jumps at once
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

// Menu Button Listener
const menuBtn = document.getElementById('menu-btn');
menuBtn.addEventListener('click', () => {
    initAudio();
    stopMusic();
    resetGame();
    selectScreen.classList.remove('hidden');
    startScreen.classList.add('hidden');
    gameOverScreen.classList.add('hidden');
    settingsOverlay.classList.add('hidden');
    levelScreen.classList.add('hidden');
    quizOverlay.classList.add('hidden');
    quizActive = false;
    // Hide in-game buttons
    settingsBtn.classList.add('hidden');
    menuBtn.classList.add('hidden');
});
menuBtn.addEventListener('touchstart', (e) => {
    e.preventDefault();
    menuBtn.click();
}, { passive: false });

// Prevent scrolling/zooming on the game area
document.getElementById('game-container').addEventListener('touchmove', (e) => {
    e.preventDefault();
}, { passive: false });

function handleInput() {
    if (quizActive) return;
    if (gameState === 'START') startGame();
    else if (gameState === 'PLAYING') playerJump();
    else if (gameState === 'GAMEOVER') resetGame();
}

function startGame() {
    gameState = 'PLAYING';
    startScreen.classList.add('hidden');
    gameOverScreen.classList.add('hidden');
    settingsBtn.classList.remove('hidden');
    score = 0;
    lives = 5; // Reset lives
    sceneTimer = 0;
    const startScenes = { spongebob: 'BIKINI_BOTTOM', cat: 'COZY_HOUSE', bluey: 'BACKYARD', scary: 'HAUNTED_HOUSE', tmnt: 'NYC_SEWERS' };
    currentScene = startScenes[gameMode] || 'BIKINI_BOTTOM';

    // Reset entities
    player.y = 300;
    player.vy = 0;
    player.invulnerable = 0;
    player.jumpCount = 0;
    obstacles = [];
    collectibles = [];
    bgCharacters = [];
    bgCreatures = [];

    // Reset progressive difficulty
    difficultyMultiplier = 1.0;
    difficultyTier = 0;
    sceneSpeedBoost = 0;

    // Reset enemy/projectile systems
    projectiles = [];
    playerProjectiles = [];

    // Reset riddle/power-up systems
    riddleActive = false;
    currentRiddle = null;
    riddleTimer = 0;
    activePowerUp = null;
    powerUpTimer = 0;
    if (window.riddleCountdown) clearInterval(window.riddleCountdown);

    // Reset animation systems
    particles = [];
    floatingTexts = [];
    screenFlash = { active: false, alpha: 0, color: '#FFF', timer: 0 };
    gameTick = 0;

    // Reset quiz timer
    if (quizTimerInterval) clearInterval(quizTimerInterval);
    quizTimerInterval = null;

    // Resume audio context if needed
    if (audioCtx && audioCtx.state === 'suspended') {
        audioCtx.resume();
    }

    startMusic();
    gameLoop();
}

function resetGame() {
    gameState = 'SELECT';
    gameMode = null;
    gameLevel = 'easy';
    quizActive = false;
    currentQuiz = null;
    gameOverScreen.classList.add('hidden');
    startScreen.classList.add('hidden');
    settingsBtn.classList.add('hidden');
    settingsOverlay.classList.add('hidden');
    levelScreen.classList.add('hidden');
    quizOverlay.classList.add('hidden');
    settingsOpen = false;
    selectScreen.classList.remove('hidden');

    // Reset all new systems
    difficultyMultiplier = 1.0;
    difficultyTier = 0;
    sceneSpeedBoost = 0;
    projectiles = [];
    playerProjectiles = [];
    riddleActive = false;
    currentRiddle = null;
    riddleTimer = 0;
    activePowerUp = null;
    powerUpTimer = 0;
    if (window.riddleCountdown) clearInterval(window.riddleCountdown);

    // Reset animation systems
    particles = [];
    floatingTexts = [];
    screenFlash = { active: false, alpha: 0, color: '#FFF', timer: 0 };

    // Reset quiz timer
    if (quizTimerInterval) clearInterval(quizTimerInterval);
    quizTimerInterval = null;
    quizTimerBar.classList.add('hidden');

    stopMusic();
}

// --- MUSIC SYSTEM (Weak 8-bit style) ---
function startMusic() {
    if (musicInterval) clearInterval(musicInterval);
    noteIndex = 0;
    // Simple cheerful melody (C Major scale-ish)
    let melody;
    if (gameMode === 'cat') {
        melody = [
            523.25, 0, 659.25, 783.99, 659.25, 0, 523.25, 0,
            783.99, 0, 698.46, 659.25, 587.33, 0, 523.25, 0,
            440.00, 0, 523.25, 587.33, 659.25, 0, 783.99, 0,
            698.46, 0, 659.25, 0, 587.33, 0, 523.25, 0
        ];
    } else if (gameMode === 'bluey') {
        // Playful, bouncy Australian-feel melody
        melody = [
            392.00, 0, 493.88, 523.25, 587.33, 0, 523.25, 0,
            659.25, 0, 587.33, 523.25, 493.88, 0, 392.00, 0,
            440.00, 0, 493.88, 523.25, 587.33, 0, 659.25, 0,
            587.33, 0, 523.25, 0, 493.88, 0, 392.00, 0
        ];
    } else if (gameMode === 'scary') {
        // Eerie minor-key melody
        melody = [
            196.00, 0, 207.65, 0, 233.08, 0, 207.65, 0,
            185.00, 0, 196.00, 0, 174.61, 0, 164.81, 0,
            196.00, 0, 0, 0, 233.08, 0, 0, 0,
            174.61, 0, 0, 0, 164.81, 0, 0, 0
        ];
    } else if (gameMode === 'tmnt') {
        // E minor pentatonic — fast punchy action theme
        melody = [
            329.63, 0, 392.00, 0, 440.00, 0, 493.88, 0,
            659.25, 0, 587.33, 0, 493.88, 0, 440.00, 0,
            329.63, 0, 329.63, 392.00, 440.00, 0, 587.33, 0,
            493.88, 0, 440.00, 0, 392.00, 0, 329.63, 0
        ];
    } else {
        melody = [
            392.00, 0, 392.00, 440.00, 392.00, 0, 493.88, 523.25,
            523.25, 0, 392.00, 329.63, 261.63, 0, 293.66, 329.63,
            392.00, 0, 392.00, 392.00, 440.00, 0, 392.00, 349.23,
            329.63, 0, 293.66, 0, 261.63, 0, 261.63, 0
        ];
    }

    musicMelody = melody;
    currentMusicTempo = 200;

    musicInterval = setInterval(() => {
        const freq = musicMelody[noteIndex % musicMelody.length];
        noteIndex++;

        if (freq > 0 && audioCtx && audioCtx.state === 'running') {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.connect(gain);
            gain.connect(audioCtx.destination);

            osc.type = 'square'; // 8-bit sound
            osc.frequency.setValueAtTime(freq, audioCtx.currentTime);

            // Short blip — note duration scales with tempo
            let noteDur = currentMusicTempo / 1000 * 0.75;
            gain.gain.setValueAtTime(0.05, audioCtx.currentTime); // Low volume
            gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + noteDur);

            osc.start();
            osc.stop(audioCtx.currentTime + noteDur + 0.05);
        }
    }, currentMusicTempo);
}

function stopMusic() {
    if (musicInterval) clearInterval(musicInterval);
    musicInterval = null;
    currentMusicTempo = 200;
    musicMelody = null;
}

function updateMusicTempo() {
    if (!musicMelody || !musicInterval) return;
    // Map difficultyMultiplier (1.0 -> 2.5) to tempo (200ms -> 110ms)
    let t = Math.min((difficultyMultiplier - 1.0) / 1.5, 1.0);
    let targetTempo = Math.round(200 - t * 90); // 200ms down to 110ms
    if (Math.abs(targetTempo - currentMusicTempo) >= 5) {
        currentMusicTempo = targetTempo;
        clearInterval(musicInterval);
        musicInterval = setInterval(() => {
            const freq = musicMelody[noteIndex % musicMelody.length];
            noteIndex++;
            if (freq > 0 && audioCtx && audioCtx.state === 'running') {
                const osc = audioCtx.createOscillator();
                const gain = audioCtx.createGain();
                osc.connect(gain);
                gain.connect(audioCtx.destination);
                osc.type = 'square';
                osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
                let noteDur = currentMusicTempo / 1000 * 0.75;
                gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + noteDur);
                osc.start();
                osc.stop(audioCtx.currentTime + noteDur + 0.05);
            }
        }, currentMusicTempo);
    }
}

// === PARTICLE SYSTEM ===
function spawnParticles(x, y, type) {
    let count, colors, speed, life, size;
    if (type === 'life_gain') {
        count = 20;
        colors = ['#FF4081', '#FF80AB', '#F50057', '#FFD700', '#FF6D00'];
        speed = 4;
        life = 50;
        size = 6;
    } else if (type === 'correct_answer') {
        count = 30;
        colors = ['#69F0AE', '#00E676', '#76FF03', '#FFD740', '#FFFFFF'];
        speed = 5;
        life = 60;
        size = 7;
    } else if (type === 'collect') {
        count = 8;
        colors = ['#FFD700', '#FFC107', '#FFAB00'];
        speed = 3;
        life = 25;
        size = 4;
    } else if (type === 'explosion') {
        count = 25;
        colors = ['#FF6D00', '#FF3D00', '#FFD740', '#FFAB00', '#FFFFFF', '#FF9100'];
        speed = 6;
        life = 35;
        size = 8;
    } else if (type === 'bullet_hit') {
        count = 12;
        colors = ['#FFEB3B', '#FFC107', '#FF9800', '#FFFFFF'];
        speed = 4;
        life = 20;
        size = 5;
    }
    for (let i = 0; i < count; i++) {
        let angle = (Math.PI * 2 / count) * i + (Math.random() - 0.5) * 0.5;
        let spd = speed * (0.5 + Math.random() * 0.8);
        particles.push({
            x: x,
            y: y,
            vx: Math.cos(angle) * spd,
            vy: Math.sin(angle) * spd - (type === 'life_gain' ? 2 : 1),
            life: life + Math.floor(Math.random() * 15),
            maxLife: life + 15,
            color: colors[Math.floor(Math.random() * colors.length)],
            size: size * (0.5 + Math.random() * 0.5),
            type: type
        });
    }
}

function updateParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
        let p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.08; // gentle gravity
        p.vx *= 0.98; // friction
        p.life--;
        if (p.life <= 0) {
            particles.splice(i, 1);
        }
    }
}

function drawParticles() {
    particles.forEach(p => {
        let alpha = p.life / p.maxLife;
        let sz = p.size * alpha;
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = p.color;
        if (p.type === 'life_gain') {
            // Draw tiny hearts
            ctx.font = `${Math.max(8, sz * 3)}px Arial`;
            ctx.textAlign = 'center';
            ctx.fillText('❤', p.x, p.y);
        } else if (p.type === 'correct_answer') {
            // Draw stars / sparkles
            ctx.translate(p.x, p.y);
            ctx.rotate(p.life * 0.15);
            drawStar(0, 0, sz, sz * 0.4, 4);
            ctx.fill();
        } else if (p.type === 'explosion') {
            // 8-bit explosion: chunky square fragments
            ctx.translate(p.x, p.y);
            ctx.rotate(p.life * 0.2);
            let blockSz = Math.max(2, sz * 1.2);
            ctx.fillRect(-blockSz / 2, -blockSz / 2, blockSz, blockSz);
            // Inner glow
            ctx.globalAlpha = alpha * 0.5;
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(-blockSz / 4, -blockSz / 4, blockSz / 2, blockSz / 2);
        } else if (p.type === 'bullet_hit') {
            // Sharp spark lines radiating out
            ctx.strokeStyle = p.color;
            ctx.lineWidth = 2;
            ctx.globalAlpha = alpha;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p.x + p.vx * 2, p.y + p.vy * 2);
            ctx.stroke();
            // Dot at tip
            ctx.fillRect(p.x - 1, p.y - 1, 3, 3);
        } else {
            // Simple circles for collect
            ctx.beginPath();
            ctx.arc(p.x, p.y, sz, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    });
}

function drawStar(cx, cy, outerR, innerR, points) {
    ctx.beginPath();
    for (let i = 0; i < points * 2; i++) {
        let r = i % 2 === 0 ? outerR : innerR;
        let angle = (Math.PI / points) * i - Math.PI / 2;
        if (i === 0) ctx.moveTo(cx + r * Math.cos(angle), cy + r * Math.sin(angle));
        else ctx.lineTo(cx + r * Math.cos(angle), cy + r * Math.sin(angle));
    }
    ctx.closePath();
}

// Flash overlay for big events
let screenFlash = { active: false, alpha: 0, color: '#FFF', timer: 0 };

function triggerScreenFlash(color, duration) {
    screenFlash = { active: true, alpha: 0.4, color: color, timer: duration || 20 };
}

function updateScreenFlash() {
    if (!screenFlash.active) return;
    screenFlash.timer--;
    screenFlash.alpha *= 0.88;
    if (screenFlash.timer <= 0) screenFlash.active = false;
}

function drawScreenFlash() {
    if (!screenFlash.active) return;
    ctx.save();
    ctx.globalAlpha = screenFlash.alpha;
    ctx.fillStyle = screenFlash.color;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
}

// Floating text system
let floatingTexts = [];

function spawnFloatingText(x, y, text, color, fontSize) {
    floatingTexts.push({
        x: x,
        y: y,
        text: text,
        color: color || '#FFD700',
        fontSize: fontSize || 24,
        life: 60,
        maxLife: 60,
        vy: -2
    });
}

function updateFloatingTexts() {
    for (let i = floatingTexts.length - 1; i >= 0; i--) {
        let ft = floatingTexts[i];
        ft.y += ft.vy;
        ft.vy *= 0.97;
        ft.life--;
        if (ft.life <= 0) floatingTexts.splice(i, 1);
    }
}

function drawFloatingTexts() {
    floatingTexts.forEach(ft => {
        let alpha = ft.life / ft.maxLife;
        let scale = 1 + (1 - alpha) * 0.3;
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.font = `bold ${Math.round(ft.fontSize * scale)}px "VT323", monospace`;
        ctx.fillStyle = ft.color;
        ctx.textAlign = 'center';
        ctx.strokeStyle = 'rgba(0,0,0,0.6)';
        ctx.lineWidth = 3;
        ctx.strokeText(ft.text, ft.x, ft.y);
        ctx.fillText(ft.text, ft.x, ft.y);
        ctx.restore();
    });
}

function playerJump() {
    let maxJumps = activePowerUp === 'triple_jump' ? 3 : 2;
    if (player.jumpCount < maxJumps) {
        player.vy = player.jumpCount === 0 ? -14 : -11;
        player.grounded = false;
        player.jumpCount++;
        playSound('jump');
    }
}

function updateScoreUI() {
    // Score is now drawn in drawUI
}

function showGameOver() {
    gameState = 'GAMEOVER';
    if (gameLevel === 'medium') {
        gameOverScreen.querySelector('h1').textContent = 'המשחק נגמר';
        gameOverScreen.querySelector('p').innerHTML = 'ניקוד: <span id="final-score">0</span>';
        document.getElementById('final-score').innerText = score;
        document.getElementById('restart-btn').textContent = 'נסה שוב';
    } else {
        gameOverScreen.querySelector('h1').textContent = 'GAME OVER';
        gameOverScreen.querySelector('p').innerHTML = 'Score: <span id="final-score">0</span>';
        document.getElementById('final-score').innerText = score;
        document.getElementById('restart-btn').textContent = 'TRY AGAIN';
    }
    gameOverScreen.classList.remove('hidden');
    playSound('gameover');
    stopMusic();
}

// Entities
const player = {
    x: 100,
    y: 300,
    width: 50,
    height: 50,
    vy: 0,
    grounded: false,
    invulnerable: 0,
    jumpCount: 0
};

let obstacles = [];
let collectibles = [];
let bgCharacters = [];

// === PROGRESSIVE DIFFICULTY ===
function updateDifficulty() {
    // Ramp over ~2.5 minutes (9000 frames at 60fps) — steeper curve
    let t = Math.min(gameTick / 9000, 1.0);
    // Use an ease-in curve so the speed increase is gentle at first, then accelerates
    let curve = t * t * (3 - 2 * t); // smoothstep
    let levelScale = gameLevel === 'easy' ? 0.8 : gameLevel === 'hard' ? 1.3 : 1.0;
    difficultyMultiplier = (1.0 + curve * 2.0) * levelScale;
    difficultyMultiplier = Math.min(difficultyMultiplier, 3.0);

    // Set tier based on elapsed time (at 60fps)
    let seconds = gameTick / 60;
    if (seconds < 20) difficultyTier = 0;
    else if (seconds < 60) difficultyTier = 1;
    else if (seconds < 120) difficultyTier = 2;
    else difficultyTier = 3;
}

// === ENEMY AI UPDATE ===
function updateEnemies() {
    obstacles.forEach(o => {
        if (o.type === 'ground_walker') {
            o.walkTimer = (o.walkTimer || 0) + 1;
            if (o.walkTimer > 90) { o.walkDir *= -1; o.walkTimer = 0; }
            o.x += o.walkDir * 0.8;
        }
        else if (o.type === 'shooter') {
            o.shootTimer = (o.shootTimer || 0) + 1;
            if (o.shootTimer >= 120) {
                o.shootTimer = 0;
                projectiles.push({
                    x: o.x - 5,
                    y: o.y + o.height / 2,
                    width: 8,
                    height: 8,
                    vx: -3,
                    vy: 0
                });
                playSound('shoot');
            }
        }
        else if (o.type === 'falling') {
            if (!o.triggered) {
                let dist = Math.abs((o.x + o.width / 2) - (player.x + player.width / 2));
                if (dist < 120) o.triggered = true;
            } else {
                o.vy = (o.vy || 0) + 0.3;
                o.y += o.vy;
            }
        }
        else if (o.type === 'bouncer') {
            o.bouncePhase = (o.bouncePhase || 0) + 0.05;
            o.y = o.baseY + Math.sin(o.bouncePhase) * 40;
        }
        else if (o.type === 'dasher') {
            if (o.dashCooldown > 0) {
                o.dashCooldown--;
            }
            if (!o.dashing && o.dashCooldown <= 0) {
                // Start dash when player is within 250px horizontal range
                let distX = Math.abs((o.x + o.width / 2) - (player.x + player.width / 2));
                if (distX < 250) {
                    o.dashing = true;
                    o.dashSpeed = -5.5; // Rush toward player (left)
                }
            }
            if (o.dashing) {
                o.x += o.dashSpeed;
                // Stop dashing after moving 150px
                if (o.dashSpeed < 0 && o.x < player.x - 100) {
                    o.dashing = false;
                    o.dashCooldown = 120;
                    o.dashSpeed = 0;
                }
            }
        }
        else if (o.type === 'zigzagger') {
            o.zigPhase = (o.zigPhase || 0) + o.zigSpeed;
            o.y = o.baseY + Math.sin(o.zigPhase) * o.zigAmplitude;
            // Also moves forward slightly toward player
            o.x -= 0.5;
        }
        else if (o.type === 'teleporter') {
            o.teleportTimer = (o.teleportTimer || 0) + 1;
            if (o.teleporting) {
                // Fade out then reappear
                o.alpha -= 0.05;
                if (o.alpha <= 0) {
                    // Teleport to a new position near the player
                    o.x = player.x + 100 + Math.random() * 150;
                    o.y = 300 + Math.random() * 60;
                    o.teleporting = false;
                    o.alpha = 0;
                    o.teleportTimer = 0;
                }
            } else if (o.alpha < 1) {
                // Fade back in
                o.alpha += 0.05;
                if (o.alpha > 1) o.alpha = 1;
            } else if (o.teleportTimer >= o.teleportCooldown) {
                // Start teleport
                o.teleporting = true;
            }
        }
    });

    // Update enemy projectiles
    projectiles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
    });
    projectiles = projectiles.filter(p => p.x > -20 && p.x < 850 && p.y < 500);
}

// === POWER-UP SYSTEM ===
function updatePowerUp() {
    if (!activePowerUp) return;

    powerUpTimer--;
    if (powerUpTimer <= 0) {
        playSound('powerup_end');
        activePowerUp = null;
        powerUpTimer = 0;
        return;
    }

    // Shooting auto-fire
    if (activePowerUp === 'shooting' && gameTick % 15 === 0) {
        playerProjectiles.push({
            x: player.x + player.width,
            y: player.y + player.height / 2 - 4,
            width: 10,
            height: 8,
            vx: 6
        });
        playSound('shoot');
    }

    // Update player projectiles
    playerProjectiles.forEach(p => p.x += p.vx);
    playerProjectiles = playerProjectiles.filter(p => p.x < 850);
}

function drawPowerUpUI() {
    if (!activePowerUp) return;

    let barWidth = 200;
    let barHeight = 16;
    let barX = (canvas.width - barWidth) / 2;
    let barY = 8;
    let fillRatio = powerUpTimer / powerUpMaxTimer;

    // Background
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(barX - 2, barY - 2, barWidth + 4, barHeight + 4);

    // Fill color by power-up type
    let color = '#FFD700';
    let label = '';
    if (activePowerUp === 'triple_jump') { color = '#00E5FF'; label = 'TRIPLE JUMP'; }
    else if (activePowerUp === 'shooting') { color = '#FF6D00'; label = 'SHOOTING'; }
    else if (activePowerUp === 'invulnerable') { color = '#76FF03'; label = 'INVULNERABLE'; }

    ctx.fillStyle = color;
    ctx.fillRect(barX, barY, barWidth * fillRatio, barHeight);

    // Border
    ctx.strokeStyle = '#FFF';
    ctx.lineWidth = 1;
    ctx.strokeRect(barX, barY, barWidth, barHeight);

    // Label
    ctx.fillStyle = '#FFF';
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(label + ' ' + Math.ceil(powerUpTimer / 60) + 's', canvas.width / 2, barY + 12);
    ctx.textAlign = 'start';
}

function gameLoop() {
    if (gameState !== 'PLAYING') return;
    if (settingsOpen) { requestAnimationFrame(gameLoop); return; }
    if (quizActive) {
        // Still update and draw particles/effects during quiz
        updateParticles();
        updateFloatingTexts();
        updateScreenFlash();
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawBackground();
        drawBgCharacters();
        drawBgCreatures();
        drawEntities();
        drawParticles();
        drawFloatingTexts();
        drawScreenFlash();
        drawPowerUpUI();
        drawUI();
        requestAnimationFrame(gameLoop);
        return;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    gameTick++;
    if (player.invulnerable > 0) player.invulnerable--;

    updateDifficulty();
    updatePhysics();
    updateEnemies();
    updatePowerUp();
    spawnEntities();
    checkCollisions();
    updateScene();
    updateParticles();
    updateFloatingTexts();
    updateScreenFlash();

    // Adjust music tempo to match game speed
    if (gameTick % 60 === 0) updateMusicTempo();

    drawBackground();
    drawBgCharacters();
    drawBgCreatures();
    drawEntities();
    drawParticles();
    drawFloatingTexts();
    drawScreenFlash();
    drawPowerUpUI();
    drawUI();

    requestAnimationFrame(gameLoop);
}

function isOverPit() {
    const playerLeft = player.x + 10; // Use inner bounds so edges don't trigger
    const playerRight = player.x + player.width - 10;
    for (let o of obstacles) {
        if (o.isPit && playerLeft < o.x + o.width && playerRight > o.x) {
            return true;
        }
    }
    return false;
}

function updatePhysics() {
    player.vy += 0.4; // Low gravity
    player.y += player.vy;

    const overPit = isOverPit();

    if (!overPit && player.y >= 350) {
        player.y = 350;
        player.vy = 0;
        player.grounded = true;
        player.jumpCount = 0;
    } else if (overPit && player.y >= 350) {
        // Player is falling into a pit
        player.grounded = false;
    }

    // Fell into pit — lose a life and respawn
    if (player.y > 500) {
        // Respawn above ground first
        player.y = 200;
        player.vy = 0;

        if (player.invulnerable <= 0 && activePowerUp !== 'invulnerable') {
            player.invulnerable = 60;

            if (gameLevel !== 'easy') {
                // Medium/Hard: trigger quiz instead of instant damage
                let r = Math.random();
                let quizType = r < 0.33 ? 'math' : r < 0.66 ? 'picture' : 'trivia';
                showQuiz(quizType, 'pit');
                return;
            }

            // Easy: normal damage
            lives--;
            playHurtSound();

            if (lives <= 0) {
                showGameOver();
                return;
            }
        }
    }

    // Scroll speed (progressive difficulty)
    let scrollSpeed = (baseScrollSpeed + sceneSpeedBoost) * difficultyMultiplier * gameSpeed;
    obstacles.forEach(o => o.x -= scrollSpeed);
    collectibles.forEach(c => c.x -= scrollSpeed);
    bgCharacters.forEach(b => b.x -= 1.5 * gameSpeed);
    bgCreatures.forEach(c => {
        c.x -= c.speed * gameSpeed;
        c.y += Math.sin(gameTick * c.wobbleSpeed + c.wobbleOffset) * 0.3;
    });

    obstacles = obstacles.filter(o => {
        if (o.type === 'falling' && o.y > 500) return false;
        return o.x + o.width > -50;
    });
    collectibles = collectibles.filter(c => c.x + c.width > 0);
    bgCharacters = bgCharacters.filter(b => b.x + b.width > -100);
    bgCreatures = bgCreatures.filter(c => c.x > -60);
}

function spawnEntities() {
    // 1. Bg Characters (in the background, smaller & higher)
    if (Math.random() < 0.005) {
        let type;
        if (gameMode === 'cat') {
            const catFriends = ['Kitten', 'FatCat', 'BlackCat'];
            type = catFriends[Math.floor(Math.random() * catFriends.length)];
        } else if (gameMode === 'bluey') {
            const blueyFriends = ['Bingo', 'Bandit', 'Chilli', 'Muffin', 'Socks', 'Mackenzie', 'Rusty', 'Judo', 'Chloe'];
            type = blueyFriends[Math.floor(Math.random() * blueyFriends.length)];
        } else if (gameMode === 'scary') {
            const scaryFriends = ['Skeleton', 'Ghost', 'Zombie'];
            type = scaryFriends[Math.floor(Math.random() * scaryFriends.length)];
        } else if (gameMode === 'tmnt') {
            const tmntFriends = ['Raphael', 'Donatello', 'Michelangelo', 'Splinter', 'April'];
            type = tmntFriends[Math.floor(Math.random() * tmntFriends.length)];
        } else {
            const friends = ['Patrick', 'Squidward', 'Gary'];
            type = friends[Math.floor(Math.random() * friends.length)];
        }
        bgCharacters.push({
            x: 800,
            y: 200 + Math.random() * 80,
            width: 25,
            height: 38,
            type: type
        });
    }

    // 2. Obstacles (progressive difficulty)
    let minGap = Math.max(180, 300 - difficultyTier * 30);
    if (obstacles.length === 0 || (800 - obstacles[obstacles.length - 1].x > minGap)) {
        if (Math.random() < baseSpawnRate * difficultyMultiplier) {
            spawnObstacle();
        }
    }

    // 3. Background creatures
    if (Math.random() < 0.008 && bgCreatures.length < 8) {
        let type;
        if (gameMode === 'cat') {
            const catCreatures = ['butterfly', 'mouse', 'bird', 'dragonfly'];
            type = catCreatures[Math.floor(Math.random() * catCreatures.length)];
        } else if (gameMode === 'bluey') {
            const blueyCreatures = ['cockatoo', 'lizard', 'ibis', 'frog'];
            type = blueyCreatures[Math.floor(Math.random() * blueyCreatures.length)];
        } else if (gameMode === 'scary') {
            const scaryCreatures = ['bat', 'spider', 'crow', 'wisp'];
            type = scaryCreatures[Math.floor(Math.random() * scaryCreatures.length)];
        } else if (gameMode === 'tmnt') {
            const tmntCreatures = ['rat', 'pigeon', 'cockroach', 'sewer_bat'];
            type = tmntCreatures[Math.floor(Math.random() * tmntCreatures.length)];
        } else {
            const creatureTypes = ['jellyfish', 'fish_blue', 'fish_yellow', 'fish_green'];
            type = creatureTypes[Math.floor(Math.random() * creatureTypes.length)];
        }
        const yPos = 80 + Math.random() * 250;
        bgCreatures.push({
            x: 820,
            y: yPos,
            type: type,
            speed: 0.6 + Math.random() * 0.8,
            wobbleSpeed: 0.02 + Math.random() * 0.03,
            wobbleOffset: Math.random() * Math.PI * 2
        });
    }

    // 4. Collectibles
    if (Math.random() < 0.01) {
        let collectType = 'patty';
        if (gameMode === 'cat') collectType = 'fish';
        else if (gameMode === 'bluey') collectType = 'bone';
        else if (gameMode === 'scary') collectType = 'skull';
        else if (gameMode === 'tmnt') collectType = 'pizza';
        collectibles.push({ x: 800, y: 250 - Math.random() * 50, width: 30, height: 30, type: collectType });
    }

    // 5. Riddle / Prize Collectibles (less frequent, only if no power-up active)
    if (!activePowerUp && !riddleActive && Math.random() < 0.003) {
        collectibles.push({
            x: 800, y: 220 - Math.random() * 60, width: 30, height: 30,
            type: 'riddle', isRiddle: true
        });
    }

}

function spawnObstacle() {
    const GROUND_Y = 400; // Top of the ground row
    let roll = Math.random();
    let type;

    if (roll < 0.15) {
        type = 'pit';
    } else if (roll < 0.35) {
        type = 'tall_block';
    } else {
        type = 'block';
    }

    // Spikes — higher chance for scary/tmnt, lower for others
    if (type === 'block') {
        let spikeChance = (gameMode === 'scary' || gameMode === 'tmnt') ? 0.3 : 0.15;
        if (Math.random() < spikeChance) type = 'spike';
    }

    // Flying obstacles — all modes get them now
    if (type === 'block' && Math.random() < 0.25) {
        type = 'flying';
    }

    // Tier-gated new enemy types (replace some blocks)
    if (type === 'block' || type === 'tall_block') {
        let enemyRoll = Math.random();
        if (difficultyTier >= 3 && enemyRoll < 0.08) {
            type = 'teleporter';
        } else if (difficultyTier >= 3 && enemyRoll < 0.16) {
            type = 'bouncer';
        } else if (difficultyTier >= 2 && enemyRoll < 0.22) {
            type = 'dasher';
        } else if (difficultyTier >= 2 && enemyRoll < 0.32) {
            type = Math.random() < 0.5 ? 'shooter' : 'falling';
        } else if (difficultyTier >= 1 && enemyRoll < 0.38) {
            type = 'zigzagger';
        } else if (difficultyTier >= 1 && enemyRoll < 0.45) {
            type = 'ground_walker';
        }
    }

    let newObstacle = {
        x: 800 + Math.random() * 100,
        y: GROUND_Y - 40, // sits on top of the ground
        width: 40,
        height: 40,
        type: type,
        isObstacle: true
    };

    if (type === 'tall_block') {
        newObstacle.height = 70;
        newObstacle.y = GROUND_Y - 70;
    }
    else if (type === 'spike') {
        newObstacle.width = 30; newObstacle.height = 30;
        newObstacle.y = GROUND_Y - 30;
    }
    else if (type === 'flying') {
        newObstacle.width = 40; newObstacle.height = 30;
        newObstacle.y = 210;
        newObstacle.speedY = Math.random() * 2 - 1;
    }
    else if (type === 'pit') {
        let pitWidth = 60 + Math.floor(Math.random() * 40);
        newObstacle.width = pitWidth;
        newObstacle.height = 50;
        newObstacle.y = GROUND_Y;
        newObstacle.isPit = true;
        newObstacle.isObstacle = false;
    }
    else if (type === 'ground_walker') {
        newObstacle.width = 35; newObstacle.height = 35;
        newObstacle.y = GROUND_Y - 35;
        newObstacle.walkDir = 1;
        newObstacle.walkTimer = 0;
    }
    else if (type === 'shooter') {
        newObstacle.width = 40; newObstacle.height = 40;
        newObstacle.y = GROUND_Y - 40;
        newObstacle.shootTimer = 0;
    }
    else if (type === 'falling') {
        newObstacle.width = 35; newObstacle.height = 35;
        newObstacle.y = 50;
        newObstacle.triggered = false;
        newObstacle.vy = 0;
    }
    else if (type === 'bouncer') {
        newObstacle.width = 35; newObstacle.height = 35;
        newObstacle.baseY = 280;
        newObstacle.y = 280;
        newObstacle.bouncePhase = Math.random() * Math.PI * 2;
    }
    else if (type === 'dasher') {
        newObstacle.width = 35; newObstacle.height = 35;
        newObstacle.y = GROUND_Y - 35;
        newObstacle.dashing = false;
        newObstacle.dashSpeed = 0;
        newObstacle.dashCooldown = 0;
    }
    else if (type === 'zigzagger') {
        newObstacle.width = 30; newObstacle.height = 30;
        newObstacle.y = 200 + Math.random() * 120;
        newObstacle.baseY = newObstacle.y;
        newObstacle.zigPhase = Math.random() * Math.PI * 2;
        newObstacle.zigAmplitude = 50 + Math.random() * 30;
        newObstacle.zigSpeed = 0.06 + Math.random() * 0.03;
    }
    else if (type === 'teleporter') {
        newObstacle.width = 30; newObstacle.height = 30;
        newObstacle.y = GROUND_Y - 30;
        newObstacle.teleportTimer = 0;
        newObstacle.teleportCooldown = 90 + Math.floor(Math.random() * 60);
        newObstacle.alpha = 1;
        newObstacle.teleporting = false;
    }

    // Prevent overlap
    let spawnGap = type === 'pit' ? 200 : 150;
    for (let o of obstacles) {
        if (Math.abs(o.x - newObstacle.x) < spawnGap) return;
    }
    obstacles.push(newObstacle);
}

function checkCollisions() {
    const padding = 6;

    obstacles.forEach(o => {
        if (!o.isObstacle) return;
        // Teleporter can't hurt you while invisible
        if (o.type === 'teleporter' && (o.alpha || 1) < 0.3) return;
        if (player.x + padding < o.x + o.width - padding &&
            player.x + player.width - padding > o.x + padding &&
            player.y + padding < o.y + o.height - padding &&
            player.y + player.height - padding > o.y + padding) {

            if (player.invulnerable <= 0 && activePowerUp !== 'invulnerable') {
                player.invulnerable = 60;

                if (gameLevel !== 'easy') {
                    let r2 = Math.random();
                    let quizType = r2 < 0.33 ? 'math' : r2 < 0.66 ? 'picture' : 'trivia';
                    showQuiz(quizType, 'obstacle');
                    return;
                }

                lives--;
                playHurtSound();

                if (lives <= 0) {
                    showGameOver();
                }
            }
        }
    });

    // Enemy projectile vs player
    projectiles = projectiles.filter(p => {
        if (player.x + padding < p.x + p.width &&
            player.x + player.width - padding > p.x &&
            player.y + padding < p.y + p.height &&
            player.y + player.height - padding > p.y) {

            // Bullet hit splash at impact point
            spawnParticles(p.x + p.width / 2, p.y + p.height / 2, 'bullet_hit');

            if (player.invulnerable <= 0 && activePowerUp !== 'invulnerable') {
                player.invulnerable = 60;

                if (gameLevel !== 'easy') {
                    let r3 = Math.random();
                    let quizType = r3 < 0.33 ? 'math' : r3 < 0.66 ? 'picture' : 'trivia';
                    showQuiz(quizType, 'projectile');
                    return false;
                }

                lives--;
                playHurtSound();

                if (lives <= 0) {
                    showGameOver();
                }
            }
            return false; // remove projectile
        }
        return true;
    });

    // Player projectiles vs obstacles (shooting power-up)
    playerProjectiles = playerProjectiles.filter(pp => {
        for (let i = obstacles.length - 1; i >= 0; i--) {
            let o = obstacles[i];
            if (!o.isObstacle) continue;
            if (pp.x < o.x + o.width && pp.x + pp.width > o.x &&
                pp.y < o.y + o.height && pp.y + pp.height > o.y) {
                let hitX = o.x + o.width / 2;
                let hitY = o.y + o.height / 2;
                obstacles.splice(i, 1);
                score += 15;
                // Explosion animation at impact
                spawnParticles(hitX, hitY, 'explosion');
                spawnFloatingText(hitX, hitY - 15, '+15', '#FFD740', 22);
                triggerScreenFlash('#FF6D00', 8);
                playSound('explosion');
                playSound('destroy_reward');
                return false; // remove player projectile
            }
        }
        // Bullet hit effect when projectile goes off screen (miss splash)
        return true;
    });

    // Collectibles (iterate backwards to safely splice)
    for (let i = collectibles.length - 1; i >= 0; i--) {
        let c = collectibles[i];
        if (player.x < c.x + c.width &&
            player.x + player.width > c.x &&
            player.y < c.y + c.height &&
            player.y + player.height > c.y) {

            if (c.isRiddle) {
                collectibles.splice(i, 1);
                if (gameLevel === 'easy') {
                    // Easy: grant random power-up directly, no question
                    let powerUps = ['triple_jump', 'shooting', 'invulnerable'];
                    activePowerUp = powerUps[Math.floor(Math.random() * powerUps.length)];
                    powerUpTimer = powerUpMaxTimer;
                    playSound('powerup');
                    let label = activePowerUp.replace('_', ' ').toUpperCase();
                    spawnParticles(c.x + c.width / 2, c.y + c.height / 2, 'correct_answer');
                    spawnFloatingText(player.x + player.width / 2, player.y - 20, 'PRIZE: ' + label + '!', '#76FF03', 28);
                    triggerScreenFlash('#76FF03', 20);
                } else {
                    showRiddle();
                }
                return;
            }

            score++;

            // Small collect sparkle
            spawnParticles(c.x + c.width / 2, c.y + c.height / 2, 'collect');

            let lifeThreshold = gameLevel === 'hard' ? 500 : gameLevel === 'medium' ? 50 : 10;
            if (score % lifeThreshold === 0) {
                if (lives < 6) {
                    lives++;
                    // Big life gain animation
                    spawnParticles(player.x + player.width / 2, player.y, 'life_gain');
                    spawnFloatingText(player.x + player.width / 2, player.y - 20, '+1 LIFE!', '#FF4081', 28);
                    triggerScreenFlash('#FF80AB', 15);
                    playSound('powerup');
                }
            }

            collectibles.splice(i, 1);
            playSound('collect');
        }
    }
}

function updateScene() {
    sceneTimer++;
    if (sceneTimer > 1200) { // Switch every 20 seconds for more variety
        sceneTimer = 0;
        switchScene();
    }
}

function switchScene() {
    const sequences = {
        spongebob: ['BIKINI_BOTTOM', 'KELP_FOREST', 'GOO_LAGOON', 'JELLYFISH_FIELDS', 'CHUM_BUCKET', 'DEEP_OCEAN', 'GLOVE_WORLD', 'KRUSTY_KRAB', 'FLYING_DUTCHMAN', 'BOATING_SCHOOL'],
        cat: ['COZY_HOUSE', 'GARDEN', 'ROOFTOP', 'FISH_MARKET', 'ALLEY', 'YARNIA', 'CATNIP_FIELDS', 'MOONLIT_ROOF', 'CAT_CAFE', 'LASER_LAND'],
        bluey: ['BACKYARD', 'CREEK', 'PLAYGROUND', 'BEACH', 'GRANNYS_HOUSE', 'BUSH_WALK', 'DANCE_FLOOR', 'MARKET', 'CAMPING', 'HEELER_HOUSE'],
        scary: ['HAUNTED_HOUSE', 'GRAVEYARD', 'DARK_FOREST', 'DUNGEON', 'GHOST_SHIP', 'ABANDONED_ASYLUM', 'BLOOD_MOON', 'SPIDER_CAVE', 'WITCH_SWAMP', 'DEMON_REALM'],
        tmnt: ['NYC_SEWERS', 'ROOFTOP_NYC', 'TECHNODROME', 'SHREDDERS_LAIR', 'APRIL_APARTMENT', 'CENTRAL_PARK', 'DOJO', 'DIMENSION_X', 'TURTLES_LAIR', 'FOOT_HQ']
    };
    let sequence = sequences[gameMode] || sequences.spongebob;
    let idx = sequence.indexOf(currentScene);
    idx = (idx + 1) % sequence.length;
    currentScene = sequence[idx];

    // Speed boost on each scene change
    sceneSpeedBoost += 0.3;
    spawnFloatingText(canvas.width / 2, canvas.height / 2, 'SPEED UP!', '#FFD740', 30);
    triggerScreenFlash('#FFD740', 12);
    playSound('powerup');
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
    // Cat World sky colors
    if (currentScene === 'COZY_HOUSE') skyColor = '#F5E6CA';
    if (currentScene === 'GARDEN') skyColor = '#87CEEB';
    if (currentScene === 'ROOFTOP') skyColor = '#FF7043';
    if (currentScene === 'FISH_MARKET') skyColor = '#B0BEC5';
    if (currentScene === 'ALLEY') skyColor = '#1A1A2E';
    if (currentScene === 'YARNIA') skyColor = '#FFCCF9';
    if (currentScene === 'CATNIP_FIELDS') skyColor = '#A8E6CF';
    if (currentScene === 'MOONLIT_ROOF') skyColor = '#0D1B2A';
    if (currentScene === 'CAT_CAFE') skyColor = '#D7CCC8';
    if (currentScene === 'LASER_LAND') skyColor = '#1A0033';
    // Bluey World sky colors
    if (currentScene === 'BACKYARD') skyColor = '#87CEEB';
    if (currentScene === 'CREEK') skyColor = '#5DA9E9';
    if (currentScene === 'PLAYGROUND') skyColor = '#64B5F6';
    if (currentScene === 'BEACH') skyColor = '#29B6F6';
    if (currentScene === 'GRANNYS_HOUSE') skyColor = '#FFF8E1';
    if (currentScene === 'BUSH_WALK') skyColor = '#66BB6A';
    if (currentScene === 'DANCE_FLOOR') skyColor = '#7B1FA2';
    if (currentScene === 'MARKET') skyColor = '#FFF3E0';
    if (currentScene === 'CAMPING') skyColor = '#0D1B2A';
    if (currentScene === 'HEELER_HOUSE') skyColor = '#81D4FA';
    // Scary World sky colors
    if (currentScene === 'HAUNTED_HOUSE') skyColor = '#1A1A2E';
    if (currentScene === 'GRAVEYARD') skyColor = '#16213E';
    if (currentScene === 'DARK_FOREST') skyColor = '#0A0A0A';
    if (currentScene === 'DUNGEON') skyColor = '#1C1C1C';
    if (currentScene === 'GHOST_SHIP') skyColor = '#1A3A3A';
    if (currentScene === 'ABANDONED_ASYLUM') skyColor = '#2C2C2C';
    if (currentScene === 'BLOOD_MOON') skyColor = '#3B0000';
    if (currentScene === 'SPIDER_CAVE') skyColor = '#0D0D0D';
    if (currentScene === 'WITCH_SWAMP') skyColor = '#1B2A1B';
    if (currentScene === 'DEMON_REALM') skyColor = '#1A0000';
    // TMNT World sky colors
    if (currentScene === 'NYC_SEWERS') skyColor = '#1A1A1A';
    if (currentScene === 'ROOFTOP_NYC') skyColor = '#0D1B2A';
    if (currentScene === 'TECHNODROME') skyColor = '#2C2C2C';
    if (currentScene === 'SHREDDERS_LAIR') skyColor = '#1A0A0A';
    if (currentScene === 'APRIL_APARTMENT') skyColor = '#F5E6CA';
    if (currentScene === 'CENTRAL_PARK') skyColor = '#1B5E20';
    if (currentScene === 'DOJO') skyColor = '#3E2723';
    if (currentScene === 'DIMENSION_X') skyColor = '#4A0072';
    if (currentScene === 'TURTLES_LAIR') skyColor = '#1A1A1A';
    if (currentScene === 'FOOT_HQ') skyColor = '#212121';

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
        ctx.globalAlpha = 0.6;
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

    // ═══ CAT WORLD SCENES ═══
    else if (currentScene === 'COZY_HOUSE') {
        // Warm living room
        let grad = ctx.createLinearGradient(0, 0, 0, 400);
        grad.addColorStop(0, '#F5E6CA');
        grad.addColorStop(1, '#E8D5B5');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, canvas.width, 400);
        // Wallpaper pattern
        ctx.globalAlpha = 0.1;
        ctx.fillStyle = '#D4A574';
        for (let p = 0; p < 20; p++) {
            let px = (p * 60 - gameTick / 8) % (canvas.width + 60);
            if (px < -30) px += canvas.width + 60;
            for (let py = 0; py < 400; py += 60) {
                ctx.beginPath();
                ctx.arc(px, py, 4, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        ctx.globalAlpha = 1.0;
        // Fireplace
        let fpX = (400 - gameTick / 10) % (canvas.width + 300);
        if (fpX < -100) fpX += canvas.width + 300;
        ctx.globalAlpha = 0.5;
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(fpX, 200, 100, 180);
        ctx.fillStyle = '#654321';
        ctx.fillRect(fpX - 10, 190, 120, 15);
        ctx.fillStyle = '#333';
        ctx.fillRect(fpX + 10, 250, 80, 130);
        // Fire
        ctx.fillStyle = '#FF4500';
        ctx.beginPath();
        ctx.moveTo(fpX + 25, 380); ctx.lineTo(fpX + 50, 290 + Math.sin(gameTick * 0.1) * 10); ctx.lineTo(fpX + 75, 380);
        ctx.fill();
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.moveTo(fpX + 35, 380); ctx.lineTo(fpX + 50, 320 + Math.sin(gameTick * 0.15) * 8); ctx.lineTo(fpX + 65, 380);
        ctx.fill();
        ctx.globalAlpha = 1.0;
        // Cushions / yarn balls
        const cushColors = ['#E91E63', '#9C27B0', '#2196F3'];
        for (let c = 0; c < 3; c++) {
            let cx = (c * 280 + 100 - gameTick / 6) % (canvas.width + 200);
            if (cx < -20) cx += canvas.width + 200;
            ctx.globalAlpha = 0.4;
            ctx.fillStyle = cushColors[c];
            ctx.beginPath(); ctx.arc(cx, 370, 15, 0, Math.PI * 2); ctx.fill();
            ctx.strokeStyle = cushColors[c]; ctx.lineWidth = 1;
            ctx.beginPath(); ctx.arc(cx, 370, 10, 0, Math.PI); ctx.stroke();
            ctx.globalAlpha = 1.0;
        }
    }
    else if (currentScene === 'GARDEN') {
        // Sunny garden
        let grad = ctx.createLinearGradient(0, 300, 0, 400);
        grad.addColorStop(0, 'rgba(139, 195, 74, 0)');
        grad.addColorStop(1, 'rgba(139, 195, 74, 0.5)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 300, canvas.width, 100);
        // Sun
        ctx.globalAlpha = 0.6;
        ctx.fillStyle = '#FFD700';
        ctx.beginPath(); ctx.arc(700, 60, 40, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = 0.15;
        ctx.beginPath(); ctx.arc(700, 60, 60, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = 1.0;
        // Fence
        ctx.fillStyle = '#DEB887';
        for (let f = 0; f < 25; f++) {
            let fx = (f * 45 - gameTick / 4) % (canvas.width + 50);
            if (fx < -10) fx += canvas.width + 50;
            ctx.fillRect(fx, 300, 8, 90);
            ctx.beginPath();
            ctx.moveTo(fx, 300); ctx.lineTo(fx + 4, 290); ctx.lineTo(fx + 8, 300);
            ctx.fill();
        }
        ctx.fillRect(0, 340, canvas.width, 5);
        ctx.fillRect(0, 365, canvas.width, 5);
        // Flowers
        const fColors = ['#FF5252', '#FF4081', '#E040FB', '#7C4DFF', '#448AFF', '#FFAB40'];
        for (let fl = 0; fl < 8; fl++) {
            let flx = (fl * 110 + 30 - gameTick / 5) % (canvas.width + 100);
            if (flx < -10) flx += canvas.width + 100;
            ctx.fillStyle = '#4CAF50';
            ctx.fillRect(flx + 3, 355, 3, 35);
            ctx.fillStyle = fColors[fl % fColors.length];
            ctx.beginPath(); ctx.arc(flx + 4, 352, 7, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#FFC107';
            ctx.beginPath(); ctx.arc(flx + 4, 352, 3, 0, Math.PI * 2); ctx.fill();
        }
        // Butterflies
        ctx.globalAlpha = 0.5;
        for (let b = 0; b < 4; b++) {
            let bx = (b * 220 + 50 - gameTick * 0.3) % (canvas.width + 100);
            if (bx < -15) bx += canvas.width + 100;
            let by = 100 + b * 50 + Math.sin(gameTick * 0.04 + b) * 20;
            let wingFlap = Math.sin(gameTick * 0.2 + b) * 6;
            ctx.fillStyle = ['#FF69B4', '#87CEEB', '#FFD700', '#DDA0DD'][b];
            ctx.beginPath(); ctx.ellipse(bx - 5, by, Math.abs(wingFlap), 4, -0.3, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.ellipse(bx + 5, by, Math.abs(wingFlap), 4, 0.3, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#333'; ctx.fillRect(bx - 1, by - 2, 2, 6);
        }
        ctx.globalAlpha = 1.0;
    }
    else if (currentScene === 'ROOFTOP') {
        // Sunset rooftops
        let grad = ctx.createLinearGradient(0, 0, 0, 400);
        grad.addColorStop(0, '#FF7043'); grad.addColorStop(0.5, '#FF8A65'); grad.addColorStop(1, '#FFB74D');
        ctx.fillStyle = grad; ctx.fillRect(0, 0, canvas.width, 400);
        // City silhouette
        ctx.fillStyle = '#37474F';
        for (let b = 0; b < 8; b++) {
            let bx = (b * 120 - gameTick / 6) % (canvas.width + 150);
            if (bx < -60) bx += canvas.width + 150;
            let bh = 120 + (b * 37) % 100;
            ctx.fillRect(bx, 400 - bh, 50, bh);
            // Windows
            ctx.fillStyle = '#FFD54F';
            for (let wy = 400 - bh + 10; wy < 390; wy += 20) {
                for (let wx = 5; wx < 45; wx += 15) {
                    if (Math.random() > 0.3 || gameTick % 120 < 60) ctx.fillRect(bx + wx, wy, 8, 10);
                }
            }
            ctx.fillStyle = '#37474F';
        }
        // Antennas
        ctx.strokeStyle = '#555'; ctx.lineWidth = 2;
        for (let a = 0; a < 4; a++) {
            let ax = (a * 200 + 80 - gameTick / 6) % (canvas.width + 150);
            if (ax < -10) ax += canvas.width + 150;
            ctx.beginPath(); ctx.moveTo(ax, 280); ctx.lineTo(ax, 240); ctx.stroke();
            ctx.fillStyle = '#F44336'; ctx.beginPath(); ctx.arc(ax, 238, 3, 0, Math.PI * 2); ctx.fill();
        }
    }
    else if (currentScene === 'FISH_MARKET') {
        // Market stalls
        let grad = ctx.createLinearGradient(0, 0, 0, 400);
        grad.addColorStop(0, '#B0BEC5'); grad.addColorStop(1, '#78909C');
        ctx.fillStyle = grad; ctx.fillRect(0, 0, canvas.width, 400);
        // Stalls
        const stallColors = ['#F44336', '#2196F3', '#4CAF50', '#FF9800'];
        for (let s = 0; s < 4; s++) {
            let sx = (s * 230 + 50 - gameTick / 5) % (canvas.width + 250);
            if (sx < -100) sx += canvas.width + 250;
            ctx.globalAlpha = 0.5;
            // Table
            ctx.fillStyle = '#8D6E63'; ctx.fillRect(sx, 300, 90, 10);
            ctx.fillRect(sx + 5, 310, 5, 80); ctx.fillRect(sx + 80, 310, 5, 80);
            // Awning
            ctx.fillStyle = stallColors[s];
            ctx.beginPath(); ctx.moveTo(sx - 10, 270); ctx.lineTo(sx + 45, 250); ctx.lineTo(sx + 100, 270); ctx.lineTo(sx + 100, 300); ctx.lineTo(sx - 10, 300); ctx.fill();
            // Fish on table
            ctx.fillStyle = '#90CAF9';
            for (let fi = 0; fi < 3; fi++) {
                ctx.beginPath(); ctx.ellipse(sx + 15 + fi * 25, 295, 8, 4, 0, 0, Math.PI * 2); ctx.fill();
            }
            ctx.globalAlpha = 1.0;
        }
        // Crates
        ctx.fillStyle = 'rgba(139, 90, 43, 0.4)';
        for (let cr = 0; cr < 5; cr++) {
            let crx = (cr * 180 + 120 - gameTick / 4) % (canvas.width + 100);
            if (crx < -20) crx += canvas.width + 100;
            ctx.fillRect(crx, 360, 25, 25);
            ctx.strokeStyle = 'rgba(100, 60, 20, 0.3)'; ctx.strokeRect(crx, 360, 25, 25);
        }
    }
    else if (currentScene === 'ALLEY') {
        // Dark alley
        let grad = ctx.createLinearGradient(0, 0, 0, 400);
        grad.addColorStop(0, '#1A1A2E'); grad.addColorStop(1, '#16213E');
        ctx.fillStyle = grad; ctx.fillRect(0, 0, canvas.width, 400);
        // Brick walls
        ctx.globalAlpha = 0.2; ctx.fillStyle = '#5D4037';
        for (let row = 0; row < 20; row++) {
            for (let col = 0; col < 25; col++) {
                let bx = col * 35 + (row % 2) * 17;
                ctx.fillRect(bx, row * 20, 33, 18);
            }
        }
        ctx.globalAlpha = 1.0;
        // Neon sign
        let neonX = (350 - gameTick / 8) % (canvas.width + 300);
        if (neonX < -80) neonX += canvas.width + 300;
        let neonFlicker = Math.sin(gameTick * 0.15) > -0.3 ? 1 : 0.3;
        ctx.globalAlpha = 0.6 * neonFlicker;
        ctx.fillStyle = '#FF1744'; ctx.fillRect(neonX, 80, 80, 30);
        ctx.fillStyle = '#FFCDD2'; ctx.font = 'bold 14px monospace'; ctx.fillText('FISH', neonX + 18, 102);
        ctx.globalAlpha = 1.0;
        // Trash cans
        ctx.fillStyle = 'rgba(100, 100, 100, 0.5)';
        for (let t = 0; t < 3; t++) {
            let tx = (t * 300 + 100 - gameTick / 5) % (canvas.width + 200);
            if (tx < -25) tx += canvas.width + 200;
            ctx.fillRect(tx, 340, 25, 50); ctx.fillRect(tx - 3, 335, 31, 8);
        }
        // Puddles
        ctx.fillStyle = 'rgba(100, 149, 237, 0.2)';
        for (let p = 0; p < 4; p++) {
            let px = (p * 220 + 60 - gameTick / 4) % (canvas.width + 150);
            if (px < -30) px += canvas.width + 150;
            ctx.beginPath(); ctx.ellipse(px, 385, 25, 5, 0, 0, Math.PI * 2); ctx.fill();
        }
    }
    else if (currentScene === 'YARNIA') {
        // Fantasy yarn world
        let grad = ctx.createLinearGradient(0, 0, 0, 400);
        grad.addColorStop(0, '#FFCCF9'); grad.addColorStop(1, '#FFE0F0');
        ctx.fillStyle = grad; ctx.fillRect(0, 0, canvas.width, 400);
        // Knitted clouds
        ctx.globalAlpha = 0.4;
        for (let c = 0; c < 4; c++) {
            let cx = (c * 250 + 50 - gameTick / 10) % (canvas.width + 200);
            if (cx < -80) cx += canvas.width + 200;
            ctx.fillStyle = '#FFFFFF';
            ctx.beginPath(); ctx.arc(cx, 80, 20, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(cx + 25, 75, 25, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(cx + 50, 80, 20, 0, Math.PI * 2); ctx.fill();
            // Stitch lines
            ctx.strokeStyle = '#E0E0E0'; ctx.lineWidth = 1; ctx.setLineDash([3, 3]);
            ctx.beginPath(); ctx.moveTo(cx - 15, 80); ctx.lineTo(cx + 65, 80); ctx.stroke();
            ctx.setLineDash([]);
        }
        ctx.globalAlpha = 1.0;
        // Yarn ball trees
        const yarnColors = ['#E91E63', '#9C27B0', '#2196F3', '#4CAF50', '#FF9800', '#F44336'];
        for (let t = 0; t < 6; t++) {
            let tx = (t * 160 + 40 - gameTick / 4) % (canvas.width + 150);
            if (tx < -30) tx += canvas.width + 150;
            ctx.globalAlpha = 0.5;
            // Stick
            ctx.fillStyle = '#BCAAA4'; ctx.fillRect(tx + 8, 310, 6, 80);
            // Yarn ball
            ctx.fillStyle = yarnColors[t % yarnColors.length];
            ctx.beginPath(); ctx.arc(tx + 11, 300, 18, 0, Math.PI * 2); ctx.fill();
            // Swirl pattern
            ctx.strokeStyle = 'rgba(255,255,255,0.3)'; ctx.lineWidth = 1;
            ctx.beginPath(); ctx.arc(tx + 11, 300, 10, 0, Math.PI * 1.5); ctx.stroke();
            ctx.beginPath(); ctx.arc(tx + 11, 300, 5, Math.PI, Math.PI * 2.5); ctx.stroke();
            ctx.globalAlpha = 1.0;
        }
    }
    else if (currentScene === 'CATNIP_FIELDS') {
        // Dreamy green fields
        let grad = ctx.createLinearGradient(0, 0, 0, 400);
        grad.addColorStop(0, '#A8E6CF'); grad.addColorStop(1, '#88D8A8');
        ctx.fillStyle = grad; ctx.fillRect(0, 0, canvas.width, 400);
        // Rolling hills
        ctx.fillStyle = '#69C97E';
        ctx.beginPath(); ctx.moveTo(0, 400);
        for (let x = 0; x <= canvas.width; x += 8) ctx.lineTo(x, 350 + Math.sin((x + gameTick * 0.2) / 100) * 20);
        ctx.lineTo(canvas.width, 400); ctx.fill();
        // Catnip plants
        ctx.fillStyle = '#2E7D32';
        for (let p = 0; p < 10; p++) {
            let px = (p * 95 - gameTick / 4) % (canvas.width + 100);
            if (px < -10) px += canvas.width + 100;
            ctx.fillRect(px + 3, 360, 3, 30);
            ctx.fillStyle = '#66BB6A';
            ctx.beginPath(); ctx.ellipse(px + 4, 358, 8, 4, 0, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.ellipse(px - 2, 365, 6, 3, -0.5, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.ellipse(px + 10, 365, 6, 3, 0.5, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#2E7D32';
        }
        // Floating hearts
        ctx.globalAlpha = 0.3;
        ctx.fillStyle = '#FF69B4';
        for (let h = 0; h < 6; h++) {
            let hx = (h * 150 + gameTick * 0.3) % canvas.width;
            let hy = 60 + h * 40 + Math.sin(gameTick * 0.02 + h) * 15;
            ctx.save(); ctx.translate(hx, hy); ctx.scale(0.6, 0.6);
            ctx.beginPath(); ctx.moveTo(0, 0); ctx.bezierCurveTo(-5, -5, -10, 0, 0, 10); ctx.bezierCurveTo(10, 0, 5, -5, 0, 0); ctx.fill();
            ctx.restore();
        }
        ctx.globalAlpha = 1.0;
    }
    else if (currentScene === 'MOONLIT_ROOF') {
        // Night rooftop
        let grad = ctx.createLinearGradient(0, 0, 0, 400);
        grad.addColorStop(0, '#0D1B2A'); grad.addColorStop(1, '#1B2838');
        ctx.fillStyle = grad; ctx.fillRect(0, 0, canvas.width, 400);
        // Stars
        ctx.fillStyle = '#FFFFFF';
        for (let s = 0; s < 30; s++) {
            let sx = (s * 67 + 10) % canvas.width;
            let sy = (s * 31 + 5) % 200;
            let twinkle = Math.abs(Math.sin(gameTick / 20 + s * 0.5));
            ctx.globalAlpha = twinkle * 0.7;
            ctx.beginPath(); ctx.arc(sx, sy, 1 + (s % 2), 0, Math.PI * 2); ctx.fill();
        }
        ctx.globalAlpha = 1.0;
        // Moon
        ctx.globalAlpha = 0.8;
        ctx.fillStyle = '#FFF9C4';
        ctx.beginPath(); ctx.arc(650, 70, 40, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = 0.2;
        ctx.fillStyle = '#FFFDE7';
        ctx.beginPath(); ctx.arc(650, 70, 55, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = 1.0;
        // Rooftop silhouettes
        ctx.fillStyle = '#263238';
        for (let r = 0; r < 6; r++) {
            let rx = (r * 160 - gameTick / 7) % (canvas.width + 150);
            if (rx < -70) rx += canvas.width + 150;
            ctx.fillRect(rx, 320 - (r % 3) * 30, 60, 80 + (r % 3) * 30);
            // Chimney
            ctx.fillRect(rx + 10, 310 - (r % 3) * 30, 12, 15);
        }
    }
    else if (currentScene === 'CAT_CAFE') {
        // Cozy café
        let grad = ctx.createLinearGradient(0, 0, 0, 400);
        grad.addColorStop(0, '#D7CCC8'); grad.addColorStop(1, '#BCAAA4');
        ctx.fillStyle = grad; ctx.fillRect(0, 0, canvas.width, 400);
        // Wooden floor
        ctx.fillStyle = 'rgba(141, 110, 99, 0.2)'; ctx.lineWidth = 1;
        for (let i = 0; i < 12; i++) ctx.fillRect(0, 330 + i * 6, canvas.width, 1);
        // Tables
        for (let t = 0; t < 3; t++) {
            let tx = (t * 300 + 100 - gameTick / 8) % (canvas.width + 300);
            if (tx < -60) tx += canvas.width + 300;
            ctx.globalAlpha = 0.45;
            ctx.fillStyle = '#5D4037'; ctx.fillRect(tx, 310, 60, 5);
            ctx.fillRect(tx + 10, 315, 5, 75); ctx.fillRect(tx + 45, 315, 5, 75);
            // Coffee cup
            ctx.fillStyle = '#FFFFFF'; ctx.fillRect(tx + 20, 295, 15, 15);
            ctx.fillStyle = '#795548';
            ctx.beginPath(); ctx.ellipse(tx + 27, 295, 7, 3, 0, 0, Math.PI * 2); ctx.fill();
            // Steam
            ctx.strokeStyle = 'rgba(200,200,200,0.4)'; ctx.lineWidth = 1;
            for (let s = 0; s < 3; s++) {
                ctx.beginPath(); ctx.moveTo(tx + 24 + s * 4, 292);
                ctx.quadraticCurveTo(tx + 22 + s * 4 + Math.sin(gameTick * 0.05 + s) * 3, 282, tx + 26 + s * 4, 272);
                ctx.stroke();
            }
            ctx.globalAlpha = 1.0;
        }
        // Cat beds
        ctx.globalAlpha = 0.4;
        const bedColors = ['#E91E63', '#9C27B0', '#FF5722'];
        for (let b = 0; b < 3; b++) {
            let bx = (b * 280 + 50 - gameTick / 6) % (canvas.width + 200);
            if (bx < -30) bx += canvas.width + 200;
            ctx.fillStyle = bedColors[b];
            ctx.beginPath(); ctx.ellipse(bx, 375, 22, 8, 0, 0, Math.PI * 2); ctx.fill();
        }
        ctx.globalAlpha = 1.0;
    }
    else if (currentScene === 'LASER_LAND') {
        // Disco / laser room
        let grad = ctx.createLinearGradient(0, 0, 0, 400);
        grad.addColorStop(0, '#1A0033'); grad.addColorStop(0.5, '#2D004D'); grad.addColorStop(1, '#1A0033');
        ctx.fillStyle = grad; ctx.fillRect(0, 0, canvas.width, 400);
        // Disco ball
        let ballX = (400 - gameTick / 12) % (canvas.width + 300);
        if (ballX < -30) ballX += canvas.width + 300;
        ctx.globalAlpha = 0.6;
        ctx.fillStyle = '#C0C0C0'; ctx.beginPath(); ctx.arc(ballX, 60, 20, 0, Math.PI * 2); ctx.fill();
        // Mirror facets
        ctx.fillStyle = '#FFFFFF';
        for (let f = 0; f < 8; f++) {
            let a = f * Math.PI / 4 + gameTick * 0.02;
            ctx.globalAlpha = 0.4 + Math.sin(gameTick * 0.05 + f) * 0.2;
            ctx.beginPath(); ctx.arc(ballX + Math.cos(a) * 14, 60 + Math.sin(a) * 14, 3, 0, Math.PI * 2); ctx.fill();
        }
        ctx.globalAlpha = 1.0;
        // Laser beams
        const laserColors = ['#FF0000', '#00FF00', '#0000FF', '#FF00FF', '#00FFFF', '#FFFF00'];
        for (let l = 0; l < 6; l++) {
            let angle = (gameTick * 0.02 + l * Math.PI / 3);
            ctx.strokeStyle = laserColors[l]; ctx.lineWidth = 2;
            ctx.globalAlpha = 0.35;
            ctx.beginPath(); ctx.moveTo(ballX, 60);
            ctx.lineTo(ballX + Math.cos(angle) * 400, 60 + Math.sin(angle) * 400);
            ctx.stroke();
        }
        ctx.globalAlpha = 1.0;
        // Sparkle particles
        for (let s = 0; s < 20; s++) {
            let sx = (s * 83 + gameTick * 0.5) % canvas.width;
            let sy = (s * 47 + 20) % 380;
            let brightness = Math.abs(Math.sin(gameTick / 10 + s * 0.8));
            ctx.fillStyle = laserColors[s % laserColors.length];
            ctx.globalAlpha = brightness * 0.5;
            ctx.beginPath(); ctx.arc(sx, sy, 2, 0, Math.PI * 2); ctx.fill();
        }
        ctx.globalAlpha = 1.0;
    } else if (gameMode === 'bluey') {
        // --- BLUEY WORLD BACKGROUNDS ---
        if (currentScene === 'BACKYARD') {
            // Heeler House on Hill
            ctx.fillStyle = '#66BB6A';
            ctx.beginPath(); ctx.ellipse(400, 420, 900, 150, 0, 0, Math.PI * 2); ctx.fill(); // Hill

            // House Body (Cream/Yellowish)
            let hx = (600 - gameTick * 0.2) % (canvas.width + 500);
            if (hx < -300) hx += canvas.width + 500;

            ctx.fillStyle = '#FFF59D'; // Cream walls
            ctx.fillRect(hx, 220, 200, 140);

            // Veranda/Deck
            ctx.fillStyle = '#8D6E63'; // Brown wood
            ctx.fillRect(hx - 20, 300, 240, 10); // Floor
            ctx.fillRect(hx - 20, 220, 10, 80); // Post L
            ctx.fillRect(hx + 210, 220, 10, 80); // Post R
            ctx.fillRect(hx + 95, 220, 10, 80); // Post Mid

            // Roof (Red/Orange)
            ctx.fillStyle = '#E65100';
            ctx.beginPath(); ctx.moveTo(hx - 40, 220); ctx.lineTo(hx + 100, 150); ctx.lineTo(hx + 240, 220); ctx.fill();

            // Windows
            ctx.fillStyle = '#81D4FA';
            ctx.fillRect(hx + 20, 250, 40, 40);
            ctx.fillRect(hx + 140, 250, 40, 40);

            // Fence
            ctx.fillStyle = '#8D6E63';
            for (let i = 0; i < 20; i++) {
                let fx = (i * 50 - gameTick * 0.5) % (canvas.width + 100);
                if (fx < -50) fx += canvas.width + 100;
                ctx.fillRect(fx, 340, 10, 50);
                ctx.fillRect(fx, 350, 50, 5);
            }
        } else if (currentScene === 'CREEK') {
            // Water stream
            ctx.fillStyle = '#4FC3F7';
            ctx.fillRect(0, 300, canvas.width, 100);
            // Rocks
            ctx.fillStyle = '#9E9E9E';
            for (let i = 0; i < 5; i++) {
                let rx = (i * 200 + 50 - gameTick * 0.5) % (canvas.width + 200);
                if (rx < -50) rx += canvas.width + 200;
                ctx.beginPath(); ctx.arc(rx, 340, 20 + i * 5, 0, Math.PI, true); ctx.fill();
            }
        } else if (currentScene === 'PLAYGROUND') {
            // Slide/Swings silhouette
            ctx.fillStyle = '#EF5350';
            let sx = (600 - gameTick * 0.5) % (canvas.width + 400);
            if (sx < -100) sx += canvas.width + 400;
            ctx.beginPath(); ctx.moveTo(sx, 350); ctx.lineTo(sx + 50, 250); ctx.lineTo(sx + 100, 350); ctx.fill();
        }
        // Default Bluey clouds for other scenes
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        for (let i = 0; i < 5; i++) {
            let cx = (i * 180 + gameTick * 0.2) % (canvas.width + 200) - 100;
            let cy = 50 + i * 30;
            ctx.beginPath(); ctx.arc(cx, cy, 30, 0, Math.PI * 2); ctx.arc(cx + 25, cy - 10, 35, 0, Math.PI * 2); ctx.arc(cx + 50, cy, 30, 0, Math.PI * 2); ctx.fill();
        }

    } else if (gameMode === 'scary') {
        // --- SCARY WORLD BACKGROUNDS ---
        // Dead trees
        ctx.fillStyle = '#1a1a1a';
        for (let i = 0; i < 4; i++) {
            let tx = (i * 300 + 100 - gameTick * 0.5) % (canvas.width + 200);
            if (tx < -50) tx += canvas.width + 200;
            ctx.fillRect(tx, 200, 15, 150); // trunk
            // branches
            ctx.beginPath(); ctx.moveTo(tx, 250); ctx.lineTo(tx - 30, 220); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(tx + 15, 240); ctx.lineTo(tx + 45, 210); ctx.stroke();
        }

        if (currentScene === 'GRAVEYARD') {
            // Tombstones
            ctx.fillStyle = '#424242';
            for (let i = 0; i < 6; i++) {
                let gx = (i * 150 + 50 - gameTick * 0.5) % (canvas.width + 100);
                if (gx < -30) gx += canvas.width + 100;
                ctx.beginPath(); ctx.moveTo(gx, 350); ctx.lineTo(gx, 310);
                ctx.arc(gx + 15, 310, 15, Math.PI, 0);
                ctx.lineTo(gx + 30, 350); ctx.fill();
            }
        } else if (currentScene === 'HAUNTED_HOUSE') {
            // Moon
            ctx.fillStyle = '#FFF9C4';
            ctx.beginPath(); ctx.arc(700, 80, 40, 0, Math.PI * 2); ctx.fill();
        }
    } else if (gameMode === 'tmnt') {
        // --- TMNT WORLD BACKGROUNDS ---
        if (currentScene === 'NYC_SEWERS') {
            // Horizontal pipes
            ctx.fillStyle = '#555';
            for (let i = 0; i < 4; i++) {
                let py = 80 + i * 90;
                let px = (i * 300 + 100 - gameTick * 0.3) % (canvas.width + 300);
                if (px < -200) px += canvas.width + 300;
                ctx.fillRect(px, py, 180, 12);
                ctx.fillStyle = '#666';
                ctx.fillRect(px, py, 180, 4);
                ctx.fillStyle = '#555';
                // Pipe joints
                ctx.fillRect(px + 80, py - 3, 20, 18);
            }
            // Dripping water
            ctx.fillStyle = 'rgba(100, 200, 255, 0.4)';
            for (let d = 0; d < 6; d++) {
                let dx = (d * 150 + gameTick * 0.1) % canvas.width;
                let dy = (gameTick * 1.5 + d * 80) % 350;
                ctx.beginPath(); ctx.ellipse(dx, dy, 2, 4, 0, 0, Math.PI * 2); ctx.fill();
            }
        } else if (currentScene === 'ROOFTOP_NYC') {
            // NYC Skyline silhouette
            ctx.fillStyle = '#111';
            let buildings = [60, 120, 80, 150, 100, 90, 130, 70, 110, 140];
            for (let i = 0; i < buildings.length; i++) {
                let bx = (i * 100 - gameTick * 0.2) % (canvas.width + 200);
                if (bx < -80) bx += canvas.width + 200;
                ctx.fillRect(bx, 400 - buildings[i], 60, buildings[i]);
                // Lit windows
                ctx.fillStyle = '#FFE082';
                for (let wy = 400 - buildings[i] + 10; wy < 390; wy += 20) {
                    for (let wx = 8; wx < 52; wx += 18) {
                        if (Math.random() > 0.3) ctx.fillRect(bx + wx, wy, 8, 8);
                    }
                }
                ctx.fillStyle = '#111';
            }
            // Moon
            ctx.fillStyle = '#FFF9C4';
            ctx.beginPath(); ctx.arc(700, 60, 30, 0, Math.PI * 2); ctx.fill();
        } else if (currentScene === 'TECHNODROME') {
            // Rotating gears
            ctx.strokeStyle = '#555';
            ctx.lineWidth = 3;
            for (let g = 0; g < 3; g++) {
                let gx = (g * 300 + 150 - gameTick * 0.3) % (canvas.width + 200);
                if (gx < -60) gx += canvas.width + 200;
                let radius = 30 + g * 10;
                ctx.beginPath(); ctx.arc(gx, 200, radius, 0, Math.PI * 2); ctx.stroke();
                // Teeth
                for (let t = 0; t < 8; t++) {
                    let angle = t * Math.PI / 4 + gameTick * 0.02;
                    ctx.fillStyle = '#666';
                    ctx.fillRect(gx + Math.cos(angle) * radius - 3, 200 + Math.sin(angle) * radius - 3, 6, 6);
                }
            }
            // Metal panels
            ctx.fillStyle = 'rgba(100, 100, 100, 0.2)';
            for (let p = 0; p < 8; p++) {
                let px = p * 120;
                ctx.fillRect(px, 300, 100, 80);
                ctx.strokeStyle = '#444'; ctx.lineWidth = 1;
                ctx.strokeRect(px, 300, 100, 80);
            }
        }
        // Smog/clouds for outdoor TMNT scenes
        if (currentScene === 'ROOFTOP_NYC' || currentScene === 'CENTRAL_PARK' || currentScene === 'APRIL_APARTMENT') {
            ctx.fillStyle = 'rgba(150, 150, 150, 0.15)';
            for (let i = 0; i < 4; i++) {
                let cx = (i * 250 + gameTick * 0.15) % (canvas.width + 300) - 150;
                ctx.beginPath(); ctx.arc(cx, 60 + i * 20, 40, 0, Math.PI * 2); ctx.arc(cx + 30, 50 + i * 20, 35, 0, Math.PI * 2); ctx.fill();
            }
        }
    }

    // Underwater bubbles on SpongeBob, dust on Cat, pollen on Bluey, fog/embers on Scary, steam on TMNT
    if (gameMode === 'cat') {
        // Floating dust motes
        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        for (let i = 0; i < 8; i++) {
            let dx = (i * 97 + gameTick * 0.3) % canvas.width;
            let dy = (250 - (gameTick * 0.2 + i * 45) % 300);
            if (dy < -5) dy += 300;
            ctx.beginPath(); ctx.arc(dx, dy, 1.5, 0, Math.PI * 2); ctx.fill();
        }
    } else if (gameMode === 'bluey') {
        // Floating pollen/leaves
        ctx.fillStyle = 'rgba(255, 235, 59, 0.4)';
        for (let i = 0; i < 10; i++) {
            let px = (i * 83 + gameTick * 0.5) % canvas.width;
            let py = (i * 57 + Math.sin(gameTick * 0.05 + i) * 20) % 400;
            ctx.beginPath(); ctx.arc(px, py, 2, 0, Math.PI * 2); ctx.fill();
        }
    } else if (gameMode === 'scary') {
        // Fog/Mist
        ctx.fillStyle = 'rgba(200, 200, 200, 0.05)';
        for (let i = 0; i < 5; i++) {
            let mx = (gameTick * 0.2 + i * 200) % (canvas.width + 400) - 200;
            ctx.beginPath(); ctx.ellipse(mx, 300, 150, 40, 0, 0, Math.PI * 2); ctx.fill();
        }
        // Embers (if in hell/dungeon scenes)
        if (currentScene === 'DEMON_REALM' || currentScene === 'DUNGEON') {
            ctx.fillStyle = 'rgba(255, 87, 34, 0.6)';
            for (let i = 0; i < 15; i++) {
                let ex = (i * 43 + Math.sin(gameTick * 0.1) * 10) % canvas.width;
                let ey = (400 - (gameTick * 1.5 + i * 20) % 400);
                ctx.fillRect(ex, ey, 2, 2);
            }
        }
    } else if (gameMode === 'tmnt') {
        // Rising steam/mist from ground
        ctx.fillStyle = 'rgba(200, 200, 200, 0.08)';
        for (let i = 0; i < 6; i++) {
            let sx = (i * 140 + gameTick * 0.2) % canvas.width;
            let sy = 380 - (gameTick * 0.5 + i * 50) % 200;
            ctx.beginPath(); ctx.ellipse(sx, sy, 15, 8, 0, 0, Math.PI * 2); ctx.fill();
        }
        // Green ooze drips in sewer/tech scenes
        if (currentScene === 'NYC_SEWERS' || currentScene === 'TECHNODROME' || currentScene === 'TURTLES_LAIR') {
            ctx.fillStyle = 'rgba(118, 255, 3, 0.3)';
            for (let i = 0; i < 5; i++) {
                let ox = (i * 170 + 30) % canvas.width;
                let oy = (gameTick * 1.2 + i * 60) % 380;
                ctx.beginPath(); ctx.ellipse(ox, oy, 2, 5, 0, 0, Math.PI * 2); ctx.fill();
            }
        }
    } else {
        drawUnderwaterBubbles();
    }

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
    // Cat World ground colors
    if (currentScene === 'COZY_HOUSE') { mainColor = '#8D6E63'; detailColor = '#795548'; }
    if (currentScene === 'GARDEN') { mainColor = '#6D4C41'; detailColor = '#5D4037'; }
    if (currentScene === 'ROOFTOP') { mainColor = '#546E7A'; detailColor = '#455A64'; }
    if (currentScene === 'FISH_MARKET') { mainColor = '#607D8B'; detailColor = '#546E7A'; }
    if (currentScene === 'ALLEY') { mainColor = '#37474F'; detailColor = '#263238'; }
    if (currentScene === 'YARNIA') { mainColor = '#CE93D8'; detailColor = '#BA68C8'; }
    if (currentScene === 'CATNIP_FIELDS') { mainColor = '#66BB6A'; detailColor = '#4CAF50'; }
    if (currentScene === 'MOONLIT_ROOF') { mainColor = '#37474F'; detailColor = '#263238'; }
    if (currentScene === 'CAT_CAFE') { mainColor = '#A1887F'; detailColor = '#8D6E63'; }
    if (currentScene === 'LASER_LAND') { mainColor = '#4A148C'; detailColor = '#311B92'; }

    // Bluey World Ground Colors
    if (currentScene === 'BACKYARD') { mainColor = '#8BC34A'; detailColor = '#689F38'; }
    if (currentScene === 'CREEK') { mainColor = '#A1887F'; detailColor = '#8D6E63'; }
    if (currentScene === 'PLAYGROUND') { mainColor = '#FFCC80'; detailColor = '#FFB74D'; }
    if (currentScene === 'BEACH') { mainColor = '#FFF59D'; detailColor = '#FFF176'; }
    if (currentScene === 'GRANNYS_HOUSE') { mainColor = '#D7CCC8'; detailColor = '#BCAAA4'; }
    if (currentScene === 'BUSH_WALK') { mainColor = '#558B2F'; detailColor = '#33691E'; }
    if (currentScene === 'DANCE_FLOOR') { mainColor = '#BA68C8'; detailColor = '#AB47BC'; }
    if (currentScene === 'MARKET') { mainColor = '#F48FB1'; detailColor = '#F06292'; }
    if (currentScene === 'CAMPING') { mainColor = '#3E2723'; detailColor = '#4E342E'; }
    if (currentScene === 'HEELER_HOUSE') { mainColor = '#FFAB91'; detailColor = '#FF8A65'; }

    // TMNT World Ground Colors
    if (currentScene === 'NYC_SEWERS') { mainColor = '#37474F'; detailColor = '#263238'; }
    if (currentScene === 'ROOFTOP_NYC') { mainColor = '#455A64'; detailColor = '#37474F'; }
    if (currentScene === 'TECHNODROME') { mainColor = '#616161'; detailColor = '#424242'; }
    if (currentScene === 'SHREDDERS_LAIR') { mainColor = '#4E342E'; detailColor = '#3E2723'; }
    if (currentScene === 'APRIL_APARTMENT') { mainColor = '#8D6E63'; detailColor = '#795548'; }
    if (currentScene === 'CENTRAL_PARK') { mainColor = '#558B2F'; detailColor = '#33691E'; }
    if (currentScene === 'DOJO') { mainColor = '#795548'; detailColor = '#5D4037'; }
    if (currentScene === 'DIMENSION_X') { mainColor = '#6A1B9A'; detailColor = '#4A148C'; }
    if (currentScene === 'TURTLES_LAIR') { mainColor = '#424242'; detailColor = '#303030'; }
    if (currentScene === 'FOOT_HQ') { mainColor = '#37474F'; detailColor = '#263238'; }

    // Scary World Ground Colors
    if (currentScene === 'HAUNTED_HOUSE') { mainColor = '#424242'; detailColor = '#212121'; }
    if (currentScene === 'GRAVEYARD') { mainColor = '#3E2723'; detailColor = '#1B0000'; }
    if (currentScene === 'DARK_FOREST') { mainColor = '#1B5E20'; detailColor = '#003300'; }
    if (currentScene === 'DUNGEON') { mainColor = '#616161'; detailColor = '#424242'; }
    if (currentScene === 'GHOST_SHIP') { mainColor = '#004D40'; detailColor = '#00251A'; }
    if (currentScene === 'ABANDONED_ASYLUM') { mainColor = '#BDBDBD'; detailColor = '#9E9E9E'; }
    if (currentScene === 'BLOOD_MOON') { mainColor = '#880E4F'; detailColor = '#4A0033'; }
    if (currentScene === 'SPIDER_CAVE') { mainColor = '#263238'; detailColor = '#000A12'; }
    if (currentScene === 'WITCH_SWAMP') { mainColor = '#33691E'; detailColor = '#1B5E20'; }
    if (currentScene === 'DEMON_REALM') { mainColor = '#BF360C'; detailColor = '#870000'; }

    for (let x = -blockWidth; x < canvas.width + blockWidth; x += blockWidth) {
        let drawX = x - offset;
        let groundY = 400;

        // Skip ground blocks that overlap with a pit
        let inPit = false;
        for (let o of obstacles) {
            if (o.isPit && drawX + blockWidth > o.x && drawX < o.x + o.width) {
                inPit = true;
                break;
            }
        }
        if (inPit) continue;

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

    // Draw pits (dark hole visual)
    obstacles.forEach(o => {
        if (!o.isPit) return;
        // Dark pit interior
        ctx.fillStyle = '#1a0a00';
        ctx.fillRect(o.x, 400, o.width, 50);
        // Inner shadow gradient
        ctx.fillStyle = '#0d0500';
        ctx.fillRect(o.x + 4, 410, o.width - 8, 40);
        // Edge highlights (broken ground look)
        ctx.fillStyle = '#5D4037';
        ctx.fillRect(o.x - 3, 400, 6, 10); // left edge
        ctx.fillRect(o.x + o.width - 3, 400, 6, 10); // right edge
        // Warning stripes at edges
        ctx.fillStyle = '#FF5722';
        ctx.fillRect(o.x, 398, 4, 4);
        ctx.fillRect(o.x + o.width - 4, 398, 4, 4);
    });
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
        // === Cat World Background Characters ===
        else if (char.type === 'Kitten') {
            // Small white kitten
            ctx.fillStyle = '#FFFFFF';
            ctx.beginPath(); ctx.ellipse(20, 25, 12, 10, 0, 0, Math.PI * 2); ctx.fill(); // body
            ctx.beginPath(); ctx.arc(20, 12, 8, 0, Math.PI * 2); ctx.fill(); // head
            // Ears
            ctx.beginPath(); ctx.moveTo(13, 6); ctx.lineTo(10, -2); ctx.lineTo(16, 4); ctx.fill();
            ctx.beginPath(); ctx.moveTo(27, 6); ctx.lineTo(30, -2); ctx.lineTo(24, 4); ctx.fill();
            // Inner ears
            ctx.fillStyle = '#FFB6C1';
            ctx.beginPath(); ctx.moveTo(14, 6); ctx.lineTo(12, 1); ctx.lineTo(16, 5); ctx.fill();
            ctx.beginPath(); ctx.moveTo(26, 6); ctx.lineTo(28, 1); ctx.lineTo(24, 5); ctx.fill();
            // Eyes
            ctx.fillStyle = '#87CEEB';
            ctx.beginPath(); ctx.arc(16, 12, 3, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(24, 12, 3, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = 'black';
            ctx.beginPath(); ctx.arc(16, 12, 1.5, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(24, 12, 1.5, 0, Math.PI * 2); ctx.fill();
            // Nose & whiskers
            ctx.fillStyle = '#FFB6C1';
            ctx.beginPath(); ctx.arc(20, 16, 1.5, 0, Math.PI * 2); ctx.fill();
            ctx.strokeStyle = '#CCC'; ctx.lineWidth = 0.5;
            ctx.beginPath(); ctx.moveTo(12, 14); ctx.lineTo(4, 12); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(12, 16); ctx.lineTo(4, 17); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(28, 14); ctx.lineTo(36, 12); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(28, 16); ctx.lineTo(36, 17); ctx.stroke();
            // Tail
            ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.moveTo(32, 25);
            ctx.quadraticCurveTo(40, 15 + Math.sin(gameTick * 0.08) * 5, 38, 10); ctx.stroke();
        }
        else if (char.type === 'FatCat') {
            // Big grey cat lounging
            ctx.fillStyle = '#9E9E9E';
            ctx.beginPath(); ctx.ellipse(20, 30, 18, 12, 0, 0, Math.PI * 2); ctx.fill(); // body
            ctx.beginPath(); ctx.arc(5, 20, 10, 0, Math.PI * 2); ctx.fill(); // head
            // Ears
            ctx.fillStyle = '#757575';
            ctx.beginPath(); ctx.moveTo(0, 12); ctx.lineTo(-3, 5); ctx.lineTo(4, 10); ctx.fill();
            ctx.beginPath(); ctx.moveTo(10, 12); ctx.lineTo(13, 5); ctx.lineTo(7, 10); ctx.fill();
            // Eyes (sleepy)
            ctx.strokeStyle = '#333'; ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(1, 19); ctx.lineTo(5, 19); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(7, 19); ctx.lineTo(11, 19); ctx.stroke();
            // Stripes
            ctx.strokeStyle = '#757575'; ctx.lineWidth = 1.5;
            ctx.beginPath(); ctx.moveTo(12, 22); ctx.lineTo(15, 35); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(20, 19); ctx.lineTo(22, 33); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(28, 22); ctx.lineTo(30, 35); ctx.stroke();
        }
        else if (char.type === 'BlackCat') {
            // Sleek black cat sitting
            ctx.fillStyle = '#333';
            ctx.beginPath(); ctx.ellipse(20, 30, 10, 14, 0, 0, Math.PI * 2); ctx.fill(); // body
            ctx.beginPath(); ctx.arc(20, 10, 9, 0, Math.PI * 2); ctx.fill(); // head
            // Pointy ears
            ctx.beginPath(); ctx.moveTo(13, 4); ctx.lineTo(10, -5); ctx.lineTo(16, 2); ctx.fill();
            ctx.beginPath(); ctx.moveTo(27, 4); ctx.lineTo(30, -5); ctx.lineTo(24, 2); ctx.fill();
            // Glowing eyes
            ctx.fillStyle = '#FFFF00';
            ctx.beginPath(); ctx.arc(16, 10, 2.5, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(24, 10, 2.5, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = 'black';
            ctx.beginPath(); ctx.ellipse(16, 10, 0.8, 2.5, 0, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.ellipse(24, 10, 0.8, 2.5, 0, 0, Math.PI * 2); ctx.fill();
            // Tail curling up
            ctx.strokeStyle = '#333'; ctx.lineWidth = 3;
            ctx.beginPath(); ctx.moveTo(30, 30);
            ctx.quadraticCurveTo(42, 20, 38, 5 + Math.sin(gameTick * 0.06) * 3); ctx.stroke();
        }
        // === Bluey World Background Characters ===
        else if (char.type === 'Bingo') {
            // Bingo — red heeler puppy (Bluey's sister)
            ctx.fillStyle = '#E88B5A';
            ctx.beginPath(); ctx.ellipse(20, 28, 12, 10, 0, 0, Math.PI * 2); ctx.fill(); // body
            ctx.fillStyle = '#E88B5A';
            ctx.beginPath(); ctx.arc(20, 12, 10, 0, Math.PI * 2); ctx.fill(); // head
            // Ears (floppy)
            ctx.fillStyle = '#C0724A';
            ctx.beginPath(); ctx.ellipse(9, 5, 5, 8, -0.3, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.ellipse(31, 5, 5, 8, 0.3, 0, Math.PI * 2); ctx.fill();
            // Face mask
            ctx.fillStyle = '#C0724A';
            ctx.beginPath(); ctx.arc(20, 14, 6, 0, Math.PI * 2); ctx.fill();
            // Eyes
            ctx.fillStyle = '#FFF';
            ctx.beginPath(); ctx.arc(16, 11, 3, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(24, 11, 3, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#000';
            ctx.beginPath(); ctx.arc(16, 11, 1, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(24, 11, 1, 0, Math.PI * 2); ctx.fill();
            // Snout
            ctx.fillStyle = '#FFF3E0';
            ctx.fillRect(15, 14, 10, 6);
            ctx.fillStyle = '#000';
            ctx.beginPath(); ctx.ellipse(20, 15, 2, 1.5, 0, 0, Math.PI * 2); ctx.fill();
            // Legs
            ctx.fillStyle = '#E88B5A';
            ctx.fillRect(12, 36, 5, 8); ctx.fillRect(23, 36, 5, 8);
            // Tail
            ctx.strokeStyle = '#C0724A'; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.moveTo(32, 28);
            ctx.quadraticCurveTo(40, 20 + Math.sin(gameTick * 0.1) * 4, 38, 15); ctx.stroke();
        }
        else if (char.type === 'Bandit') {
            // Bandit — Dad, big blue heeler
            ctx.fillStyle = '#37474F';
            ctx.beginPath(); ctx.ellipse(20, 25, 14, 14, 0, 0, Math.PI * 2); ctx.fill(); // body
            ctx.fillStyle = '#37474F';
            ctx.beginPath(); ctx.arc(20, 8, 11, 0, Math.PI * 2); ctx.fill(); // head
            // Ears (pointy)
            ctx.fillStyle = '#263238';
            ctx.beginPath(); ctx.moveTo(10, 0); ctx.lineTo(7, -10); ctx.lineTo(15, -1); ctx.fill();
            ctx.beginPath(); ctx.moveTo(30, 0); ctx.lineTo(33, -10); ctx.lineTo(25, -1); ctx.fill();
            // Tan mask
            ctx.fillStyle = '#546E7A';
            ctx.beginPath(); ctx.arc(20, 10, 6, 0, Math.PI * 2); ctx.fill();
            // Eyes
            ctx.fillStyle = '#FFF';
            ctx.beginPath(); ctx.arc(16, 8, 3, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(24, 8, 3, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#000';
            ctx.beginPath(); ctx.arc(16, 8, 1.2, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(24, 8, 1.2, 0, Math.PI * 2); ctx.fill();
            // Snout
            ctx.fillStyle = '#FFF3E0';
            ctx.fillRect(14, 11, 12, 7);
            ctx.fillStyle = '#000';
            ctx.beginPath(); ctx.ellipse(20, 12, 2.5, 1.5, 0, 0, Math.PI * 2); ctx.fill();
            // Legs
            ctx.fillStyle = '#37474F';
            ctx.fillRect(10, 37, 6, 10); ctx.fillRect(24, 37, 6, 10);
        }
        else if (char.type === 'Chilli') {
            // Chilli — Mom, red heeler
            ctx.fillStyle = '#D84315';
            ctx.beginPath(); ctx.ellipse(20, 26, 12, 12, 0, 0, Math.PI * 2); ctx.fill(); // body
            ctx.fillStyle = '#D84315';
            ctx.beginPath(); ctx.arc(20, 10, 10, 0, Math.PI * 2); ctx.fill(); // head
            // Ears (floppy)
            ctx.fillStyle = '#BF360C';
            ctx.beginPath(); ctx.ellipse(9, 3, 5, 7, -0.3, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.ellipse(31, 3, 5, 7, 0.3, 0, Math.PI * 2); ctx.fill();
            // Face
            ctx.fillStyle = '#BF360C';
            ctx.beginPath(); ctx.arc(20, 12, 5, 0, Math.PI * 2); ctx.fill();
            // Eyes
            ctx.fillStyle = '#FFF';
            ctx.beginPath(); ctx.arc(16, 9, 2.5, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(24, 9, 2.5, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#000';
            ctx.beginPath(); ctx.arc(16, 9, 1, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(24, 9, 1, 0, Math.PI * 2); ctx.fill();
            // Snout
            ctx.fillStyle = '#FFF3E0';
            ctx.fillRect(15, 12, 10, 6);
            ctx.fillStyle = '#000';
            ctx.beginPath(); ctx.ellipse(20, 13, 2, 1.5, 0, 0, Math.PI * 2); ctx.fill();
            // Legs
            ctx.fillStyle = '#D84315';
            ctx.fillRect(12, 36, 5, 8); ctx.fillRect(23, 36, 5, 8);
            // Tail
            ctx.strokeStyle = '#BF360C'; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.moveTo(32, 26);
            ctx.quadraticCurveTo(42, 18 + Math.sin(gameTick * 0.08) * 3, 40, 12); ctx.stroke();
        }
        else if (char.type === 'Muffin') {
            // Muffin — small white/light blue heeler (cousin)
            ctx.fillStyle = '#E0E0E0';
            ctx.beginPath(); ctx.ellipse(20, 28, 10, 8, 0, 0, Math.PI * 2); ctx.fill(); // body
            ctx.beginPath(); ctx.arc(20, 14, 9, 0, Math.PI * 2); ctx.fill(); // head
            // Ears
            ctx.fillStyle = '#BDBDBD';
            ctx.beginPath(); ctx.ellipse(10, 8, 4, 6, -0.2, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.ellipse(30, 8, 4, 6, 0.2, 0, Math.PI * 2); ctx.fill();
            // Blue patches
            ctx.fillStyle = '#90CAF9';
            ctx.beginPath(); ctx.arc(13, 14, 4, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(27, 14, 4, 0, Math.PI * 2); ctx.fill();
            // Eyes (big, cute)
            ctx.fillStyle = '#FFF';
            ctx.beginPath(); ctx.arc(16, 12, 3.5, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(24, 12, 3.5, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#000';
            ctx.beginPath(); ctx.arc(16, 12, 1.5, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(24, 12, 1.5, 0, Math.PI * 2); ctx.fill();
            // Nose
            ctx.fillStyle = '#FFF3E0';
            ctx.fillRect(16, 16, 8, 4);
            ctx.fillStyle = '#000';
            ctx.beginPath(); ctx.ellipse(20, 17, 1.5, 1, 0, 0, Math.PI * 2); ctx.fill();
            // Legs
            ctx.fillStyle = '#E0E0E0';
            ctx.fillRect(14, 34, 4, 6); ctx.fillRect(22, 34, 4, 6);
        }
        else if (char.type === 'Socks') {
            // Socks — tiny puppy on all fours
            ctx.fillStyle = '#E0E0E0';
            ctx.beginPath(); ctx.ellipse(20, 22, 14, 8, 0, 0, Math.PI * 2); ctx.fill(); // long body
            ctx.fillStyle = '#90CAF9';
            // Blue spots
            ctx.beginPath(); ctx.arc(14, 20, 4, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(26, 22, 3, 0, Math.PI * 2); ctx.fill();
            // Head (low, on all fours)
            ctx.fillStyle = '#E0E0E0';
            ctx.beginPath(); ctx.arc(6, 18, 7, 0, Math.PI * 2); ctx.fill();
            // Ears
            ctx.fillStyle = '#90CAF9';
            ctx.beginPath(); ctx.ellipse(1, 12, 3, 5, -0.3, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.ellipse(11, 12, 3, 5, 0.3, 0, Math.PI * 2); ctx.fill();
            // Eyes
            ctx.fillStyle = '#000';
            ctx.beginPath(); ctx.arc(4, 17, 1.2, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(9, 17, 1.2, 0, Math.PI * 2); ctx.fill();
            // Nose
            ctx.fillStyle = '#000';
            ctx.beginPath(); ctx.ellipse(6, 20, 1.5, 1, 0, 0, Math.PI * 2); ctx.fill();
            // Four legs
            ctx.fillStyle = '#E0E0E0';
            ctx.fillRect(8, 28, 4, 6); ctx.fillRect(16, 28, 4, 6);
            ctx.fillRect(24, 28, 4, 6); ctx.fillRect(30, 28, 4, 6);
            // Tail (wagging fast)
            ctx.strokeStyle = '#90CAF9'; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.moveTo(34, 20);
            ctx.quadraticCurveTo(40, 12 + Math.sin(gameTick * 0.15) * 6, 42, 10); ctx.stroke();
        }
        else if (char.type === 'Mackenzie') {
            // Mackenzie — Border Collie (black & white)
            ctx.fillStyle = '#212121';
            ctx.beginPath(); ctx.ellipse(20, 26, 12, 10, 0, 0, Math.PI * 2); ctx.fill(); // body
            // White chest
            ctx.fillStyle = '#FFF';
            ctx.beginPath(); ctx.ellipse(20, 30, 6, 6, 0, 0, Math.PI * 2); ctx.fill();
            // Head
            ctx.fillStyle = '#212121';
            ctx.beginPath(); ctx.arc(20, 10, 10, 0, Math.PI * 2); ctx.fill();
            // White blaze
            ctx.fillStyle = '#FFF';
            ctx.fillRect(18, 8, 4, 10);
            // Ears (floppy)
            ctx.fillStyle = '#212121';
            ctx.beginPath(); ctx.ellipse(9, 6, 5, 7, -0.4, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.ellipse(31, 6, 5, 7, 0.4, 0, Math.PI * 2); ctx.fill();
            // Eyes
            ctx.fillStyle = '#FFF';
            ctx.beginPath(); ctx.arc(16, 9, 2.5, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(24, 9, 2.5, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#4E342E';
            ctx.beginPath(); ctx.arc(16, 9, 1, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(24, 9, 1, 0, Math.PI * 2); ctx.fill();
            // Nose
            ctx.fillStyle = '#000';
            ctx.beginPath(); ctx.ellipse(20, 14, 2, 1.5, 0, 0, Math.PI * 2); ctx.fill();
            // Legs
            ctx.fillStyle = '#212121';
            ctx.fillRect(12, 34, 5, 8); ctx.fillRect(23, 34, 5, 8);
            // White socks
            ctx.fillStyle = '#FFF';
            ctx.fillRect(12, 39, 5, 3); ctx.fillRect(23, 39, 5, 3);
        }
        else if (char.type === 'Rusty') {
            // Rusty — red kelpie
            ctx.fillStyle = '#BF360C';
            ctx.beginPath(); ctx.ellipse(20, 26, 12, 10, 0, 0, Math.PI * 2); ctx.fill(); // body
            ctx.beginPath(); ctx.arc(20, 10, 10, 0, Math.PI * 2); ctx.fill(); // head
            // Pointy ears
            ctx.fillStyle = '#8B2500';
            ctx.beginPath(); ctx.moveTo(11, 2); ctx.lineTo(7, -8); ctx.lineTo(15, 0); ctx.fill();
            ctx.beginPath(); ctx.moveTo(29, 2); ctx.lineTo(33, -8); ctx.lineTo(25, 0); ctx.fill();
            // Tan chest
            ctx.fillStyle = '#FFAB91';
            ctx.beginPath(); ctx.ellipse(20, 30, 6, 5, 0, 0, Math.PI * 2); ctx.fill();
            // Eyes
            ctx.fillStyle = '#FFF';
            ctx.beginPath(); ctx.arc(16, 9, 2.5, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(24, 9, 2.5, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#4E342E';
            ctx.beginPath(); ctx.arc(16, 9, 1, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(24, 9, 1, 0, Math.PI * 2); ctx.fill();
            // Nose
            ctx.fillStyle = '#000';
            ctx.beginPath(); ctx.ellipse(20, 14, 2, 1.5, 0, 0, Math.PI * 2); ctx.fill();
            // Legs
            ctx.fillStyle = '#BF360C';
            ctx.fillRect(12, 34, 5, 8); ctx.fillRect(23, 34, 5, 8);
        }
        else if (char.type === 'Judo') {
            // Judo — Chow Chow (fluffy, tan/cream)
            ctx.fillStyle = '#FFCC80';
            // Fluffy body
            ctx.beginPath(); ctx.arc(20, 28, 14, 0, Math.PI * 2); ctx.fill();
            // Fluffy head/mane
            ctx.beginPath(); ctx.arc(20, 10, 13, 0, Math.PI * 2); ctx.fill();
            // Inner face
            ctx.fillStyle = '#FFB74D';
            ctx.beginPath(); ctx.arc(20, 12, 8, 0, Math.PI * 2); ctx.fill();
            // Ears (hidden in fluff)
            ctx.fillStyle = '#FFB74D';
            ctx.beginPath(); ctx.arc(8, 4, 4, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(32, 4, 4, 0, Math.PI * 2); ctx.fill();
            // Eyes
            ctx.fillStyle = '#000';
            ctx.beginPath(); ctx.arc(16, 11, 1.5, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(24, 11, 1.5, 0, Math.PI * 2); ctx.fill();
            // Nose
            ctx.fillStyle = '#000';
            ctx.beginPath(); ctx.ellipse(20, 15, 2, 1.5, 0, 0, Math.PI * 2); ctx.fill();
            // Stubby legs
            ctx.fillStyle = '#FFCC80';
            ctx.fillRect(12, 38, 6, 6); ctx.fillRect(22, 38, 6, 6);
        }
        else if (char.type === 'Chloe') {
            // Chloe — Dalmatian (white with black spots)
            ctx.fillStyle = '#FFF';
            ctx.beginPath(); ctx.ellipse(20, 26, 12, 10, 0, 0, Math.PI * 2); ctx.fill(); // body
            ctx.beginPath(); ctx.arc(20, 10, 10, 0, Math.PI * 2); ctx.fill(); // head
            // Floppy ears
            ctx.fillStyle = '#333';
            ctx.beginPath(); ctx.ellipse(9, 8, 4, 7, -0.3, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.ellipse(31, 8, 4, 7, 0.3, 0, Math.PI * 2); ctx.fill();
            // Spots on body
            ctx.fillStyle = '#333';
            ctx.beginPath(); ctx.arc(15, 24, 3, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(26, 28, 2.5, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(20, 32, 2, 0, Math.PI * 2); ctx.fill();
            // Spot on head
            ctx.beginPath(); ctx.arc(24, 5, 3, 0, Math.PI * 2); ctx.fill();
            // Eyes
            ctx.fillStyle = '#FFF';
            ctx.beginPath(); ctx.arc(16, 9, 2.5, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(24, 9, 2.5, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#4E342E';
            ctx.beginPath(); ctx.arc(16, 9, 1, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(24, 9, 1, 0, Math.PI * 2); ctx.fill();
            // Nose
            ctx.fillStyle = '#000';
            ctx.beginPath(); ctx.ellipse(20, 14, 2, 1.5, 0, 0, Math.PI * 2); ctx.fill();
            // Legs
            ctx.fillStyle = '#FFF';
            ctx.fillRect(12, 34, 5, 8); ctx.fillRect(23, 34, 5, 8);
        }

        // === TMNT World Background Characters ===
        else if (char.type === 'Raphael') {
            // Green turtle, red bandana, sai weapon
            ctx.fillStyle = '#4CAF50';
            ctx.beginPath(); ctx.ellipse(20, 28, 12, 10, 0, 0, Math.PI * 2); ctx.fill(); // body
            ctx.beginPath(); ctx.arc(20, 12, 9, 0, Math.PI * 2); ctx.fill(); // head
            // Red bandana
            ctx.fillStyle = '#D32F2F';
            ctx.fillRect(11, 9, 18, 5);
            // Bandana tail
            ctx.strokeStyle = '#D32F2F'; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.moveTo(29, 12); ctx.lineTo(36, 10 + Math.sin(gameTick * 0.1) * 2); ctx.stroke();
            // Eyes
            ctx.fillStyle = 'white';
            ctx.beginPath(); ctx.arc(16, 11, 3, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(24, 11, 3, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#000';
            ctx.beginPath(); ctx.arc(16, 11, 1, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(24, 11, 1, 0, Math.PI * 2); ctx.fill();
            // Sai weapon
            ctx.strokeStyle = '#90A4AE'; ctx.lineWidth = 1.5;
            ctx.beginPath(); ctx.moveTo(32, 20); ctx.lineTo(38, 5); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(35, 10); ctx.lineTo(38, 8); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(35, 10); ctx.lineTo(32, 8); ctx.stroke();
            // Legs
            ctx.fillStyle = '#4CAF50';
            ctx.fillRect(14, 36, 5, 8); ctx.fillRect(21, 36, 5, 8);
        }
        else if (char.type === 'Donatello') {
            // Green turtle, purple bandana, bo staff
            ctx.fillStyle = '#4CAF50';
            ctx.beginPath(); ctx.ellipse(20, 28, 12, 10, 0, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(20, 12, 9, 0, Math.PI * 2); ctx.fill();
            // Purple bandana
            ctx.fillStyle = '#7B1FA2';
            ctx.fillRect(11, 9, 18, 5);
            ctx.strokeStyle = '#7B1FA2'; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.moveTo(29, 12); ctx.lineTo(36, 10 + Math.sin(gameTick * 0.1) * 2); ctx.stroke();
            // Eyes
            ctx.fillStyle = 'white';
            ctx.beginPath(); ctx.arc(16, 11, 3, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(24, 11, 3, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#000';
            ctx.beginPath(); ctx.arc(16, 11, 1, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(24, 11, 1, 0, Math.PI * 2); ctx.fill();
            // Bo staff
            ctx.strokeStyle = '#795548'; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.moveTo(30, 0); ctx.lineTo(30, 45); ctx.stroke();
            // Legs
            ctx.fillStyle = '#4CAF50';
            ctx.fillRect(14, 36, 5, 8); ctx.fillRect(21, 36, 5, 8);
        }
        else if (char.type === 'Michelangelo') {
            // Green turtle, orange bandana, nunchucks, big grin
            ctx.fillStyle = '#4CAF50';
            ctx.beginPath(); ctx.ellipse(20, 28, 12, 10, 0, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(20, 12, 9, 0, Math.PI * 2); ctx.fill();
            // Orange bandana
            ctx.fillStyle = '#FF9800';
            ctx.fillRect(11, 9, 18, 5);
            ctx.strokeStyle = '#FF9800'; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.moveTo(29, 12); ctx.lineTo(36, 10 + Math.sin(gameTick * 0.1) * 2); ctx.stroke();
            // Eyes
            ctx.fillStyle = 'white';
            ctx.beginPath(); ctx.arc(16, 11, 3, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(24, 11, 3, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#000';
            ctx.beginPath(); ctx.arc(16, 11, 1, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(24, 11, 1, 0, Math.PI * 2); ctx.fill();
            // Big grin
            ctx.strokeStyle = '#FFF'; ctx.lineWidth = 1;
            ctx.beginPath(); ctx.arc(20, 16, 5, 0, Math.PI); ctx.stroke();
            // Nunchucks (swinging animated)
            let nunchuckAngle = Math.sin(gameTick * 0.15) * 0.5;
            ctx.strokeStyle = '#795548'; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.moveTo(32, 22); ctx.lineTo(36, 15); ctx.stroke();
            ctx.strokeStyle = '#555'; ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(36, 15);
            ctx.lineTo(36 + Math.sin(nunchuckAngle) * 8, 15 - Math.cos(nunchuckAngle) * 8); ctx.stroke();
            ctx.strokeStyle = '#795548'; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.moveTo(36 + Math.sin(nunchuckAngle) * 8, 15 - Math.cos(nunchuckAngle) * 8);
            ctx.lineTo(36 + Math.sin(nunchuckAngle) * 12, 15 - Math.cos(nunchuckAngle) * 12); ctx.stroke();
            // Legs
            ctx.fillStyle = '#4CAF50';
            ctx.fillRect(14, 36, 5, 8); ctx.fillRect(21, 36, 5, 8);
        }
        else if (char.type === 'Splinter') {
            // Brown-robed rat with ears, whiskers, walking stick
            ctx.fillStyle = '#5D4037';
            ctx.fillRect(10, 15, 20, 30); // robe
            // Head
            ctx.fillStyle = '#8D6E63';
            ctx.beginPath(); ctx.arc(20, 10, 8, 0, Math.PI * 2); ctx.fill();
            // Ears
            ctx.fillStyle = '#A1887F';
            ctx.beginPath(); ctx.arc(12, 4, 4, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(28, 4, 4, 0, Math.PI * 2); ctx.fill();
            // Eyes
            ctx.fillStyle = '#000';
            ctx.beginPath(); ctx.arc(17, 9, 1.5, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(23, 9, 1.5, 0, Math.PI * 2); ctx.fill();
            // Whiskers
            ctx.strokeStyle = '#BDBDBD'; ctx.lineWidth = 0.5;
            ctx.beginPath(); ctx.moveTo(14, 12); ctx.lineTo(5, 10); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(14, 14); ctx.lineTo(5, 15); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(26, 12); ctx.lineTo(35, 10); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(26, 14); ctx.lineTo(35, 15); ctx.stroke();
            // Walking stick
            ctx.strokeStyle = '#795548'; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.moveTo(33, 15); ctx.lineTo(35, 45); ctx.stroke();
        }
        else if (char.type === 'April') {
            // April O'Neil — yellow jumpsuit, red hair, blue eyes
            // Red hair
            ctx.fillStyle = '#E65100';
            ctx.beginPath(); ctx.arc(20, 8, 9, 0, Math.PI * 2); ctx.fill();
            // Face
            ctx.fillStyle = '#FFCC80';
            ctx.beginPath(); ctx.arc(20, 10, 7, 0, Math.PI * 2); ctx.fill();
            // Blue eyes
            ctx.fillStyle = '#1565C0';
            ctx.beginPath(); ctx.arc(17, 9, 2, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(23, 9, 2, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#000';
            ctx.beginPath(); ctx.arc(17, 9, 0.8, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(23, 9, 0.8, 0, Math.PI * 2); ctx.fill();
            // Mouth
            ctx.strokeStyle = '#D84315'; ctx.lineWidth = 0.8;
            ctx.beginPath(); ctx.arc(20, 13, 2, 0, Math.PI); ctx.stroke();
            // Yellow jumpsuit body
            ctx.fillStyle = '#FDD835';
            ctx.fillRect(12, 18, 16, 20);
            // White belt
            ctx.fillStyle = '#FFF';
            ctx.fillRect(12, 28, 16, 3);
            // Legs
            ctx.fillStyle = '#FDD835';
            ctx.fillRect(14, 38, 5, 8); ctx.fillRect(21, 38, 5, 8);
            // White boots
            ctx.fillStyle = '#FFF';
            ctx.fillRect(13, 43, 7, 4); ctx.fillRect(20, 43, 7, 4);
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
        // === Cat World Creatures ===
        else if (c.type === 'butterfly') {
            let wingFlap = Math.sin(gameTick * 0.2 + c.wobbleOffset) * 6;
            ctx.fillStyle = ['#FF69B4', '#FFD700', '#87CEEB', '#DDA0DD'][Math.floor(c.wobbleOffset) % 4];
            ctx.beginPath(); ctx.ellipse(c.x - 4, c.y, Math.abs(wingFlap), 5, -0.3, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.ellipse(c.x + 4, c.y, Math.abs(wingFlap), 5, 0.3, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#333';
            ctx.fillRect(c.x - 0.5, c.y - 3, 1, 7);
            // Antennae
            ctx.strokeStyle = '#333'; ctx.lineWidth = 0.5;
            ctx.beginPath(); ctx.moveTo(c.x, c.y - 3); ctx.lineTo(c.x - 3, c.y - 7); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(c.x, c.y - 3); ctx.lineTo(c.x + 3, c.y - 7); ctx.stroke();
        }
        else if (c.type === 'mouse') {
            ctx.fillStyle = '#BDBDBD';
            ctx.beginPath(); ctx.ellipse(c.x, c.y, 8, 5, 0, 0, Math.PI * 2); ctx.fill();
            // Head
            ctx.beginPath(); ctx.arc(c.x - 8, c.y, 4, 0, Math.PI * 2); ctx.fill();
            // Ears
            ctx.fillStyle = '#F48FB1';
            ctx.beginPath(); ctx.arc(c.x - 10, c.y - 4, 3, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(c.x - 6, c.y - 4, 3, 0, Math.PI * 2); ctx.fill();
            // Eye
            ctx.fillStyle = 'black';
            ctx.beginPath(); ctx.arc(c.x - 10, c.y, 1, 0, Math.PI * 2); ctx.fill();
            // Tail
            ctx.strokeStyle = '#BDBDBD'; ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(c.x + 8, c.y);
            ctx.quadraticCurveTo(c.x + 15, c.y - 5, c.x + 18, c.y + 2); ctx.stroke();
        }
        else if (c.type === 'bird') {
            let flapY = Math.sin(gameTick * 0.15 + c.wobbleOffset) * 3;
            ctx.fillStyle = '#42A5F5';
            ctx.beginPath(); ctx.ellipse(c.x, c.y, 8, 5, 0, 0, Math.PI * 2); ctx.fill();
            // Wings
            ctx.fillStyle = '#1E88E5';
            ctx.beginPath(); ctx.ellipse(c.x, c.y - 4 + flapY, 10, 3, 0, 0, Math.PI * 2); ctx.fill();
            // Beak
            ctx.fillStyle = '#FF8F00';
            ctx.beginPath(); ctx.moveTo(c.x - 8, c.y - 1); ctx.lineTo(c.x - 13, c.y); ctx.lineTo(c.x - 8, c.y + 1); ctx.fill();
            // Eye
            ctx.fillStyle = 'white'; ctx.beginPath(); ctx.arc(c.x - 4, c.y - 1, 2, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = 'black'; ctx.beginPath(); ctx.arc(c.x - 4, c.y - 1, 1, 0, Math.PI * 2); ctx.fill();
        }
        else if (c.type === 'dragonfly') {
            ctx.fillStyle = '#26C6DA';
            ctx.fillRect(c.x - 8, c.y, 16, 2);
            // Wings
            let wingA = Math.sin(gameTick * 0.25 + c.wobbleOffset) * 5;
            ctx.globalAlpha = 0.4;
            ctx.fillStyle = '#B2EBF2';
            ctx.beginPath(); ctx.ellipse(c.x - 2, c.y - 2 + wingA, 8, 2, -0.2, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.ellipse(c.x + 2, c.y - 2 - wingA, 8, 2, 0.2, 0, Math.PI * 2); ctx.fill();
            ctx.globalAlpha = 0.55;
            // Eyes
            ctx.fillStyle = '#00838F';
            ctx.beginPath(); ctx.arc(c.x - 8, c.y, 2, 0, Math.PI * 2); ctx.fill();
        }
        // === Bluey World Creatures ===
        else if (c.type === 'cockatoo') {
            // White cockatoo with yellow crest
            let flapY = Math.sin(gameTick * 0.12 + c.wobbleOffset) * 4;
            ctx.fillStyle = '#FFF';
            ctx.beginPath(); ctx.ellipse(c.x, c.y, 9, 7, 0, 0, Math.PI * 2); ctx.fill(); // body
            ctx.beginPath(); ctx.arc(c.x - 5, c.y - 6, 6, 0, Math.PI * 2); ctx.fill(); // head
            // Yellow crest
            ctx.fillStyle = '#FFD600';
            ctx.beginPath(); ctx.moveTo(c.x - 5, c.y - 12); ctx.lineTo(c.x - 8, c.y - 22 + flapY); ctx.lineTo(c.x - 2, c.y - 12); ctx.fill();
            ctx.beginPath(); ctx.moveTo(c.x - 3, c.y - 12); ctx.lineTo(c.x - 4, c.y - 20 + flapY); ctx.lineTo(c.x, c.y - 11); ctx.fill();
            // Eye
            ctx.fillStyle = '#000';
            ctx.beginPath(); ctx.arc(c.x - 7, c.y - 7, 1.2, 0, Math.PI * 2); ctx.fill();
            // Beak
            ctx.fillStyle = '#37474F';
            ctx.beginPath(); ctx.moveTo(c.x - 11, c.y - 6); ctx.lineTo(c.x - 15, c.y - 4); ctx.lineTo(c.x - 11, c.y - 3); ctx.fill();
            // Wings
            ctx.fillStyle = '#E0E0E0';
            ctx.beginPath(); ctx.ellipse(c.x + 2, c.y - 2 + flapY, 10, 4, 0.2, 0, Math.PI * 2); ctx.fill();
            // Tail
            ctx.fillStyle = '#FFF';
            ctx.beginPath(); ctx.moveTo(c.x + 9, c.y); ctx.lineTo(c.x + 16, c.y - 2); ctx.lineTo(c.x + 15, c.y + 3); ctx.fill();
        }
        else if (c.type === 'lizard') {
            // Australian blue-tongue lizard
            ctx.fillStyle = '#8D6E63';
            ctx.beginPath(); ctx.ellipse(c.x, c.y, 14, 4, 0, 0, Math.PI * 2); ctx.fill(); // body
            // Head
            ctx.fillStyle = '#795548';
            ctx.beginPath(); ctx.ellipse(c.x - 14, c.y, 5, 4, 0, 0, Math.PI * 2); ctx.fill();
            // Blue tongue (flicking)
            let tongueOut = Math.sin(gameTick * 0.08 + c.wobbleOffset) > 0.5;
            if (tongueOut) {
                ctx.fillStyle = '#42A5F5';
                ctx.fillRect(c.x - 20, c.y - 1, 5, 2);
            }
            // Stripes
            ctx.fillStyle = '#6D4C41';
            for (let s = -8; s < 10; s += 5) {
                ctx.fillRect(c.x + s, c.y - 3, 2, 6);
            }
            // Eye
            ctx.fillStyle = '#000';
            ctx.beginPath(); ctx.arc(c.x - 16, c.y - 1, 1, 0, Math.PI * 2); ctx.fill();
            // Legs
            ctx.fillStyle = '#8D6E63';
            ctx.fillRect(c.x - 8, c.y + 3, 3, 4); ctx.fillRect(c.x + 5, c.y + 3, 3, 4);
            // Tail
            ctx.strokeStyle = '#8D6E63'; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.moveTo(c.x + 14, c.y);
            ctx.quadraticCurveTo(c.x + 22, c.y - 2, c.x + 26, c.y + 1); ctx.stroke();
        }
        else if (c.type === 'ibis') {
            // Bin chicken (Australian white ibis)
            let legStep = Math.sin(gameTick * 0.1 + c.wobbleOffset) * 2;
            ctx.fillStyle = '#FFF';
            ctx.beginPath(); ctx.ellipse(c.x, c.y, 10, 7, 0, 0, Math.PI * 2); ctx.fill(); // body
            // Black tail feathers
            ctx.fillStyle = '#212121';
            ctx.beginPath(); ctx.moveTo(c.x + 10, c.y); ctx.lineTo(c.x + 18, c.y - 4); ctx.lineTo(c.x + 18, c.y + 4); ctx.fill();
            // Neck
            ctx.strokeStyle = '#FFF'; ctx.lineWidth = 3;
            ctx.beginPath(); ctx.moveTo(c.x - 8, c.y - 2); ctx.lineTo(c.x - 12, c.y - 14); ctx.stroke();
            // Head
            ctx.fillStyle = '#212121';
            ctx.beginPath(); ctx.arc(c.x - 12, c.y - 16, 4, 0, Math.PI * 2); ctx.fill();
            // Long curved beak
            ctx.strokeStyle = '#212121'; ctx.lineWidth = 1.5;
            ctx.beginPath(); ctx.moveTo(c.x - 12, c.y - 15);
            ctx.quadraticCurveTo(c.x - 20, c.y - 10, c.x - 22, c.y - 8); ctx.stroke();
            // Eye
            ctx.fillStyle = '#FFF';
            ctx.beginPath(); ctx.arc(c.x - 11, c.y - 17, 1, 0, Math.PI * 2); ctx.fill();
            // Legs
            ctx.strokeStyle = '#FF8F00'; ctx.lineWidth = 1.5;
            ctx.beginPath(); ctx.moveTo(c.x - 3, c.y + 7); ctx.lineTo(c.x - 5, c.y + 16 + legStep); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(c.x + 3, c.y + 7); ctx.lineTo(c.x + 1, c.y + 16 - legStep); ctx.stroke();
        }
        else if (c.type === 'frog') {
            // Green tree frog
            ctx.fillStyle = '#66BB6A';
            ctx.beginPath(); ctx.ellipse(c.x, c.y, 8, 6, 0, 0, Math.PI * 2); ctx.fill(); // body
            // Head
            ctx.beginPath(); ctx.arc(c.x - 6, c.y - 2, 5, 0, Math.PI * 2); ctx.fill();
            // Big eyes (on top of head)
            ctx.fillStyle = '#FFF';
            ctx.beginPath(); ctx.arc(c.x - 9, c.y - 6, 3, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(c.x - 3, c.y - 6, 3, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#000';
            ctx.beginPath(); ctx.arc(c.x - 9, c.y - 6, 1.5, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(c.x - 3, c.y - 6, 1.5, 0, Math.PI * 2); ctx.fill();
            // Mouth line
            ctx.strokeStyle = '#388E3C'; ctx.lineWidth = 0.8;
            ctx.beginPath(); ctx.arc(c.x - 6, c.y, 3, 0, Math.PI); ctx.stroke();
            // Front legs
            ctx.fillStyle = '#66BB6A';
            ctx.fillRect(c.x - 8, c.y + 4, 3, 5);
            ctx.fillRect(c.x + 2, c.y + 4, 3, 5);
            // Back legs (bent)
            ctx.strokeStyle = '#66BB6A'; ctx.lineWidth = 2.5;
            ctx.beginPath(); ctx.moveTo(c.x + 6, c.y + 2);
            ctx.quadraticCurveTo(c.x + 14, c.y + 8, c.x + 10, c.y + 12); ctx.stroke();
        }
        else if (c.type === 'patty') {
            // Bun bottom
            ctx.fillStyle = '#F4A460';
            ctx.fillRect(c.x, c.y + 12, 30, 6);
            // Patty
            ctx.fillStyle = '#8B4513';
            ctx.beginPath(); ctx.ellipse(c.x + 15, c.y + 12, 16, 4, 0, 0, Math.PI * 2); ctx.fill();
            // Lettuce
            ctx.strokeStyle = '#32CD32'; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.moveTo(c.x, c.y + 10); ctx.quadraticCurveTo(c.x + 15, c.y + 14, c.x + 30, c.y + 10); ctx.stroke();
            // Bun top
            ctx.fillStyle = '#F4A460';
            ctx.beginPath(); ctx.arc(c.x + 15, c.y + 8, 14, Math.PI, 0); ctx.fill();
            // Seeds
            ctx.fillStyle = '#FFE4B5';
            ctx.beginPath(); ctx.arc(c.x + 10, c.y + 4, 1, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(c.x + 18, c.y + 2, 1, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(c.x + 22, c.y + 6, 1, 0, Math.PI * 2); ctx.fill();
        } else if (c.type === 'fish') {
            // Simple blue fish logic
            ctx.fillStyle = '#2196F3';
            ctx.beginPath(); ctx.ellipse(c.x + 15, c.y + 15, 12, 8, 0, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.moveTo(c.x + 25, c.y + 15); ctx.lineTo(c.x + 35, c.y + 10); ctx.lineTo(c.x + 35, c.y + 20); ctx.fill();
        } else if (c.type === 'bone') {
            // Dog bone
            ctx.fillStyle = '#EEE';
            ctx.fillRect(c.x + 5, c.y + 12, 20, 6);
            ctx.beginPath(); ctx.arc(c.x + 5, c.y + 11, 4, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(c.x + 5, c.y + 19, 4, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(c.x + 25, c.y + 11, 4, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(c.x + 25, c.y + 19, 4, 0, Math.PI * 2); ctx.fill();
        } else if (c.type === 'skull') {
            // Skull
            ctx.fillStyle = '#E0E0E0';
            ctx.beginPath(); ctx.arc(c.x + 15, c.y + 12, 10, 0, Math.PI * 2); ctx.fill(); // Cranium
            ctx.fillRect(c.x + 10, c.y + 18, 10, 8); // Jaw
            ctx.fillStyle = '#000';
            ctx.beginPath(); ctx.arc(c.x + 11, c.y + 12, 3, 0, Math.PI * 2); ctx.fill(); // Left Eye
            ctx.beginPath(); ctx.arc(c.x + 19, c.y + 12, 3, 0, Math.PI * 2); ctx.fill(); // Right Eye
            ctx.beginPath(); ctx.moveTo(c.x + 15, c.y + 16); ctx.lineTo(c.x + 13, c.y + 20); ctx.lineTo(c.x + 17, c.y + 20); ctx.fill(); // Nose
        }
        // === TMNT World Creatures ===
        else if (c.type === 'rat') {
            // Brown rat
            ctx.fillStyle = '#795548';
            ctx.beginPath(); ctx.ellipse(c.x, c.y, 8, 5, 0, 0, Math.PI * 2); ctx.fill(); // body
            // Head
            ctx.beginPath(); ctx.arc(c.x - 8, c.y, 4, 0, Math.PI * 2); ctx.fill();
            // Pink ears
            ctx.fillStyle = '#F48FB1';
            ctx.beginPath(); ctx.arc(c.x - 10, c.y - 4, 2.5, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(c.x - 6, c.y - 4, 2.5, 0, Math.PI * 2); ctx.fill();
            // Eye
            ctx.fillStyle = '#000';
            ctx.beginPath(); ctx.arc(c.x - 10, c.y, 1, 0, Math.PI * 2); ctx.fill();
            // Long curving tail
            ctx.strokeStyle = '#A1887F'; ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(c.x + 8, c.y);
            ctx.quadraticCurveTo(c.x + 18, c.y - 8, c.x + 22, c.y + 2); ctx.stroke();
        }
        else if (c.type === 'pigeon') {
            // Grey pigeon with green neck
            let flapY = Math.sin(gameTick * 0.15 + c.wobbleOffset) * 3;
            ctx.fillStyle = '#9E9E9E';
            ctx.beginPath(); ctx.ellipse(c.x, c.y, 8, 5, 0, 0, Math.PI * 2); ctx.fill(); // body
            // Iridescent green neck
            ctx.fillStyle = '#2E7D32';
            ctx.beginPath(); ctx.ellipse(c.x - 6, c.y - 2, 4, 4, 0, 0, Math.PI * 2); ctx.fill();
            // Head
            ctx.fillStyle = '#757575';
            ctx.beginPath(); ctx.arc(c.x - 8, c.y - 5, 3, 0, Math.PI * 2); ctx.fill();
            // Eye
            ctx.fillStyle = '#FF6D00';
            ctx.beginPath(); ctx.arc(c.x - 9, c.y - 5, 1, 0, Math.PI * 2); ctx.fill();
            // Orange beak
            ctx.fillStyle = '#FF8F00';
            ctx.beginPath(); ctx.moveTo(c.x - 11, c.y - 5); ctx.lineTo(c.x - 14, c.y - 4); ctx.lineTo(c.x - 11, c.y - 3); ctx.fill();
            // Flapping wings
            ctx.fillStyle = '#BDBDBD';
            ctx.beginPath(); ctx.ellipse(c.x, c.y - 3 + flapY, 9, 3, 0, 0, Math.PI * 2); ctx.fill();
        }
        else if (c.type === 'cockroach') {
            // Small dark brown cockroach
            ctx.fillStyle = '#4E342E';
            ctx.beginPath(); ctx.ellipse(c.x, c.y, 5, 3, 0, 0, Math.PI * 2); ctx.fill();
            // Antennae
            ctx.strokeStyle = '#4E342E'; ctx.lineWidth = 0.5;
            ctx.beginPath(); ctx.moveTo(c.x - 4, c.y - 1); ctx.lineTo(c.x - 8, c.y - 5); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(c.x - 3, c.y - 1); ctx.lineTo(c.x - 6, c.y - 6); ctx.stroke();
            // 3 pairs of legs
            ctx.strokeStyle = '#3E2723'; ctx.lineWidth = 0.5;
            for (let l = 0; l < 3; l++) {
                let lx = c.x - 2 + l * 3;
                ctx.beginPath(); ctx.moveTo(lx, c.y + 2); ctx.lineTo(lx - 2, c.y + 5); ctx.stroke();
                ctx.beginPath(); ctx.moveTo(lx, c.y + 2); ctx.lineTo(lx + 2, c.y + 5); ctx.stroke();
            }
        }
        else if (c.type === 'sewer_bat') {
            // Dark bat with flapping wings and red eyes
            let flapY = Math.sin(gameTick * 0.2 + c.wobbleOffset) * 5;
            ctx.fillStyle = '#333';
            ctx.beginPath(); ctx.arc(c.x, c.y, 5, 0, Math.PI * 2); ctx.fill(); // body
            // Pointed ears
            ctx.beginPath(); ctx.moveTo(c.x - 3, c.y - 4); ctx.lineTo(c.x - 5, c.y - 9); ctx.lineTo(c.x - 1, c.y - 4); ctx.fill();
            ctx.beginPath(); ctx.moveTo(c.x + 3, c.y - 4); ctx.lineTo(c.x + 5, c.y - 9); ctx.lineTo(c.x + 1, c.y - 4); ctx.fill();
            // Flapping wings
            ctx.beginPath(); ctx.moveTo(c.x - 4, c.y); ctx.lineTo(c.x - 16, c.y - 4 + flapY);
            ctx.lineTo(c.x - 8, c.y + 2); ctx.fill();
            ctx.beginPath(); ctx.moveTo(c.x + 4, c.y); ctx.lineTo(c.x + 16, c.y - 4 - flapY);
            ctx.lineTo(c.x + 8, c.y + 2); ctx.fill();
            // Red eyes
            ctx.fillStyle = '#F44336';
            ctx.beginPath(); ctx.arc(c.x - 2, c.y - 1, 1, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(c.x + 2, c.y - 1, 1, 0, Math.PI * 2); ctx.fill();
        }

        ctx.restore();
    });
}

function drawEntities() {
    // Player Draw Logic (skip player drawing during invulnerability blink frames)
    let skipPlayerDraw = player.invulnerable > 0 && Math.floor(gameTick / 4) % 2 === 0;

    if (!skipPlayerDraw) {
    let bounce = player.grounded ? Math.sin(gameTick * 0.5) * 2 : 0;

    if (gameMode === 'cat') {
        // === CAT PLAYER ===
        let px = player.x, py = player.y + bounce;
        // Body (orange tabby)
        ctx.fillStyle = '#FF8C00';
        ctx.beginPath(); ctx.ellipse(px + 25, py + 30, 22, 18, 0, 0, Math.PI * 2); ctx.fill();
        // Stripes
        ctx.strokeStyle = '#CC6600'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(px + 15, py + 20); ctx.lineTo(px + 18, py + 40); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(px + 25, py + 15); ctx.lineTo(px + 25, py + 42); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(px + 35, py + 20); ctx.lineTo(px + 32, py + 40); ctx.stroke();
        // Head
        ctx.fillStyle = '#FF8C00';
        ctx.beginPath(); ctx.arc(px + 25, py + 10, 14, 0, Math.PI * 2); ctx.fill();
        // Ears
        ctx.beginPath(); ctx.moveTo(px + 13, py + 2); ctx.lineTo(px + 9, py - 10); ctx.lineTo(px + 18, py); ctx.fill();
        ctx.beginPath(); ctx.moveTo(px + 37, py + 2); ctx.lineTo(px + 41, py - 10); ctx.lineTo(px + 32, py); ctx.fill();
        // Inner ears
        ctx.fillStyle = '#FFB6C1';
        ctx.beginPath(); ctx.moveTo(px + 14, py + 1); ctx.lineTo(px + 11, py - 6); ctx.lineTo(px + 17, py); ctx.fill();
        ctx.beginPath(); ctx.moveTo(px + 36, py + 1); ctx.lineTo(px + 39, py - 6); ctx.lineTo(px + 33, py); ctx.fill();
        // Eyes
        ctx.fillStyle = '#4CAF50';
        ctx.beginPath(); ctx.arc(px + 20, py + 8, 4, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(px + 30, py + 8, 4, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = 'black';
        ctx.beginPath(); ctx.ellipse(px + 20, py + 8, 1.5, 3.5, 0, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(px + 30, py + 8, 1.5, 3.5, 0, 0, Math.PI * 2); ctx.fill();
        // Nose
        ctx.fillStyle = '#FF69B4';
        ctx.beginPath(); ctx.moveTo(px + 25, py + 14); ctx.lineTo(px + 23, py + 12); ctx.lineTo(px + 27, py + 12); ctx.fill();
        // Whiskers
        ctx.strokeStyle = '#DDD'; ctx.lineWidth = 0.8;
        ctx.beginPath(); ctx.moveTo(px + 15, py + 12); ctx.lineTo(px + 5, py + 9); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(px + 15, py + 14); ctx.lineTo(px + 5, py + 15); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(px + 35, py + 12); ctx.lineTo(px + 45, py + 9); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(px + 35, py + 14); ctx.lineTo(px + 45, py + 15); ctx.stroke();
        // Legs
        ctx.fillStyle = '#FF8C00';
        let legAnim = player.grounded ? Math.sin(gameTick * 0.5) * 3 : 0;
        ctx.fillRect(px + 10, py + 42, 7, 10 + legAnim);
        ctx.fillRect(px + 33, py + 42, 7, 10 - legAnim);
        // Paws
        ctx.fillStyle = '#FFE0B2';
        ctx.fillRect(px + 9, py + 51 + legAnim, 9, 4);
        ctx.fillRect(px + 32, py + 51 - legAnim, 9, 4);
        // Tail (wagging when grounded)
        ctx.strokeStyle = '#FF8C00'; ctx.lineWidth = 4;
        let tailWag = player.grounded ? Math.sin(gameTick * 0.12) * 8 : -3;
        ctx.beginPath(); ctx.moveTo(px + 45, py + 28);
        ctx.quadraticCurveTo(px + 55 + tailWag, py + 15, px + 52, py + 5); ctx.stroke();
        // Tail tip
        ctx.strokeStyle = '#FFE0B2'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(px + 52, py + 8); ctx.lineTo(px + 52, py + 5); ctx.stroke();
        if (player.invulnerable > 0 && Math.floor(gameTick / 4) % 2 === 0) ctx.globalAlpha = 0.5;

    } else if (gameMode === 'bluey') {
        // === BLUEY PLAYER ===
        if (player.invulnerable > 0 && Math.floor(gameTick / 4) % 2 === 0) ctx.globalAlpha = 0.5;

        let px = player.x, py = player.y + bounce;
        // Body
        ctx.fillStyle = '#42A5F5';
        ctx.fillRect(px + 10, py + 20, 30, 30);
        // Stomach
        ctx.fillStyle = '#90CAF9';
        ctx.fillRect(px + 15, py + 25, 20, 20);
        // Head
        ctx.fillStyle = '#42A5F5';
        ctx.fillRect(px + 5, py, 40, 25);
        // Mask
        ctx.fillStyle = '#1565C0';
        ctx.fillRect(px + 8, py + 5, 12, 12); ctx.fillRect(px + 30, py + 5, 12, 12);
        // Ears
        ctx.fillStyle = '#1565C0';
        ctx.beginPath(); ctx.moveTo(px + 8, py); ctx.lineTo(px + 12, py - 10); ctx.lineTo(px + 18, py); ctx.fill();
        ctx.beginPath(); ctx.moveTo(px + 32, py); ctx.lineTo(px + 38, py - 10); ctx.lineTo(px + 42, py); ctx.fill();
        // Eyes
        ctx.fillStyle = '#FFF';
        ctx.beginPath(); ctx.arc(px + 15, py + 12, 3, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(px + 35, py + 12, 3, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#000';
        ctx.beginPath(); ctx.arc(px + 15, py + 12, 1, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(px + 35, py + 12, 1, 0, Math.PI * 2); ctx.fill();
        // Snout
        ctx.fillStyle = '#FFF3E0';
        ctx.fillRect(px + 18, py + 12, 14, 12);
        ctx.fillStyle = '#000';
        ctx.beginPath(); ctx.ellipse(px + 25, py + 14, 3, 2, 0, 0, Math.PI * 2); ctx.fill(); // Nose
        // Tail
        ctx.fillStyle = '#1565C0';
        let tailWag = Math.sin(gameTick * 0.5) * 5;
        ctx.beginPath(); ctx.moveTo(px + 10, py + 40); ctx.lineTo(px - 5, py + 35 + tailWag); ctx.lineWidth = 4; ctx.strokeStyle = '#1565C0'; ctx.stroke();

        ctx.globalAlpha = 1.0;

    } else if (gameMode === 'scary') {
        // === SCARY PLAYER ===
        if (player.invulnerable > 0 && Math.floor(gameTick / 4) % 2 === 0) ctx.globalAlpha = 0.5;

        let px = player.x, py = player.y + bounce;
        // Hooded robe
        ctx.fillStyle = '#212121';
        ctx.beginPath();
        ctx.moveTo(px + 25, py); // top of hood
        ctx.lineTo(px + 50, py + 50); // bottom right
        ctx.lineTo(px, py + 50); // bottom left
        ctx.fill();

        // Hood opening (void)
        ctx.fillStyle = '#000';
        ctx.beginPath(); ctx.ellipse(px + 25, py + 20, 10, 12, 0, 0, Math.PI * 2); ctx.fill();

        // Glowing red eyes
        ctx.fillStyle = '#FF0000';
        ctx.shadowBlur = 5; ctx.shadowColor = '#FF0000';
        ctx.beginPath(); ctx.arc(px + 22, py + 20, 2, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(px + 28, py + 20, 2, 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 0;

        // Floating effect
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.beginPath(); ctx.ellipse(px + 25, py + 55, 15 - bounce, 4, 0, 0, Math.PI * 2); ctx.fill();

        ctx.globalAlpha = 1.0;

    } else if (gameMode === 'tmnt') {
        // === TMNT PLAYER (Leonardo) ===
        if (player.invulnerable > 0 && Math.floor(gameTick / 4) % 2 === 0) ctx.globalAlpha = 0.5;

        let px = player.x, py = player.y + bounce;
        let legAnim = player.grounded ? Math.sin(gameTick * 0.5) * 3 : 0;

        // Shell (back)
        ctx.fillStyle = '#5D4037';
        ctx.beginPath(); ctx.ellipse(px + 25, py + 28, 18, 14, 0, 0, Math.PI * 2); ctx.fill();
        // Shell cross-pattern
        ctx.strokeStyle = '#4E342E'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(px + 12, py + 28); ctx.lineTo(px + 38, py + 28); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(px + 25, py + 16); ctx.lineTo(px + 25, py + 40); ctx.stroke();

        // Green body
        ctx.fillStyle = '#4CAF50';
        ctx.beginPath(); ctx.ellipse(px + 25, py + 28, 14, 12, 0, 0, Math.PI * 2); ctx.fill();
        // Lighter plastron (chest plate)
        ctx.fillStyle = '#A5D6A7';
        ctx.beginPath(); ctx.ellipse(px + 25, py + 30, 8, 9, 0, 0, Math.PI * 2); ctx.fill();

        // Head
        ctx.fillStyle = '#4CAF50';
        ctx.beginPath(); ctx.arc(px + 25, py + 10, 10, 0, Math.PI * 2); ctx.fill();

        // Blue bandana
        ctx.fillStyle = '#1565C0';
        ctx.fillRect(px + 15, py + 7, 20, 6);
        // Bandana tail (trailing, animated)
        ctx.strokeStyle = '#1565C0'; ctx.lineWidth = 3;
        let tailWave = Math.sin(gameTick * 0.12) * 4;
        ctx.beginPath(); ctx.moveTo(px + 35, py + 10);
        ctx.quadraticCurveTo(px + 45, py + 8 + tailWave, px + 50, py + 12 + tailWave); ctx.stroke();

        // White eyes through bandana mask
        ctx.fillStyle = 'white';
        ctx.beginPath(); ctx.ellipse(px + 20, py + 9, 4, 3, 0, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(px + 30, py + 9, 4, 3, 0, 0, Math.PI * 2); ctx.fill();
        // Pupils
        ctx.fillStyle = '#000';
        ctx.beginPath(); ctx.arc(px + 21, py + 9, 1.5, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(px + 31, py + 9, 1.5, 0, Math.PI * 2); ctx.fill();

        // Dual katana swords (crossed on back)
        ctx.strokeStyle = '#90A4AE'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(px + 18, py + 2); ctx.lineTo(px + 32, py + 22); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(px + 32, py + 2); ctx.lineTo(px + 18, py + 22); ctx.stroke();
        // Katana handles (blue)
        ctx.strokeStyle = '#1565C0'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(px + 18, py + 2); ctx.lineTo(px + 16, py - 2); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(px + 32, py + 2); ctx.lineTo(px + 34, py - 2); ctx.stroke();

        // Belt with yellow buckle
        ctx.fillStyle = '#5D4037';
        ctx.fillRect(px + 14, py + 36, 22, 4);
        ctx.fillStyle = '#FFD700';
        ctx.fillRect(px + 23, py + 36, 6, 4);

        // Brown elbow pads
        ctx.fillStyle = '#795548';
        ctx.fillRect(px + 8, py + 22, 5, 5);
        ctx.fillRect(px + 37, py + 22, 5, 5);

        // Three-fingered green hands
        ctx.fillStyle = '#66BB6A';
        ctx.beginPath(); ctx.arc(px + 8, py + 28, 4, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(px + 42, py + 28, 4, 0, Math.PI * 2); ctx.fill();

        // Brown knee pads
        ctx.fillStyle = '#795548';
        ctx.fillRect(px + 14, py + 44, 5, 4);
        ctx.fillRect(px + 31, py + 44, 5, 4);

        // Legs (walking animation when grounded)
        ctx.fillStyle = '#4CAF50';
        ctx.fillRect(px + 14, py + 40, 7, 12 + legAnim);
        ctx.fillRect(px + 29, py + 40, 7, 12 - legAnim);

        // Two-toed feet
        ctx.fillStyle = '#388E3C';
        ctx.fillRect(px + 12, py + 51 + legAnim, 5, 4);
        ctx.fillRect(px + 18, py + 51 + legAnim, 5, 4);
        ctx.fillRect(px + 27, py + 51 - legAnim, 5, 4);
        ctx.fillRect(px + 33, py + 51 - legAnim, 5, 4);

        ctx.globalAlpha = 1.0;

    } else {
        // === SPONGEBOB PLAYER ===
        // Body
        ctx.fillStyle = '#F7E414';
        ctx.fillRect(player.x, player.y + bounce, player.width, player.height);
        // Sponge details
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
        ctx.fillStyle = 'black';
        ctx.beginPath(); ctx.arc(player.x + 15, player.y + 15 + bounce, 1, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(player.x + 35, player.y + 15 + bounce, 1, 0, Math.PI * 2); ctx.fill();
        // Smile
        ctx.beginPath(); ctx.arc(player.x + 25, player.y + 30 + bounce, 10, 0, Math.PI, false); ctx.stroke();
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
        // Shoes
        ctx.fillStyle = 'black';
        ctx.fillRect(player.x + 8, leftLegY + leftLegH, 10, 5);
        ctx.fillRect(player.x + 28, rightLegY + rightLegH, 10, 5);
    }
    } // end if (!skipPlayerDraw)

    // Obstacles
    obstacles.forEach(o => {
        if (o.type === 'jellyfish') return;
        if (o.isPit) return; // Pits are drawn in drawScrollingGround

        if (o.type === 'spike') {
            // New Spikes Visual: Three sharp metallic spikes
            let sx = o.x;
            for (let i = 0; i < 3; i++) {
                // Base
                ctx.fillStyle = '#CFD8DC';
                ctx.beginPath();
                ctx.moveTo(sx, o.y + o.height);
                ctx.lineTo(sx + 5, o.y + 5); // Tip peak
                ctx.lineTo(sx + 10, o.y + o.height);
                ctx.fill();
                // Shading (Right side)
                ctx.fillStyle = '#90A4AE';
                ctx.beginPath();
                ctx.moveTo(sx + 5, o.y + 5);
                ctx.lineTo(sx + 10, o.y + o.height);
                ctx.lineTo(sx + 5, o.y + o.height);
                ctx.fill();
                // Red Warning Tip
                ctx.fillStyle = '#D32F2F';
                ctx.beginPath();
                ctx.moveTo(sx + 5, o.y + 5);
                ctx.lineTo(sx + 3, o.y + 10);
                ctx.lineTo(sx + 7, o.y + 10);
                ctx.fill();

                sx += 10;
            }
            return;
        }

        if (o.type === 'flying') {
            // Flying obstacle (Bird/Bat/Drone)
            let hover = Math.sin(gameTick * 0.2) * 5;
            if (gameMode === 'tmnt') {
                // Spinning Shuriken (4-pointed star)
                ctx.save();
                ctx.translate(o.x + 20, o.y + 15 + hover);
                ctx.rotate(gameTick * 0.15);
                ctx.fillStyle = '#90A4AE';
                for (let s = 0; s < 4; s++) {
                    ctx.beginPath();
                    ctx.moveTo(0, 0);
                    ctx.lineTo(-4, -14);
                    ctx.lineTo(0, -12);
                    ctx.lineTo(4, -14);
                    ctx.fill();
                    ctx.rotate(Math.PI / 2);
                }
                // Center circle
                ctx.fillStyle = '#616161';
                ctx.beginPath(); ctx.arc(0, 0, 3, 0, Math.PI * 2); ctx.fill();
                ctx.restore();
            } else if (gameMode === 'bluey') {
                // Fruit Bat
                ctx.fillStyle = '#424242';
                ctx.beginPath(); ctx.arc(o.x + 20, o.y + 15 + hover, 10, 0, Math.PI * 2); ctx.fill(); // Body
                ctx.beginPath(); ctx.moveTo(o.x + 20, o.y + 15 + hover); ctx.lineTo(o.x, o.y + hover); ctx.lineTo(o.x + 10, o.y + 20 + hover); ctx.fill(); // L Wing
                ctx.beginPath(); ctx.moveTo(o.x + 20, o.y + 15 + hover); ctx.lineTo(o.x + 40, o.y + hover); ctx.lineTo(o.x + 30, o.y + 20 + hover); ctx.fill(); // R Wing
                ctx.fillStyle = '#FFF'; // Eyes
                ctx.beginPath(); ctx.arc(o.x + 17, o.y + 13 + hover, 2, 0, Math.PI * 2); ctx.fill();
                ctx.beginPath(); ctx.arc(o.x + 23, o.y + 13 + hover, 2, 0, Math.PI * 2); ctx.fill();
            } else if (gameMode === 'scary') {
                // Flying ghost skull
                ctx.fillStyle = 'rgba(200, 200, 200, 0.7)';
                ctx.beginPath(); ctx.arc(o.x + 20, o.y + 12 + hover, 10, 0, Math.PI * 2); ctx.fill();
                // Hollow eyes
                ctx.fillStyle = '#000';
                ctx.beginPath(); ctx.arc(o.x + 16, o.y + 10 + hover, 3, 0, Math.PI * 2); ctx.fill();
                ctx.beginPath(); ctx.arc(o.x + 24, o.y + 10 + hover, 3, 0, Math.PI * 2); ctx.fill();
                // Mouth
                ctx.fillStyle = '#000';
                ctx.beginPath(); ctx.arc(o.x + 20, o.y + 17 + hover, 2, 0, Math.PI); ctx.fill();
                // Ghostly trail
                ctx.fillStyle = 'rgba(200, 200, 200, 0.3)';
                for (let g = 0; g < 3; g++) {
                    ctx.beginPath(); ctx.arc(o.x + 20 + g * 2, o.y + 22 + hover + g * 4, 4 - g, 0, Math.PI * 2); ctx.fill();
                }
            } else if (gameMode === 'cat') {
                // Bird
                ctx.fillStyle = '#607D8B';
                ctx.fillRect(o.x, o.y + 10 + hover, 40, 10); // Body
                ctx.fillStyle = '#CFD8DC'; // Propellers
                let propOffset = (gameTick * 20) % 10;
                ctx.fillRect(o.x - 5, o.y + 5 + hover, 15, 2);
                ctx.fillRect(o.x + 30, o.y + 5 + hover, 15, 2);
                ctx.fillStyle = 'red'; // Eye
                ctx.beginPath(); ctx.arc(o.x + 20, o.y + 15 + hover, 3, 0, Math.PI * 2); ctx.fill();
            } else {
                // Jellyfish drone (spongebob)
                ctx.fillStyle = '#FF80AB';
                ctx.beginPath(); ctx.arc(o.x + 20, o.y + 10 + hover, 10, Math.PI, 0); ctx.fill();
                ctx.fillStyle = '#FF4081';
                ctx.beginPath(); ctx.arc(o.x + 20, o.y + 10 + hover, 5, Math.PI, 0); ctx.fill();
                // Tentacles
                ctx.strokeStyle = 'rgba(255, 128, 171, 0.6)'; ctx.lineWidth = 1.5;
                for (let t = 0; t < 3; t++) {
                    ctx.beginPath(); ctx.moveTo(o.x + 13 + t * 7, o.y + 10 + hover);
                    ctx.lineTo(o.x + 13 + t * 7 + Math.sin(gameTick * 0.1 + t) * 3, o.y + 25 + hover);
                    ctx.stroke();
                }
                // Eyes
                ctx.fillStyle = '#FFF';
                ctx.beginPath(); ctx.arc(o.x + 17, o.y + 8 + hover, 2, 0, Math.PI * 2); ctx.fill();
                ctx.beginPath(); ctx.arc(o.x + 23, o.y + 8 + hover, 2, 0, Math.PI * 2); ctx.fill();
            }
            return;
        }

        // === NEW ENEMY TYPE DRAWINGS ===
        if (o.type === 'ground_walker') {
            let wobble = Math.sin(gameTick * 0.15) * 2;
            if (gameMode === 'cat') {
                // Mouse enemy
                ctx.fillStyle = '#9E9E9E';
                ctx.beginPath(); ctx.ellipse(o.x + 17, o.y + 20 + wobble, 14, 10, 0, 0, Math.PI * 2); ctx.fill();
                ctx.beginPath(); ctx.arc(o.x + 4, o.y + 16 + wobble, 7, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = '#F48FB1';
                ctx.beginPath(); ctx.arc(o.x + 1, o.y + 10 + wobble, 4, 0, Math.PI * 2); ctx.fill();
                ctx.beginPath(); ctx.arc(o.x + 7, o.y + 10 + wobble, 4, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = '#F44336';
                ctx.beginPath(); ctx.arc(o.x + 2, o.y + 16 + wobble, 2, 0, Math.PI * 2); ctx.fill();
            } else if (gameMode === 'bluey') {
                // Gnome
                ctx.fillStyle = '#E53935';
                ctx.beginPath(); ctx.moveTo(o.x + 17, o.y + wobble); ctx.lineTo(o.x + 5, o.y + 15 + wobble); ctx.lineTo(o.x + 30, o.y + 15 + wobble); ctx.fill();
                ctx.fillStyle = '#FFCC80';
                ctx.beginPath(); ctx.arc(o.x + 17, o.y + 20 + wobble, 8, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = '#8D6E63';
                ctx.fillRect(o.x + 8, o.y + 26 + wobble, 20, 10);
            } else if (gameMode === 'tmnt') {
                // Foot Soldier (dark ninja)
                ctx.fillStyle = '#333';
                ctx.beginPath(); ctx.arc(o.x + 17, o.y + 8 + wobble, 7, 0, Math.PI * 2); ctx.fill(); // head
                ctx.fillRect(o.x + 12, o.y + 15 + wobble, 10, 15); // body
                // Red headband
                ctx.fillStyle = '#D32F2F';
                ctx.fillRect(o.x + 10, o.y + 5 + wobble, 14, 3);
                // Headband tail
                ctx.strokeStyle = '#D32F2F'; ctx.lineWidth = 2;
                ctx.beginPath(); ctx.moveTo(o.x + 24, o.y + 7 + wobble);
                ctx.lineTo(o.x + 30, o.y + 5 + wobble); ctx.stroke();
                // Eyes
                ctx.fillStyle = '#FFF';
                ctx.beginPath(); ctx.arc(o.x + 14, o.y + 8 + wobble, 2, 0, Math.PI * 2); ctx.fill();
                ctx.beginPath(); ctx.arc(o.x + 20, o.y + 8 + wobble, 2, 0, Math.PI * 2); ctx.fill();
                // Katana
                ctx.strokeStyle = '#90A4AE'; ctx.lineWidth = 1.5;
                ctx.beginPath(); ctx.moveTo(o.x + 25, o.y + 12 + wobble);
                ctx.lineTo(o.x + 33, o.y + 2 + wobble); ctx.stroke();
                // Legs
                ctx.fillStyle = '#333';
                ctx.fillRect(o.x + 12, o.y + 28 + wobble, 4, 7);
                ctx.fillRect(o.x + 18, o.y + 28 + wobble, 4, 7);
            } else if (gameMode === 'scary') {
                // Zombie hand
                ctx.fillStyle = '#558B2F';
                ctx.fillRect(o.x + 14, o.y + wobble, 8, o.height);
                ctx.fillRect(o.x + 8, o.y + wobble, 6, 12);
                ctx.fillRect(o.x + 22, o.y + wobble, 6, 14);
                ctx.fillRect(o.x + 16, o.y + wobble - 4, 5, 8);
            } else {
                // Sea urchin (spongebob)
                ctx.fillStyle = '#4A148C';
                ctx.beginPath(); ctx.arc(o.x + 17, o.y + 17 + wobble, 12, 0, Math.PI * 2); ctx.fill();
                ctx.strokeStyle = '#7B1FA2'; ctx.lineWidth = 2;
                for (let s = 0; s < 8; s++) {
                    let a = s * Math.PI / 4;
                    ctx.beginPath();
                    ctx.moveTo(o.x + 17 + Math.cos(a) * 10, o.y + 17 + wobble + Math.sin(a) * 10);
                    ctx.lineTo(o.x + 17 + Math.cos(a) * 18, o.y + 17 + wobble + Math.sin(a) * 18);
                    ctx.stroke();
                }
            }
            return;
        }

        if (o.type === 'shooter') {
            if (gameMode === 'cat') {
                // Sprinkler
                ctx.fillStyle = '#4CAF50';
                ctx.fillRect(o.x + 15, o.y + 10, 10, 30);
                ctx.fillStyle = '#81C784';
                ctx.beginPath(); ctx.arc(o.x + 20, o.y + 8, 12, Math.PI, 0); ctx.fill();
                // Water spray hint
                if (o.shootTimer > 100) {
                    ctx.fillStyle = 'rgba(33, 150, 243, 0.3)';
                    ctx.beginPath(); ctx.arc(o.x + 5, o.y + 15, 4 + (o.shootTimer - 100) * 0.2, 0, Math.PI * 2); ctx.fill();
                }
            } else if (gameMode === 'bluey') {
                // Ball launcher
                ctx.fillStyle = '#FF9800';
                ctx.fillRect(o.x + 5, o.y + 15, 30, 20);
                ctx.fillStyle = '#E65100';
                ctx.beginPath(); ctx.arc(o.x + 5, o.y + 25, 8, Math.PI * 0.5, Math.PI * 1.5); ctx.fill();
                ctx.fillStyle = '#FFF';
                ctx.fillRect(o.x + 12, o.y + 20, 15, 4);
            } else if (gameMode === 'tmnt') {
                // Mouser Robot
                ctx.fillStyle = '#9E9E9E';
                ctx.beginPath(); ctx.ellipse(o.x + 20, o.y + 20, 14, 12, 0, 0, Math.PI * 2); ctx.fill(); // body
                // Red eye
                ctx.fillStyle = '#F44336';
                ctx.beginPath(); ctx.arc(o.x + 15, o.y + 16, 3, 0, Math.PI * 2); ctx.fill();
                // Jaw (open, with teeth)
                ctx.fillStyle = '#757575';
                ctx.beginPath(); ctx.moveTo(o.x + 8, o.y + 22); ctx.lineTo(o.x + 4, o.y + 32);
                ctx.lineTo(o.x + 28, o.y + 32); ctx.lineTo(o.x + 24, o.y + 22); ctx.fill();
                // Teeth
                ctx.fillStyle = '#FFF';
                for (let t = 0; t < 4; t++) {
                    ctx.fillRect(o.x + 8 + t * 5, o.y + 22, 2, 4);
                }
                // Shoot indicator
                if (o.shootTimer > 100) {
                    ctx.fillStyle = 'rgba(244, 67, 54, 0.3)';
                    ctx.beginPath(); ctx.arc(o.x + 5, o.y + 20, 4 + (o.shootTimer - 100) * 0.2, 0, Math.PI * 2); ctx.fill();
                }
            } else if (gameMode === 'scary') {
                // Skeleton archer
                ctx.fillStyle = '#E0E0E0';
                ctx.beginPath(); ctx.arc(o.x + 20, o.y + 8, 8, 0, Math.PI * 2); ctx.fill();
                ctx.fillRect(o.x + 17, o.y + 16, 6, 18);
                ctx.fillStyle = '#000';
                ctx.beginPath(); ctx.arc(o.x + 17, o.y + 7, 2, 0, Math.PI * 2); ctx.fill();
                ctx.beginPath(); ctx.arc(o.x + 23, o.y + 7, 2, 0, Math.PI * 2); ctx.fill();
                ctx.strokeStyle = '#8D6E63'; ctx.lineWidth = 2;
                ctx.beginPath(); ctx.arc(o.x + 8, o.y + 15, 12, -0.5, 0.5); ctx.stroke();
            } else {
                // Cannon (spongebob)
                ctx.fillStyle = '#546E7A';
                ctx.fillRect(o.x + 5, o.y + 10, 30, 20);
                ctx.fillStyle = '#37474F';
                ctx.beginPath(); ctx.arc(o.x + 5, o.y + 20, 10, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = '#263238';
                ctx.fillRect(o.x + 0, o.y + 16, 10, 8);
            }
            return;
        }

        if (o.type === 'falling') {
            let shake = o.triggered ? Math.sin(gameTick * 0.5) * 2 : 0;
            if (gameMode === 'cat') {
                // Flower pot
                ctx.fillStyle = '#E65100';
                ctx.beginPath(); ctx.moveTo(o.x + 2 + shake, o.y + 10); ctx.lineTo(o.x + 8 + shake, o.y + 35);
                ctx.lineTo(o.x + 27 + shake, o.y + 35); ctx.lineTo(o.x + 33 + shake, o.y + 10); ctx.fill();
                ctx.fillStyle = '#4CAF50';
                ctx.beginPath(); ctx.arc(o.x + 17 + shake, o.y + 5, 10, Math.PI, 0); ctx.fill();
            } else if (gameMode === 'bluey') {
                // Coconut
                ctx.fillStyle = '#5D4037';
                ctx.beginPath(); ctx.arc(o.x + 17 + shake, o.y + 17, 14, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = '#3E2723';
                ctx.beginPath(); ctx.arc(o.x + 12 + shake, o.y + 14, 2, 0, Math.PI * 2); ctx.fill();
                ctx.beginPath(); ctx.arc(o.x + 22 + shake, o.y + 14, 2, 0, Math.PI * 2); ctx.fill();
            } else if (gameMode === 'tmnt') {
                // Manhole Cover
                ctx.fillStyle = '#757575';
                ctx.beginPath(); ctx.arc(o.x + 17 + shake, o.y + 17, 14, 0, Math.PI * 2); ctx.fill();
                // Cross pattern
                ctx.strokeStyle = '#616161'; ctx.lineWidth = 2;
                ctx.beginPath(); ctx.moveTo(o.x + 7 + shake, o.y + 17); ctx.lineTo(o.x + 27 + shake, o.y + 17); ctx.stroke();
                ctx.beginPath(); ctx.moveTo(o.x + 17 + shake, o.y + 7); ctx.lineTo(o.x + 17 + shake, o.y + 27); ctx.stroke();
                // Rim
                ctx.strokeStyle = '#9E9E9E'; ctx.lineWidth = 2;
                ctx.beginPath(); ctx.arc(o.x + 17 + shake, o.y + 17, 14, 0, Math.PI * 2); ctx.stroke();
            } else if (gameMode === 'scary') {
                // Chandelier
                ctx.fillStyle = '#FFD700';
                ctx.fillRect(o.x + 14 + shake, o.y, 7, 8);
                ctx.fillStyle = '#B0BEC5';
                ctx.beginPath(); ctx.moveTo(o.x + 5 + shake, o.y + 25); ctx.lineTo(o.x + 17 + shake, o.y + 8);
                ctx.lineTo(o.x + 30 + shake, o.y + 25); ctx.fill();
                ctx.fillStyle = '#FFF9C4';
                for (let f = 0; f < 3; f++) {
                    ctx.beginPath(); ctx.arc(o.x + 8 + f * 9 + shake, o.y + 25, 3, 0, Math.PI * 2); ctx.fill();
                }
            } else {
                // Anchor (spongebob)
                ctx.fillStyle = '#546E7A';
                ctx.fillRect(o.x + 13 + shake, o.y, 9, 28);
                ctx.beginPath(); ctx.arc(o.x + 17 + shake, o.y + 28, 10, 0, Math.PI); ctx.fill();
                ctx.fillRect(o.x + 5 + shake, o.y + 8, 25, 5);
            }
            // Warning indicator if not triggered
            if (!o.triggered) {
                ctx.fillStyle = 'rgba(255, 0, 0, ' + (0.3 + Math.sin(gameTick * 0.1) * 0.2) + ')';
                ctx.fillRect(o.x + 14, o.y + 35, 7, 2);
            }
            return;
        }

        if (o.type === 'bouncer') {
            let squish = Math.abs(Math.sin(o.bouncePhase)) * 0.2;
            if (gameMode === 'cat') {
                // Yarn ball
                ctx.fillStyle = '#E91E63';
                ctx.beginPath(); ctx.arc(o.x + 17, o.y + 17, 14, 0, Math.PI * 2); ctx.fill();
                ctx.strokeStyle = '#F48FB1'; ctx.lineWidth = 1.5;
                ctx.beginPath(); ctx.arc(o.x + 17, o.y + 17, 8, 0, Math.PI * 1.5); ctx.stroke();
                ctx.beginPath(); ctx.arc(o.x + 17, o.y + 17, 4, Math.PI, Math.PI * 2.5); ctx.stroke();
            } else if (gameMode === 'bluey') {
                // Basketball
                ctx.fillStyle = '#FF6D00';
                ctx.beginPath(); ctx.arc(o.x + 17, o.y + 17, 14, 0, Math.PI * 2); ctx.fill();
                ctx.strokeStyle = '#BF360C'; ctx.lineWidth = 1.5;
                ctx.beginPath(); ctx.arc(o.x + 17, o.y + 17, 14, 0, Math.PI * 2); ctx.stroke();
                ctx.beginPath(); ctx.moveTo(o.x + 3, o.y + 17); ctx.lineTo(o.x + 31, o.y + 17); ctx.stroke();
                ctx.beginPath(); ctx.moveTo(o.x + 17, o.y + 3); ctx.lineTo(o.x + 17, o.y + 31); ctx.stroke();
            } else if (gameMode === 'tmnt') {
                // Krang Droid (android body with pink brain in stomach)
                ctx.fillStyle = '#9E9E9E';
                ctx.fillRect(o.x + 5, o.y + 2, 24, 30); // body
                // Head
                ctx.fillStyle = '#757575';
                ctx.beginPath(); ctx.arc(o.x + 17, o.y + 2, 8, Math.PI, 0); ctx.fill();
                // Eyes
                ctx.fillStyle = '#F44336';
                ctx.beginPath(); ctx.arc(o.x + 13, o.y, 2, 0, Math.PI * 2); ctx.fill();
                ctx.beginPath(); ctx.arc(o.x + 21, o.y, 2, 0, Math.PI * 2); ctx.fill();
                // Stomach cavity with Krang (pink brain)
                ctx.fillStyle = '#333';
                ctx.fillRect(o.x + 9, o.y + 12, 16, 12);
                ctx.fillStyle = '#F48FB1';
                ctx.beginPath(); ctx.ellipse(o.x + 17, o.y + 18, 6, 5, 0, 0, Math.PI * 2); ctx.fill();
                // Brain folds
                ctx.strokeStyle = '#EC407A'; ctx.lineWidth = 1;
                ctx.beginPath(); ctx.arc(o.x + 17, o.y + 17, 3, 0, Math.PI); ctx.stroke();
                // Arms
                ctx.fillStyle = '#9E9E9E';
                ctx.fillRect(o.x + 1, o.y + 8, 5, 14);
                ctx.fillRect(o.x + 28, o.y + 8, 5, 14);
            } else if (gameMode === 'scary') {
                // Floating skull
                ctx.fillStyle = '#E0E0E0';
                ctx.beginPath(); ctx.arc(o.x + 17, o.y + 14, 12, 0, Math.PI * 2); ctx.fill();
                ctx.fillRect(o.x + 10, o.y + 22, 14, 8);
                ctx.fillStyle = '#000';
                ctx.beginPath(); ctx.arc(o.x + 13, o.y + 13, 3, 0, Math.PI * 2); ctx.fill();
                ctx.beginPath(); ctx.arc(o.x + 21, o.y + 13, 3, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = '#F44336';
                ctx.beginPath(); ctx.arc(o.x + 13, o.y + 13, 1.5, 0, Math.PI * 2); ctx.fill();
                ctx.beginPath(); ctx.arc(o.x + 21, o.y + 13, 1.5, 0, Math.PI * 2); ctx.fill();
            } else {
                // Jellyfish (spongebob)
                ctx.fillStyle = '#FF69B4';
                ctx.beginPath(); ctx.arc(o.x + 17, o.y + 12, 12, Math.PI, 0); ctx.fill();
                ctx.fillStyle = '#FFB6C1';
                ctx.beginPath(); ctx.arc(o.x + 17, o.y + 12, 7, Math.PI, 0); ctx.fill();
                ctx.strokeStyle = 'rgba(255, 105, 180, 0.6)'; ctx.lineWidth = 1.5;
                for (let t = 0; t < 4; t++) {
                    ctx.beginPath(); ctx.moveTo(o.x + 8 + t * 6, o.y + 12);
                    for (let s = 0; s < 15; s += 3) {
                        ctx.lineTo(o.x + 8 + t * 6 + Math.sin(gameTick * 0.06 + t + s * 0.4) * 3, o.y + 12 + s);
                    }
                    ctx.stroke();
                }
            }
            return;
        }

        if (o.type === 'dasher') {
            let dashGlow = o.dashing ? 0.5 + Math.sin(gameTick * 0.3) * 0.3 : 0;
            // Speed lines when dashing
            if (o.dashing) {
                ctx.strokeStyle = 'rgba(255, 100, 100, 0.4)';
                ctx.lineWidth = 1;
                for (let i = 0; i < 4; i++) {
                    let ly = o.y + 5 + i * 8;
                    ctx.beginPath(); ctx.moveTo(o.x + 35, ly); ctx.lineTo(o.x + 50 + Math.random() * 15, ly); ctx.stroke();
                }
            }
            if (gameMode === 'cat') {
                // Angry dog — charges at the cat
                ctx.fillStyle = '#5D4037';
                ctx.beginPath(); ctx.ellipse(o.x + 17, o.y + 20, 14, 10, 0, 0, Math.PI * 2); ctx.fill(); // body
                ctx.beginPath(); ctx.arc(o.x + 28, o.y + 16, 7, 0, Math.PI * 2); ctx.fill(); // head
                ctx.fillStyle = '#D32F2F'; // angry eyes
                ctx.beginPath(); ctx.arc(o.x + 27, o.y + 14, 2, 0, Math.PI * 2); ctx.fill();
                ctx.beginPath(); ctx.arc(o.x + 31, o.y + 14, 2, 0, Math.PI * 2); ctx.fill();
                // Open mouth
                ctx.fillStyle = '#F44336';
                ctx.beginPath(); ctx.arc(o.x + 33, o.y + 18, 3, 0, Math.PI); ctx.fill();
                // Legs
                ctx.fillStyle = '#5D4037';
                ctx.fillRect(o.x + 7, o.y + 28, 4, 7);
                ctx.fillRect(o.x + 20, o.y + 28, 4, 7);
            } else if (gameMode === 'bluey') {
                // Magpie (Australian swooping bird)
                ctx.fillStyle = '#212121';
                ctx.beginPath(); ctx.ellipse(o.x + 17, o.y + 17, 13, 9, 0, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = '#FFF'; // white stripe
                ctx.fillRect(o.x + 10, o.y + 14, 14, 3);
                // Beak
                ctx.fillStyle = '#FF6F00';
                ctx.beginPath(); ctx.moveTo(o.x + 30, o.y + 15); ctx.lineTo(o.x + 36, o.y + 17); ctx.lineTo(o.x + 30, o.y + 19); ctx.fill();
                // Eye
                ctx.fillStyle = '#F44336';
                ctx.beginPath(); ctx.arc(o.x + 27, o.y + 14, 2, 0, Math.PI * 2); ctx.fill();
                // Wings flap
                let wingFlap = Math.sin(gameTick * 0.3) * 5;
                ctx.fillStyle = '#212121';
                ctx.beginPath(); ctx.moveTo(o.x + 10, o.y + 14); ctx.lineTo(o.x, o.y + 5 + wingFlap); ctx.lineTo(o.x + 14, o.y + 10); ctx.fill();
            } else if (gameMode === 'tmnt') {
                // Bebop (mutant warthog, charges)
                ctx.fillStyle = '#8D6E63';
                ctx.beginPath(); ctx.arc(o.x + 17, o.y + 12, 10, 0, Math.PI * 2); ctx.fill(); // head
                ctx.fillStyle = '#CE93D8'; // mohawk
                ctx.fillRect(o.x + 12, o.y, 10, 6);
                // Snout
                ctx.fillStyle = '#FFAB91';
                ctx.beginPath(); ctx.ellipse(o.x + 25, o.y + 14, 5, 4, 0, 0, Math.PI * 2); ctx.fill();
                // Tusks
                ctx.fillStyle = '#FFF';
                ctx.fillRect(o.x + 27, o.y + 10, 2, 6);
                ctx.fillRect(o.x + 23, o.y + 10, 2, 6);
                // Angry eyes
                ctx.fillStyle = o.dashing ? '#F44336' : '#FFF';
                ctx.beginPath(); ctx.arc(o.x + 13, o.y + 10, 2.5, 0, Math.PI * 2); ctx.fill();
                ctx.beginPath(); ctx.arc(o.x + 20, o.y + 10, 2.5, 0, Math.PI * 2); ctx.fill();
                // Body
                ctx.fillStyle = '#795548';
                ctx.fillRect(o.x + 7, o.y + 20, 20, 12);
            } else if (gameMode === 'scary') {
                // Werewolf — lunges at player
                ctx.fillStyle = '#4E342E';
                ctx.beginPath(); ctx.arc(o.x + 17, o.y + 10, 9, 0, Math.PI * 2); ctx.fill(); // head
                // Ears
                ctx.beginPath(); ctx.moveTo(o.x + 8, o.y + 4); ctx.lineTo(o.x + 5, o.y - 4); ctx.lineTo(o.x + 12, o.y + 2); ctx.fill();
                ctx.beginPath(); ctx.moveTo(o.x + 22, o.y + 2); ctx.lineTo(o.x + 29, o.y - 4); ctx.lineTo(o.x + 26, o.y + 4); ctx.fill();
                // Glowing eyes
                ctx.fillStyle = o.dashing ? '#FF1744' : '#FFEB3B';
                ctx.beginPath(); ctx.arc(o.x + 13, o.y + 9, 2.5, 0, Math.PI * 2); ctx.fill();
                ctx.beginPath(); ctx.arc(o.x + 21, o.y + 9, 2.5, 0, Math.PI * 2); ctx.fill();
                // Fangs
                ctx.fillStyle = '#FFF';
                ctx.beginPath(); ctx.moveTo(o.x + 14, o.y + 16); ctx.lineTo(o.x + 16, o.y + 21); ctx.lineTo(o.x + 18, o.y + 16); ctx.fill();
                // Body
                ctx.fillStyle = '#3E2723';
                ctx.fillRect(o.x + 9, o.y + 18, 16, 14);
            } else {
                // Electric Eel (spongebob) — darts forward
                ctx.fillStyle = '#FDD835';
                ctx.beginPath(); ctx.ellipse(o.x + 17, o.y + 17, 16, 8, 0, 0, Math.PI * 2); ctx.fill();
                // Lightning stripes
                ctx.strokeStyle = '#F57F17'; ctx.lineWidth = 2;
                for (let z = 0; z < 3; z++) {
                    ctx.beginPath();
                    ctx.moveTo(o.x + 5 + z * 10, o.y + 12);
                    ctx.lineTo(o.x + 8 + z * 10, o.y + 17);
                    ctx.lineTo(o.x + 5 + z * 10, o.y + 22);
                    ctx.stroke();
                }
                // Eye
                ctx.fillStyle = '#000';
                ctx.beginPath(); ctx.arc(o.x + 28, o.y + 15, 2.5, 0, Math.PI * 2); ctx.fill();
                // Electric sparks when dashing
                if (o.dashing) {
                    ctx.strokeStyle = 'rgba(255, 235, 59, 0.7)'; ctx.lineWidth = 1;
                    for (let s = 0; s < 3; s++) {
                        let sx = o.x + Math.random() * 35, sy = o.y + 5 + Math.random() * 20;
                        ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(sx + 5, sy - 5); ctx.lineTo(sx + 3, sy + 3); ctx.stroke();
                    }
                }
            }
            return;
        }

        if (o.type === 'zigzagger') {
            let trail = Math.sin(gameTick * 0.2) * 3;
            if (gameMode === 'cat') {
                // Laser pointer dot — erratic movement
                ctx.fillStyle = '#F44336';
                let glow = 6 + Math.sin(gameTick * 0.3) * 3;
                ctx.beginPath(); ctx.arc(o.x + 15, o.y + 15, glow, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = '#FF8A80';
                ctx.beginPath(); ctx.arc(o.x + 15, o.y + 15, 4, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = '#FFF';
                ctx.beginPath(); ctx.arc(o.x + 13, o.y + 13, 1.5, 0, Math.PI * 2); ctx.fill();
            } else if (gameMode === 'bluey') {
                // Boomerang
                ctx.save();
                ctx.translate(o.x + 15, o.y + 15);
                ctx.rotate(gameTick * 0.12);
                ctx.fillStyle = '#8D6E63';
                ctx.beginPath();
                ctx.moveTo(0, -12); ctx.quadraticCurveTo(12, -6, 12, 0);
                ctx.quadraticCurveTo(12, 3, 0, 0);
                ctx.quadraticCurveTo(-3, -3, -12, 0);
                ctx.quadraticCurveTo(-12, -6, 0, -12);
                ctx.fill();
                // Wood grain
                ctx.strokeStyle = '#6D4C41'; ctx.lineWidth = 1;
                ctx.beginPath(); ctx.arc(0, -4, 5, 0, Math.PI); ctx.stroke();
                ctx.restore();
            } else if (gameMode === 'tmnt') {
                // Buzzkill drone (Kraang tech) — zigzags
                ctx.fillStyle = '#E91E63';
                ctx.beginPath(); ctx.arc(o.x + 15, o.y + 15, 10, 0, Math.PI * 2); ctx.fill(); // body
                ctx.fillStyle = '#C2185B';
                ctx.beginPath(); ctx.arc(o.x + 15, o.y + 15, 5, 0, Math.PI * 2); ctx.fill(); // core
                // Rotating spikes
                ctx.strokeStyle = '#F48FB1'; ctx.lineWidth = 2;
                for (let s = 0; s < 6; s++) {
                    let a = s * Math.PI / 3 + gameTick * 0.08;
                    ctx.beginPath();
                    ctx.moveTo(o.x + 15 + Math.cos(a) * 8, o.y + 15 + Math.sin(a) * 8);
                    ctx.lineTo(o.x + 15 + Math.cos(a) * 14, o.y + 15 + Math.sin(a) * 14);
                    ctx.stroke();
                }
            } else if (gameMode === 'scary') {
                // Will-o-wisp — ghostly flame that zigzags
                let flicker = Math.sin(gameTick * 0.2) * 2;
                ctx.fillStyle = 'rgba(100, 255, 218, 0.3)';
                ctx.beginPath(); ctx.arc(o.x + 15, o.y + 15, 14 + flicker, 0, Math.PI * 2); ctx.fill(); // glow
                ctx.fillStyle = '#64FFDA';
                ctx.beginPath(); ctx.arc(o.x + 15, o.y + 15, 8, 0, Math.PI * 2); ctx.fill(); // core
                ctx.fillStyle = '#FFF';
                ctx.beginPath(); ctx.arc(o.x + 15, o.y + 15, 4, 0, Math.PI * 2); ctx.fill(); // bright center
                // Flame wisps
                ctx.strokeStyle = 'rgba(100, 255, 218, 0.5)'; ctx.lineWidth = 1.5;
                for (let w = 0; w < 3; w++) {
                    let wa = w * Math.PI * 2 / 3 + gameTick * 0.05;
                    ctx.beginPath();
                    ctx.moveTo(o.x + 15 + Math.cos(wa) * 6, o.y + 15 + Math.sin(wa) * 6);
                    ctx.lineTo(o.x + 15 + Math.cos(wa) * 12, o.y + 10 + Math.sin(wa + 0.5) * 8);
                    ctx.stroke();
                }
            } else {
                // Angry Clam (spongebob) — snaps open/shut while zigzagging
                let snap = Math.sin(gameTick * 0.15) > 0;
                ctx.fillStyle = '#8D6E63';
                // Bottom shell
                ctx.beginPath(); ctx.arc(o.x + 15, o.y + 20, 12, 0, Math.PI); ctx.fill();
                // Top shell (opens/closes)
                ctx.beginPath(); ctx.arc(o.x + 15, o.y + 15, 12, Math.PI, Math.PI * 2 - (snap ? 0.3 : 0)); ctx.fill();
                // Pearl inside
                if (snap) {
                    ctx.fillStyle = '#E8EAF6';
                    ctx.beginPath(); ctx.arc(o.x + 15, o.y + 18, 4, 0, Math.PI * 2); ctx.fill();
                }
                // Angry eyes on shell
                ctx.fillStyle = '#F44336';
                ctx.beginPath(); ctx.arc(o.x + 11, o.y + 12, 2, 0, Math.PI * 2); ctx.fill();
                ctx.beginPath(); ctx.arc(o.x + 19, o.y + 12, 2, 0, Math.PI * 2); ctx.fill();
            }
            return;
        }

        if (o.type === 'teleporter') {
            ctx.save();
            ctx.globalAlpha = o.alpha || 1;
            if (gameMode === 'cat') {
                // Phantom cat — disappears and reappears
                ctx.fillStyle = '#7E57C2';
                ctx.beginPath(); ctx.arc(o.x + 15, o.y + 12, 8, 0, Math.PI * 2); ctx.fill(); // head
                // Ears
                ctx.beginPath(); ctx.moveTo(o.x + 7, o.y + 6); ctx.lineTo(o.x + 5, o.y - 2); ctx.lineTo(o.x + 11, o.y + 4); ctx.fill();
                ctx.beginPath(); ctx.moveTo(o.x + 19, o.y + 4); ctx.lineTo(o.x + 25, o.y - 2); ctx.lineTo(o.x + 23, o.y + 6); ctx.fill();
                // Glowing eyes
                ctx.fillStyle = '#E040FB';
                ctx.beginPath(); ctx.arc(o.x + 12, o.y + 11, 2, 0, Math.PI * 2); ctx.fill();
                ctx.beginPath(); ctx.arc(o.x + 18, o.y + 11, 2, 0, Math.PI * 2); ctx.fill();
                // Body fading
                ctx.fillStyle = 'rgba(126, 87, 194, 0.6)';
                ctx.beginPath(); ctx.ellipse(o.x + 15, o.y + 22, 8, 6, 0, 0, Math.PI * 2); ctx.fill();
            } else if (gameMode === 'bluey') {
                // Fairy (Bluey episode reference) — teleporting sparkle
                ctx.fillStyle = '#FFD54F';
                ctx.beginPath(); ctx.arc(o.x + 15, o.y + 12, 6, 0, Math.PI * 2); ctx.fill(); // head
                ctx.fillStyle = '#FFF';
                ctx.beginPath(); ctx.arc(o.x + 15, o.y + 22, 7, 0, Math.PI * 2); ctx.fill(); // dress
                // Wings
                ctx.fillStyle = 'rgba(179, 229, 252, 0.6)';
                ctx.beginPath(); ctx.ellipse(o.x + 5, o.y + 14, 6, 10, -0.3, 0, Math.PI * 2); ctx.fill();
                ctx.beginPath(); ctx.ellipse(o.x + 25, o.y + 14, 6, 10, 0.3, 0, Math.PI * 2); ctx.fill();
                // Sparkles around
                ctx.fillStyle = '#FFEB3B';
                for (let s = 0; s < 4; s++) {
                    let sa = s * Math.PI / 2 + gameTick * 0.06;
                    ctx.beginPath(); ctx.arc(o.x + 15 + Math.cos(sa) * 14, o.y + 15 + Math.sin(sa) * 14, 1.5, 0, Math.PI * 2); ctx.fill();
                }
            } else if (gameMode === 'tmnt') {
                // Dimension X portal creature
                ctx.fillStyle = '#7C4DFF';
                ctx.beginPath(); ctx.arc(o.x + 15, o.y + 15, 12, 0, Math.PI * 2); ctx.fill();
                // Swirl pattern
                ctx.strokeStyle = '#B388FF'; ctx.lineWidth = 2;
                ctx.beginPath(); ctx.arc(o.x + 15, o.y + 15, 8, gameTick * 0.1, gameTick * 0.1 + Math.PI); ctx.stroke();
                ctx.beginPath(); ctx.arc(o.x + 15, o.y + 15, 4, gameTick * 0.1 + Math.PI, gameTick * 0.1 + Math.PI * 2); ctx.stroke();
                // Eye in center
                ctx.fillStyle = '#FFF';
                ctx.beginPath(); ctx.arc(o.x + 15, o.y + 15, 3, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = '#E040FB';
                ctx.beginPath(); ctx.arc(o.x + 15, o.y + 15, 1.5, 0, Math.PI * 2); ctx.fill();
            } else if (gameMode === 'scary') {
                // Shadow wraith — flickers in and out
                ctx.fillStyle = 'rgba(33, 33, 33, 0.8)';
                ctx.beginPath(); ctx.arc(o.x + 15, o.y + 10, 8, 0, Math.PI * 2); ctx.fill(); // head
                // Body (flowing robe)
                ctx.beginPath(); ctx.moveTo(o.x + 5, o.y + 14); ctx.lineTo(o.x + 15, o.y + 32);
                ctx.lineTo(o.x + 25, o.y + 14); ctx.fill();
                // Glowing white eyes
                ctx.fillStyle = '#FFF';
                ctx.beginPath(); ctx.arc(o.x + 12, o.y + 9, 2, 0, Math.PI * 2); ctx.fill();
                ctx.beginPath(); ctx.arc(o.x + 18, o.y + 9, 2, 0, Math.PI * 2); ctx.fill();
                // Dark mist particles
                ctx.fillStyle = 'rgba(33, 33, 33, 0.3)';
                for (let m = 0; m < 3; m++) {
                    let mx = o.x + 5 + Math.random() * 20, my = o.y + 20 + Math.random() * 10;
                    ctx.beginPath(); ctx.arc(mx, my, 3, 0, Math.PI * 2); ctx.fill();
                }
            } else {
                // Magic Conch Shell (spongebob) — teleports
                ctx.fillStyle = '#E91E63';
                // Spiral shell shape
                ctx.beginPath(); ctx.arc(o.x + 15, o.y + 15, 12, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = '#F48FB1';
                ctx.beginPath(); ctx.arc(o.x + 15, o.y + 15, 8, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = '#FCE4EC';
                ctx.beginPath(); ctx.arc(o.x + 15, o.y + 15, 4, 0, Math.PI * 2); ctx.fill();
                // Spiral line
                ctx.strokeStyle = '#C2185B'; ctx.lineWidth = 1.5;
                ctx.beginPath();
                for (let a = 0; a < Math.PI * 4; a += 0.3) {
                    let r = 2 + a * 1.3;
                    ctx.lineTo(o.x + 15 + Math.cos(a + gameTick * 0.05) * r, o.y + 15 + Math.sin(a + gameTick * 0.05) * r);
                }
                ctx.stroke();
                // Glow effect when about to teleport
                if (o.teleportTimer > o.teleportCooldown * 0.7) {
                    ctx.strokeStyle = 'rgba(233, 30, 99, 0.5)'; ctx.lineWidth = 2;
                    ctx.beginPath(); ctx.arc(o.x + 15, o.y + 15, 15 + Math.sin(gameTick * 0.2) * 3, 0, Math.PI * 2); ctx.stroke();
                }
            }
            ctx.restore();
            return;
        }

        let blockColor = '#5D4037';
        let topColor = '#388E3C';
        // SpongeBob scene obstacle colors
        if (currentScene === 'KELP_FOREST') { blockColor = '#2F4F4F'; topColor = '#556B2F'; }
        if (currentScene === 'JELLYFISH_FIELDS') { blockColor = '#556B2F'; topColor = '#7CCD7C'; }
        if (currentScene === 'KRUSTY_KRAB') { blockColor = '#8B6914'; topColor = '#B8860B'; }
        if (currentScene === 'GOO_LAGOON') { blockColor = '#C4A035'; topColor = '#E6C288'; }
        if (currentScene === 'CHUM_BUCKET') { blockColor = '#1A5C2E'; topColor = '#27AE60'; }
        if (currentScene === 'GLOVE_WORLD') { blockColor = '#6C3483'; topColor = '#AF7AC5'; }
        if (currentScene === 'FLYING_DUTCHMAN') { blockColor = '#1A3A1A'; topColor = '#2F4F2F'; }
        if (currentScene === 'BOATING_SCHOOL') { blockColor = '#555555'; topColor = '#888888'; }
        // Cat World obstacle colors
        if (currentScene === 'COZY_HOUSE') { blockColor = '#A1887F'; topColor = '#D7CCC8'; }
        if (currentScene === 'GARDEN') { blockColor = '#795548'; topColor = '#A1887F'; }
        if (currentScene === 'ROOFTOP') { blockColor = '#455A64'; topColor = '#78909C'; }
        if (currentScene === 'FISH_MARKET') { blockColor = '#5D4037'; topColor = '#8D6E63'; }
        if (currentScene === 'ALLEY') { blockColor = '#263238'; topColor = '#455A64'; }
        if (currentScene === 'YARNIA') { blockColor = '#AB47BC'; topColor = '#CE93D8'; }
        if (currentScene === 'CATNIP_FIELDS') { blockColor = '#558B2F'; topColor = '#8BC34A'; }
        if (currentScene === 'MOONLIT_ROOF') { blockColor = '#1B2631'; topColor = '#34495E'; }
        if (currentScene === 'CAT_CAFE') { blockColor = '#6D4C41'; topColor = '#A1887F'; }
        if (currentScene === 'LASER_LAND') { blockColor = '#4A148C'; topColor = '#7B1FA2'; }

        // Bluey World obstacle colors (Default to garden/earth tones)
        if (gameMode === 'bluey') {
            blockColor = '#795548'; topColor = '#A1887F'; // Default wood/brick
            if (currentScene === 'BACKYARD') { blockColor = '#8D6E63'; topColor = '#A1887F'; }
            if (currentScene === 'PLAYGROUND') { blockColor = '#FFB74D'; topColor = '#FFCC80'; }
        }

        // TMNT World obstacle colors
        if (gameMode === 'tmnt') {
            blockColor = '#37474F'; topColor = '#546E7A';
            if (currentScene === 'TECHNODROME') { blockColor = '#616161'; topColor = '#757575'; }
            if (currentScene === 'DIMENSION_X') { blockColor = '#6A1B9A'; topColor = '#9C27B0'; }
        }

        // Scary World obstacle colors (Dark/Stone)
        if (gameMode === 'scary') {
            blockColor = '#424242'; topColor = '#616161';
            if (currentScene === 'GRAVEYARD') { blockColor = '#3E2723'; topColor = '#5D4037'; }
        }

        ctx.fillStyle = blockColor;
        ctx.fillRect(o.x, o.y, o.width, o.height);
        ctx.fillStyle = topColor;
        ctx.fillRect(o.x, o.y, o.width, 10);
        ctx.strokeStyle = 'rgba(0,0,0,0.3)';
        ctx.strokeRect(o.x, o.y, o.width, o.height);
    });

    // Collectibles
    collectibles.forEach(c => {
        if (c.type === 'fish') {
            // Fish collectible for cat mode
            ctx.fillStyle = '#90CAF9';
            ctx.beginPath(); ctx.ellipse(c.x + 15, c.y + 15, 12, 7, 0, 0, Math.PI * 2); ctx.fill();
            // Tail
            ctx.fillStyle = '#64B5F6';
            ctx.beginPath(); ctx.moveTo(c.x + 27, c.y + 15); ctx.lineTo(c.x + 35, c.y + 8); ctx.lineTo(c.x + 35, c.y + 22); ctx.fill();
            // Eye
            ctx.fillStyle = 'white'; ctx.beginPath(); ctx.arc(c.x + 8, c.y + 13, 3, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = 'black'; ctx.beginPath(); ctx.arc(c.x + 8, c.y + 13, 1.5, 0, Math.PI * 2); ctx.fill();
            // Shine
            ctx.fillStyle = 'rgba(255,255,255,0.5)';
            ctx.beginPath(); ctx.ellipse(c.x + 12, c.y + 11, 4, 2, -0.3, 0, Math.PI * 2); ctx.fill();
        } else if (c.type === 'bone') {
            // Dog bone
            ctx.fillStyle = '#EEE';
            ctx.fillRect(c.x + 5, c.y + 12, 20, 6);
            ctx.beginPath(); ctx.arc(c.x + 5, c.y + 11, 4, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(c.x + 5, c.y + 19, 4, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(c.x + 25, c.y + 11, 4, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(c.x + 25, c.y + 19, 4, 0, Math.PI * 2); ctx.fill();
        } else if (c.type === 'skull') {
            // Skull
            ctx.fillStyle = '#E0E0E0';
            ctx.beginPath(); ctx.arc(c.x + 15, c.y + 12, 10, 0, Math.PI * 2); ctx.fill(); // Cranium
            ctx.fillRect(c.x + 10, c.y + 18, 10, 8); // Jaw
            ctx.fillStyle = '#000';
            ctx.beginPath(); ctx.arc(c.x + 11, c.y + 12, 3, 0, Math.PI * 2); ctx.fill(); // Left Eye
            ctx.beginPath(); ctx.arc(c.x + 19, c.y + 12, 3, 0, Math.PI * 2); ctx.fill(); // Right Eye
            ctx.beginPath(); ctx.moveTo(c.x + 15, c.y + 16); ctx.lineTo(c.x + 13, c.y + 20); ctx.lineTo(c.x + 17, c.y + 20); ctx.fill(); // Nose
        } else if (c.type === 'pizza') {
            // Pizza slice
            ctx.fillStyle = '#FFD54F'; // Cheese
            ctx.beginPath(); ctx.moveTo(c.x + 15, c.y + 5); ctx.lineTo(c.x + 2, c.y + 25); ctx.lineTo(c.x + 28, c.y + 25); ctx.fill();
            // Crust
            ctx.fillStyle = '#A1887F';
            ctx.beginPath(); ctx.moveTo(c.x + 2, c.y + 25); ctx.lineTo(c.x + 28, c.y + 25);
            ctx.lineTo(c.x + 26, c.y + 28); ctx.lineTo(c.x + 4, c.y + 28); ctx.fill();
            // Pepperoni
            ctx.fillStyle = '#E53935';
            ctx.beginPath(); ctx.arc(c.x + 12, c.y + 16, 3, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(c.x + 20, c.y + 18, 2.5, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(c.x + 15, c.y + 22, 2, 0, Math.PI * 2); ctx.fill();
            // Shine
            ctx.fillStyle = 'rgba(255,255,255,0.5)';
            ctx.beginPath(); ctx.ellipse(c.x + 14, c.y + 12, 4, 2, -0.3, 0, Math.PI * 2); ctx.fill();
        } else if (c.isRiddle) {
            // Riddle collectible - glowing purple orb with golden "?"
            let glow = 0.5 + Math.sin(gameTick * 0.1) * 0.3;
            ctx.save();
            ctx.shadowBlur = 15;
            ctx.shadowColor = 'rgba(156, 39, 176, ' + glow + ')';
            ctx.fillStyle = '#9C27B0';
            ctx.beginPath(); ctx.arc(c.x + 15, c.y + 15, 13, 0, Math.PI * 2); ctx.fill();
            ctx.shadowBlur = 0;
            // Inner glow
            ctx.fillStyle = '#CE93D8';
            ctx.beginPath(); ctx.arc(c.x + 15, c.y + 15, 8, 0, Math.PI * 2); ctx.fill();
            // Golden "?"
            ctx.fillStyle = '#FFD700';
            ctx.font = 'bold 16px monospace';
            ctx.textAlign = 'center';
            ctx.fillText('?', c.x + 15, c.y + 20);
            ctx.textAlign = 'start';
            ctx.restore();
        } else {
            // Krabby Patty for SpongeBob mode
            ctx.fillStyle = '#F4A460'; ctx.fillRect(c.x, c.y + 20, c.width, 10);
            ctx.fillStyle = 'green'; ctx.fillRect(c.x, c.y + 15, c.width, 5);
            ctx.fillStyle = '#8B4513'; ctx.fillRect(c.x, c.y + 10, c.width, 5);
            ctx.fillStyle = '#F4A460'; ctx.beginPath(); ctx.arc(c.x + c.width / 2, c.y + 10, c.width / 2, Math.PI, 0); ctx.fill();
        }
    });

    // Enemy projectiles
    projectiles.forEach(p => {
        let projColor = '#FF5722';
        if (gameMode === 'cat') projColor = '#2196F3';
        else if (gameMode === 'bluey') projColor = '#FF9800';
        else if (gameMode === 'scary') projColor = '#B0BEC5';
        else if (gameMode === 'tmnt') projColor = '#76FF03';
        ctx.fillStyle = projColor;
        ctx.beginPath(); ctx.arc(p.x + 4, p.y + 4, 4, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        ctx.beginPath(); ctx.arc(p.x + 3, p.y + 3, 2, 0, Math.PI * 2); ctx.fill();
    });

    // Player projectiles (shooting power-up)
    playerProjectiles.forEach(p => {
        ctx.fillStyle = '#FFD700';
        ctx.shadowBlur = 6;
        ctx.shadowColor = '#FFD700';
        ctx.beginPath(); ctx.ellipse(p.x + 5, p.y + 4, 5, 3, 0, 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 0;
    });

    // Player glow effect during active power-up
    if (activePowerUp) {
        let glowColor = '#FFD700';
        if (activePowerUp === 'triple_jump') glowColor = '#00E5FF';
        else if (activePowerUp === 'shooting') glowColor = '#FF6D00';
        else if (activePowerUp === 'invulnerable') glowColor = '#76FF03';

        ctx.save();
        ctx.shadowBlur = 12 + Math.sin(gameTick * 0.15) * 5;
        ctx.shadowColor = glowColor;
        ctx.strokeStyle = glowColor;
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.5 + Math.sin(gameTick * 0.1) * 0.2;
        ctx.strokeRect(player.x - 3, player.y - 3, player.width + 6, player.height + 6);
        ctx.restore();
    }
}

function drawUI() {
    // Score (Top Left)
    ctx.fillStyle = 'white';
    ctx.font = '30px "VT323", monospace';
    ctx.fillText(`Score: ${score}`, 20, 40);

    // Lives (Below Score - No overlap)
    ctx.fillStyle = '#FF0000';
    for (let i = 0; i < lives; i++) {
        let hx = 30 + i * 35;
        let hy = 70;

        ctx.save();
        ctx.translate(hx, hy);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.bezierCurveTo(-5, -5, -10, 0, 0, 10);
        ctx.bezierCurveTo(10, 0, 5, -5, 0, 0);
        ctx.fill();
        ctx.restore();

        ctx.font = '24px Arial';
        ctx.fillText('❤️', 20 + i * 35, 80);
    }

    // Difficulty Tier Indicator (Top Right)
    let tierLabel, tierColor;
    if (difficultyTier === 0) { tierLabel = 'CALM'; tierColor = '#4CAF50'; }
    else if (difficultyTier === 1) { tierLabel = 'RISING'; tierColor = '#FFC107'; }
    else if (difficultyTier === 2) { tierLabel = 'DANGER'; tierColor = '#FF5722'; }
    else { tierLabel = 'CHAOS'; tierColor = '#F44336'; }

    ctx.font = 'bold 16px monospace';
    ctx.fillStyle = tierColor;
    let tierX = canvas.width - 90;
    ctx.fillText(tierLabel, tierX, 35);

    // Difficulty bar
    let barW = 70, barH = 6;
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.fillRect(tierX, 40, barW, barH);
    ctx.fillStyle = tierColor;
    ctx.fillRect(tierX, 40, barW * Math.min(difficultyMultiplier / 3.0, 1), barH);
}

// ═══ QUIZ SYSTEM ═══

function shuffleArray(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
        let j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

function generateMathQuestion() {
    let a, b, op, answer, questionText;
    if (gameLevel === 'hard') {
        let ops = ['+', '-', 'x'];
        op = ops[Math.floor(Math.random() * ops.length)];
        if (op === 'x') {
            a = Math.floor(Math.random() * 12) + 1;
            b = Math.floor(Math.random() * 12) + 1;
            answer = a * b;
            questionText = `${a} x ${b} = ?`;
        } else if (op === '-') {
            a = Math.floor(Math.random() * 100) + 1;
            b = Math.floor(Math.random() * a) + 1;
            answer = a - b;
            questionText = `${a} - ${b} = ?`;
        } else {
            a = Math.floor(Math.random() * 100) + 1;
            b = Math.floor(Math.random() * 100) + 1;
            answer = a + b;
            questionText = `${a} + ${b} = ?`;
        }
    } else {
        // Medium (Hebrew)
        let ops = ['+', '-'];
        op = ops[Math.floor(Math.random() * ops.length)];
        if (op === '-') {
            a = Math.floor(Math.random() * 20) + 1;
            b = Math.floor(Math.random() * a) + 1;
            answer = a - b;
            questionText = `? = ${b} - ${a} :כמה זה`;
        } else {
            a = Math.floor(Math.random() * 20) + 1;
            b = Math.floor(Math.random() * 20) + 1;
            answer = a + b;
            questionText = `? = ${b} + ${a} :כמה זה`;
        }
    }

    // Generate 3 wrong answers
    let choices = [answer];
    while (choices.length < 4) {
        let offset = Math.floor(Math.random() * 10) + 1;
        let wrong = answer + (Math.random() < 0.5 ? offset : -offset);
        if (wrong < 0) wrong = answer + offset;
        if (!choices.includes(wrong)) choices.push(wrong);
    }

    return {
        question: questionText,
        choices: shuffleArray(choices),
        correctAnswer: answer
    };
}

// Hebrew labels for medium picture vocab (keyed by English drawing name)
const hebrewLabels = {
    apple: 'תפוח', house: 'בית', sun: 'שמש', tree: 'עץ',
    car: 'מכונית', fish: 'דג', star: 'כוכב', cat: 'חתול',
    dog: 'כלב', ball: 'כדור', book: 'ספר', flower: 'פרח',
    moon: 'ירח', heart: 'לב', cloud: 'ענן', boat: 'סירה'
};

function generatePictureQuestion() {
    let vocab, displayVocab;
    if (gameLevel === 'hard') {
        vocab = ['guitar', 'bicycle', 'umbrella', 'rocket', 'butterfly', 'diamond', 'crown', 'castle', 'rainbow', 'volcano', 'snowflake', 'anchor', 'telescope', 'hourglass', 'lighthouse', 'octopus'];
        displayVocab = null; // English labels
    } else {
        // Medium — Hebrew labels
        vocab = ['apple', 'house', 'sun', 'tree', 'car', 'fish', 'star', 'cat', 'dog', 'ball', 'book', 'flower', 'moon', 'heart', 'cloud', 'boat'];
        displayVocab = hebrewLabels;
    }

    let correctWord = vocab[Math.floor(Math.random() * vocab.length)];
    let correctLabel = displayVocab ? displayVocab[correctWord] : correctWord;
    let choices = [correctLabel];
    let pool = vocab.filter(w => w !== correctWord);
    shuffleArray(pool);
    for (let i = 0; i < 3 && i < pool.length; i++) {
        choices.push(displayVocab ? displayVocab[pool[i]] : pool[i]);
    }

    return {
        question: displayVocab ? '?מה זה' : 'What is this?',
        choices: shuffleArray(choices),
        correctAnswer: correctLabel,
        picture: correctWord // always English key for drawing
    };
}

function generateTriviaQuestion() {
    let pool, isHebrew;
    if (gameLevel === 'hard') {
        pool = hardTrivia;
        isHebrew = false;
    } else {
        pool = hebrewTrivia;
        isHebrew = true;
    }
    let item = pool[Math.floor(Math.random() * pool.length)];
    let choices = [item.a, ...item.wrong];
    return {
        question: item.q,
        choices: shuffleArray(choices),
        correctAnswer: item.a
    };
}

function drawQuizPicture(word) {
    let c = quizCtx;
    let w = quizCanvas.width;
    let h = quizCanvas.height;
    c.clearRect(0, 0, w, h);
    c.fillStyle = '#1a1a2e';
    c.fillRect(0, 0, w, h);

    switch (word) {
        case 'apple':
            c.fillStyle = '#E53935';
            c.beginPath(); c.arc(100, 85, 35, 0, Math.PI * 2); c.fill();
            c.fillStyle = '#4CAF50';
            c.fillRect(96, 42, 8, 18);
            c.beginPath(); c.ellipse(110, 48, 12, 6, 0.4, 0, Math.PI * 2); c.fill();
            break;
        case 'house':
            c.fillStyle = '#8D6E63';
            c.fillRect(60, 70, 80, 70);
            c.fillStyle = '#D32F2F';
            c.beginPath(); c.moveTo(50, 70); c.lineTo(100, 25); c.lineTo(150, 70); c.fill();
            c.fillStyle = '#FFEB3B';
            c.fillRect(85, 100, 30, 40);
            c.fillStyle = '#64B5F6';
            c.fillRect(68, 85, 20, 20);
            c.fillRect(112, 85, 20, 20);
            break;
        case 'sun':
            c.fillStyle = '#FFD600';
            c.beginPath(); c.arc(100, 75, 35, 0, Math.PI * 2); c.fill();
            c.strokeStyle = '#FFD600'; c.lineWidth = 4;
            for (let i = 0; i < 8; i++) {
                let angle = (i / 8) * Math.PI * 2;
                c.beginPath();
                c.moveTo(100 + Math.cos(angle) * 42, 75 + Math.sin(angle) * 42);
                c.lineTo(100 + Math.cos(angle) * 58, 75 + Math.sin(angle) * 58);
                c.stroke();
            }
            break;
        case 'tree':
            c.fillStyle = '#5D4037';
            c.fillRect(88, 80, 24, 60);
            c.fillStyle = '#2E7D32';
            c.beginPath(); c.moveTo(100, 15); c.lineTo(55, 85); c.lineTo(145, 85); c.fill();
            c.beginPath(); c.moveTo(100, 35); c.lineTo(60, 100); c.lineTo(140, 100); c.fill();
            break;
        case 'car':
            c.fillStyle = '#1565C0';
            c.fillRect(40, 70, 120, 40);
            c.fillRect(60, 45, 80, 30);
            c.fillStyle = '#90CAF9';
            c.fillRect(65, 50, 30, 22);
            c.fillRect(105, 50, 30, 22);
            c.fillStyle = '#333';
            c.beginPath(); c.arc(70, 112, 14, 0, Math.PI * 2); c.fill();
            c.beginPath(); c.arc(130, 112, 14, 0, Math.PI * 2); c.fill();
            c.fillStyle = '#888';
            c.beginPath(); c.arc(70, 112, 6, 0, Math.PI * 2); c.fill();
            c.beginPath(); c.arc(130, 112, 6, 0, Math.PI * 2); c.fill();
            break;
        case 'fish':
            c.fillStyle = '#FF9800';
            c.beginPath(); c.ellipse(100, 75, 40, 22, 0, 0, Math.PI * 2); c.fill();
            c.fillStyle = '#F57C00';
            c.beginPath(); c.moveTo(140, 75); c.lineTo(170, 55); c.lineTo(170, 95); c.fill();
            c.fillStyle = '#FFF';
            c.beginPath(); c.arc(75, 70, 7, 0, Math.PI * 2); c.fill();
            c.fillStyle = '#000';
            c.beginPath(); c.arc(75, 70, 3, 0, Math.PI * 2); c.fill();
            break;
        case 'star':
            c.fillStyle = '#FFD600';
            c.beginPath();
            for (let i = 0; i < 5; i++) {
                let angle = (i * 4 * Math.PI / 5) - Math.PI / 2;
                let x = 100 + Math.cos(angle) * 40;
                let y = 75 + Math.sin(angle) * 40;
                if (i === 0) c.moveTo(x, y); else c.lineTo(x, y);
            }
            c.closePath(); c.fill();
            break;
        case 'cat':
            c.fillStyle = '#FF8C00';
            c.beginPath(); c.ellipse(100, 90, 30, 25, 0, 0, Math.PI * 2); c.fill();
            c.beginPath(); c.arc(100, 55, 22, 0, Math.PI * 2); c.fill();
            c.beginPath(); c.moveTo(80, 40); c.lineTo(74, 20); c.lineTo(90, 38); c.fill();
            c.beginPath(); c.moveTo(120, 40); c.lineTo(126, 20); c.lineTo(110, 38); c.fill();
            c.fillStyle = '#4CAF50';
            c.beginPath(); c.arc(90, 52, 5, 0, Math.PI * 2); c.fill();
            c.beginPath(); c.arc(110, 52, 5, 0, Math.PI * 2); c.fill();
            c.fillStyle = '#000';
            c.beginPath(); c.ellipse(90, 52, 2, 4, 0, 0, Math.PI * 2); c.fill();
            c.beginPath(); c.ellipse(110, 52, 2, 4, 0, 0, Math.PI * 2); c.fill();
            c.fillStyle = '#FFB6C1';
            c.beginPath(); c.moveTo(100, 60); c.lineTo(97, 57); c.lineTo(103, 57); c.fill();
            c.strokeStyle = '#DDD'; c.lineWidth = 1;
            c.beginPath(); c.moveTo(85, 58); c.lineTo(65, 55); c.stroke();
            c.beginPath(); c.moveTo(85, 62); c.lineTo(65, 65); c.stroke();
            c.beginPath(); c.moveTo(115, 58); c.lineTo(135, 55); c.stroke();
            c.beginPath(); c.moveTo(115, 62); c.lineTo(135, 65); c.stroke();
            break;
        case 'dog':
            c.fillStyle = '#8D6E63';
            c.beginPath(); c.ellipse(100, 90, 30, 25, 0, 0, Math.PI * 2); c.fill();
            c.beginPath(); c.arc(100, 55, 22, 0, Math.PI * 2); c.fill();
            c.fillStyle = '#6D4C41';
            c.beginPath(); c.ellipse(78, 42, 10, 18, -0.3, 0, Math.PI * 2); c.fill();
            c.beginPath(); c.ellipse(122, 42, 10, 18, 0.3, 0, Math.PI * 2); c.fill();
            c.fillStyle = '#FFF';
            c.beginPath(); c.arc(90, 52, 5, 0, Math.PI * 2); c.fill();
            c.beginPath(); c.arc(110, 52, 5, 0, Math.PI * 2); c.fill();
            c.fillStyle = '#000';
            c.beginPath(); c.arc(90, 52, 2, 0, Math.PI * 2); c.fill();
            c.beginPath(); c.arc(110, 52, 2, 0, Math.PI * 2); c.fill();
            c.fillStyle = '#333';
            c.beginPath(); c.ellipse(100, 63, 6, 4, 0, 0, Math.PI * 2); c.fill();
            c.strokeStyle = '#333'; c.lineWidth = 1.5;
            c.beginPath(); c.arc(100, 70, 8, 0, Math.PI); c.stroke();
            break;
        case 'ball':
            c.fillStyle = '#F44336';
            c.beginPath(); c.arc(100, 75, 35, 0, Math.PI * 2); c.fill();
            c.strokeStyle = '#FFF'; c.lineWidth = 3;
            c.beginPath(); c.arc(100, 75, 35, -0.5, 0.5); c.stroke();
            c.beginPath(); c.arc(100, 75, 35, Math.PI - 0.5, Math.PI + 0.5); c.stroke();
            c.fillStyle = 'rgba(255,255,255,0.3)';
            c.beginPath(); c.ellipse(85, 60, 12, 8, -0.5, 0, Math.PI * 2); c.fill();
            break;
        case 'book':
            c.fillStyle = '#1565C0';
            c.fillRect(60, 40, 80, 80);
            c.fillStyle = '#0D47A1';
            c.fillRect(60, 40, 10, 80);
            c.fillStyle = '#FFF';
            c.fillRect(75, 55, 55, 4);
            c.fillRect(75, 65, 45, 4);
            c.fillRect(75, 75, 50, 4);
            c.strokeStyle = '#0D47A1'; c.lineWidth = 2;
            c.strokeRect(60, 40, 80, 80);
            break;
        case 'flower':
            c.fillStyle = '#4CAF50';
            c.fillRect(96, 80, 8, 60);
            c.fillStyle = '#4CAF50';
            c.beginPath(); c.ellipse(80, 100, 16, 8, -0.5, 0, Math.PI * 2); c.fill();
            c.beginPath(); c.ellipse(120, 105, 16, 8, 0.5, 0, Math.PI * 2); c.fill();
            c.fillStyle = '#E91E63';
            for (let i = 0; i < 6; i++) {
                let angle = (i / 6) * Math.PI * 2;
                c.beginPath();
                c.arc(100 + Math.cos(angle) * 18, 60 + Math.sin(angle) * 18, 12, 0, Math.PI * 2);
                c.fill();
            }
            c.fillStyle = '#FFEB3B';
            c.beginPath(); c.arc(100, 60, 10, 0, Math.PI * 2); c.fill();
            break;
        case 'moon':
            c.fillStyle = '#FDD835';
            c.beginPath(); c.arc(100, 75, 35, 0, Math.PI * 2); c.fill();
            c.fillStyle = '#1a1a2e';
            c.beginPath(); c.arc(118, 65, 30, 0, Math.PI * 2); c.fill();
            break;
        case 'heart':
            c.fillStyle = '#E53935';
            c.beginPath();
            c.moveTo(100, 110);
            c.bezierCurveTo(100, 100, 60, 40, 100, 55);
            c.bezierCurveTo(140, 40, 100, 100, 100, 110);
            c.fill();
            c.beginPath(); c.arc(80, 58, 22, 0, Math.PI * 2); c.fill();
            c.beginPath(); c.arc(120, 58, 22, 0, Math.PI * 2); c.fill();
            break;
        case 'cloud':
            c.fillStyle = '#ECEFF1';
            c.beginPath(); c.arc(80, 80, 25, 0, Math.PI * 2); c.fill();
            c.beginPath(); c.arc(110, 70, 30, 0, Math.PI * 2); c.fill();
            c.beginPath(); c.arc(135, 80, 22, 0, Math.PI * 2); c.fill();
            c.fillRect(75, 80, 65, 25);
            break;
        case 'boat':
            c.fillStyle = '#795548';
            c.beginPath(); c.moveTo(40, 90); c.lineTo(60, 120); c.lineTo(140, 120); c.lineTo(160, 90); c.closePath(); c.fill();
            c.fillStyle = '#8D6E63';
            c.fillRect(96, 40, 8, 50);
            c.fillStyle = '#FFF';
            c.beginPath(); c.moveTo(104, 45); c.lineTo(145, 70); c.lineTo(104, 85); c.fill();
            c.fillStyle = '#1565C0';
            c.fillRect(0, 115, 200, 35);
            break;
        // Hard vocab
        case 'guitar':
            c.fillStyle = '#8D6E63';
            c.fillRect(95, 15, 10, 80);
            c.fillStyle = '#D4A373';
            c.beginPath(); c.ellipse(100, 105, 30, 25, 0, 0, Math.PI * 2); c.fill();
            c.fillStyle = '#5D4037';
            c.beginPath(); c.arc(100, 105, 8, 0, Math.PI * 2); c.fill();
            c.fillStyle = '#FFD600';
            c.fillRect(90, 15, 20, 12);
            c.strokeStyle = '#999'; c.lineWidth = 1;
            for (let i = 0; i < 4; i++) c.beginPath(), c.moveTo(96 + i * 3, 27), c.lineTo(96 + i * 3, 95), c.stroke();
            break;
        case 'bicycle':
            c.strokeStyle = '#F44336'; c.lineWidth = 3;
            c.beginPath(); c.arc(60, 95, 25, 0, Math.PI * 2); c.stroke();
            c.beginPath(); c.arc(140, 95, 25, 0, Math.PI * 2); c.stroke();
            c.strokeStyle = '#333'; c.lineWidth = 3;
            c.beginPath(); c.moveTo(60, 95); c.lineTo(90, 65); c.lineTo(120, 65); c.lineTo(140, 95); c.stroke();
            c.beginPath(); c.moveTo(90, 65); c.lineTo(100, 95); c.lineTo(120, 65); c.stroke();
            c.fillStyle = '#333';
            c.beginPath(); c.moveTo(82, 55); c.lineTo(98, 55); c.lineTo(90, 65); c.fill();
            c.fillRect(95, 90, 20, 4);
            break;
        case 'umbrella':
            c.fillStyle = '#E53935';
            c.beginPath(); c.arc(100, 60, 50, Math.PI, 0); c.fill();
            c.fillStyle = '#C62828';
            c.beginPath(); c.arc(75, 60, 25, Math.PI, 0); c.fill();
            c.fillStyle = '#E53935';
            c.beginPath(); c.arc(100, 60, 25, Math.PI, 0); c.fill();
            c.fillStyle = '#C62828';
            c.beginPath(); c.arc(125, 60, 25, Math.PI, 0); c.fill();
            c.strokeStyle = '#5D4037'; c.lineWidth = 4;
            c.beginPath(); c.moveTo(100, 60); c.lineTo(100, 130); c.stroke();
            c.beginPath(); c.arc(110, 130, 10, Math.PI * 0.5, Math.PI); c.stroke();
            break;
        case 'rocket':
            c.fillStyle = '#CFD8DC';
            c.beginPath(); c.moveTo(100, 15); c.lineTo(80, 80); c.lineTo(120, 80); c.closePath(); c.fill();
            c.fillStyle = '#CFD8DC';
            c.fillRect(80, 80, 40, 30);
            c.fillStyle = '#F44336';
            c.beginPath(); c.moveTo(80, 110); c.lineTo(65, 130); c.lineTo(80, 95); c.fill();
            c.beginPath(); c.moveTo(120, 110); c.lineTo(135, 130); c.lineTo(120, 95); c.fill();
            c.fillStyle = '#1565C0';
            c.beginPath(); c.arc(100, 65, 10, 0, Math.PI * 2); c.fill();
            c.fillStyle = '#64B5F6';
            c.beginPath(); c.arc(100, 65, 6, 0, Math.PI * 2); c.fill();
            c.fillStyle = '#FF6D00';
            c.beginPath(); c.moveTo(88, 110); c.lineTo(100, 140); c.lineTo(112, 110); c.fill();
            c.fillStyle = '#FFAB00';
            c.beginPath(); c.moveTo(92, 110); c.lineTo(100, 130); c.lineTo(108, 110); c.fill();
            break;
        case 'butterfly':
            c.fillStyle = '#7B1FA2';
            c.beginPath(); c.ellipse(75, 60, 25, 20, -0.3, 0, Math.PI * 2); c.fill();
            c.beginPath(); c.ellipse(125, 60, 25, 20, 0.3, 0, Math.PI * 2); c.fill();
            c.fillStyle = '#CE93D8';
            c.beginPath(); c.ellipse(80, 90, 18, 15, -0.3, 0, Math.PI * 2); c.fill();
            c.beginPath(); c.ellipse(120, 90, 18, 15, 0.3, 0, Math.PI * 2); c.fill();
            c.fillStyle = '#4A148C';
            c.fillRect(97, 45, 6, 55);
            c.strokeStyle = '#4A148C'; c.lineWidth = 2;
            c.beginPath(); c.moveTo(97, 48); c.quadraticCurveTo(80, 25, 85, 20); c.stroke();
            c.beginPath(); c.moveTo(103, 48); c.quadraticCurveTo(120, 25, 115, 20); c.stroke();
            c.fillStyle = '#4A148C';
            c.beginPath(); c.arc(85, 20, 3, 0, Math.PI * 2); c.fill();
            c.beginPath(); c.arc(115, 20, 3, 0, Math.PI * 2); c.fill();
            break;
        case 'diamond':
            c.fillStyle = '#00BCD4';
            c.beginPath(); c.moveTo(100, 20); c.lineTo(60, 65); c.lineTo(100, 130); c.lineTo(140, 65); c.closePath(); c.fill();
            c.fillStyle = '#26C6DA';
            c.beginPath(); c.moveTo(100, 20); c.lineTo(80, 65); c.lineTo(100, 130); c.closePath(); c.fill();
            c.fillStyle = 'rgba(255,255,255,0.3)';
            c.beginPath(); c.moveTo(100, 20); c.lineTo(80, 65); c.lineTo(100, 50); c.closePath(); c.fill();
            break;
        case 'crown':
            c.fillStyle = '#FFD600';
            c.fillRect(55, 70, 90, 50);
            c.beginPath(); c.moveTo(55, 70); c.lineTo(55, 35); c.lineTo(78, 55); c.lineTo(100, 25); c.lineTo(122, 55); c.lineTo(145, 35); c.lineTo(145, 70); c.fill();
            c.fillStyle = '#E53935';
            c.beginPath(); c.arc(75, 85, 6, 0, Math.PI * 2); c.fill();
            c.beginPath(); c.arc(100, 85, 6, 0, Math.PI * 2); c.fill();
            c.beginPath(); c.arc(125, 85, 6, 0, Math.PI * 2); c.fill();
            break;
        case 'castle':
            c.fillStyle = '#9E9E9E';
            c.fillRect(50, 50, 100, 90);
            for (let i = 0; i < 5; i++) {
                c.fillRect(48 + i * 25, 35, 15, 20);
            }
            c.fillStyle = '#5D4037';
            c.beginPath(); c.arc(100, 120, 18, Math.PI, 0); c.fill();
            c.fillRect(82, 120, 36, 20);
            c.fillStyle = '#1565C0';
            c.fillRect(62, 70, 16, 20);
            c.fillRect(122, 70, 16, 20);
            break;
        case 'rainbow':
            let colors = ['#E53935', '#FF9800', '#FFEB3B', '#4CAF50', '#2196F3', '#9C27B0'];
            for (let i = 0; i < colors.length; i++) {
                c.strokeStyle = colors[i]; c.lineWidth = 8;
                c.beginPath(); c.arc(100, 110, 60 - i * 8, Math.PI, 0); c.stroke();
            }
            break;
        case 'volcano':
            c.fillStyle = '#5D4037';
            c.beginPath(); c.moveTo(100, 30); c.lineTo(35, 130); c.lineTo(165, 130); c.closePath(); c.fill();
            c.fillStyle = '#3E2723';
            c.beginPath(); c.moveTo(100, 30); c.lineTo(75, 130); c.lineTo(35, 130); c.closePath(); c.fill();
            c.fillStyle = '#E53935';
            c.beginPath(); c.ellipse(100, 32, 15, 8, 0, 0, Math.PI * 2); c.fill();
            c.fillStyle = '#FF6D00';
            c.beginPath(); c.moveTo(90, 32); c.lineTo(85, 10); c.lineTo(100, 25); c.fill();
            c.beginPath(); c.moveTo(105, 30); c.lineTo(115, 8); c.lineTo(100, 22); c.fill();
            c.beginPath(); c.moveTo(98, 28); c.lineTo(95, 5); c.lineTo(102, 18); c.fill();
            break;
        case 'snowflake':
            c.strokeStyle = '#90CAF9'; c.lineWidth = 3;
            for (let i = 0; i < 6; i++) {
                let angle = (i / 6) * Math.PI * 2;
                let cx = 100, cy = 75;
                let ex = cx + Math.cos(angle) * 45, ey = cy + Math.sin(angle) * 45;
                c.beginPath(); c.moveTo(cx, cy); c.lineTo(ex, ey); c.stroke();
                let bx = cx + Math.cos(angle) * 25, by = cy + Math.sin(angle) * 25;
                c.beginPath();
                c.moveTo(bx, by);
                c.lineTo(bx + Math.cos(angle + 0.6) * 12, by + Math.sin(angle + 0.6) * 12);
                c.stroke();
                c.beginPath();
                c.moveTo(bx, by);
                c.lineTo(bx + Math.cos(angle - 0.6) * 12, by + Math.sin(angle - 0.6) * 12);
                c.stroke();
            }
            break;
        case 'anchor':
            c.strokeStyle = '#546E7A'; c.lineWidth = 6;
            c.beginPath(); c.moveTo(100, 25); c.lineTo(100, 120); c.stroke();
            c.beginPath(); c.arc(100, 120, 30, 0, Math.PI); c.stroke();
            c.beginPath(); c.moveTo(65, 55); c.lineTo(135, 55); c.stroke();
            c.fillStyle = '#546E7A';
            c.beginPath(); c.arc(100, 22, 10, 0, Math.PI * 2); c.fill();
            c.fillStyle = '#1a1a2e';
            c.beginPath(); c.arc(100, 22, 5, 0, Math.PI * 2); c.fill();
            break;
        case 'telescope':
            c.fillStyle = '#5D4037';
            c.save(); c.translate(100, 75); c.rotate(-0.5);
            c.fillRect(-50, -8, 100, 16);
            c.fillStyle = '#8D6E63';
            c.fillRect(40, -10, 25, 20);
            c.fillStyle = '#1565C0';
            c.beginPath(); c.arc(65, 0, 10, 0, Math.PI * 2); c.fill();
            c.restore();
            c.fillStyle = '#5D4037';
            c.beginPath(); c.moveTo(90, 95); c.lineTo(70, 135); c.lineTo(78, 135); c.lineTo(95, 100); c.fill();
            c.beginPath(); c.moveTo(110, 95); c.lineTo(130, 135); c.lineTo(122, 135); c.lineTo(105, 100); c.fill();
            break;
        case 'hourglass':
            c.fillStyle = '#8D6E63';
            c.fillRect(70, 20, 60, 8);
            c.fillRect(70, 122, 60, 8);
            c.strokeStyle = '#8D6E63'; c.lineWidth = 3;
            c.beginPath(); c.moveTo(75, 28); c.lineTo(100, 75); c.lineTo(125, 28); c.stroke();
            c.beginPath(); c.moveTo(75, 122); c.lineTo(100, 75); c.lineTo(125, 122); c.stroke();
            c.fillStyle = '#FFD54F';
            c.beginPath(); c.moveTo(80, 122); c.lineTo(100, 90); c.lineTo(120, 122); c.fill();
            c.fillStyle = '#FFE082';
            c.beginPath(); c.moveTo(90, 28); c.lineTo(100, 45); c.lineTo(110, 28); c.fill();
            break;
        case 'lighthouse':
            c.fillStyle = '#FFF';
            c.fillRect(80, 30, 40, 100);
            c.fillStyle = '#E53935';
            c.fillRect(80, 50, 40, 15);
            c.fillRect(80, 85, 40, 15);
            c.fillStyle = '#FFD600';
            c.fillRect(75, 20, 50, 15);
            c.fillStyle = '#FFEB3B';
            c.beginPath(); c.moveTo(60, 27); c.lineTo(75, 27); c.lineTo(75, 20); c.fill();
            c.beginPath(); c.moveTo(140, 27); c.lineTo(125, 27); c.lineTo(125, 20); c.fill();
            c.fillStyle = '#1565C0';
            c.fillRect(50, 125, 100, 15);
            break;
        case 'octopus':
            c.fillStyle = '#E91E63';
            c.beginPath(); c.ellipse(100, 55, 30, 25, 0, 0, Math.PI * 2); c.fill();
            c.fillStyle = '#FFF';
            c.beginPath(); c.arc(88, 50, 6, 0, Math.PI * 2); c.fill();
            c.beginPath(); c.arc(112, 50, 6, 0, Math.PI * 2); c.fill();
            c.fillStyle = '#000';
            c.beginPath(); c.arc(88, 50, 3, 0, Math.PI * 2); c.fill();
            c.beginPath(); c.arc(112, 50, 3, 0, Math.PI * 2); c.fill();
            c.strokeStyle = '#E91E63'; c.lineWidth = 6;
            for (let i = 0; i < 8; i++) {
                let startX = 75 + i * 7;
                c.beginPath();
                c.moveTo(startX, 75);
                c.quadraticCurveTo(startX + (i % 2 === 0 ? 10 : -10), 105, startX + (i % 2 === 0 ? 5 : -5), 130);
                c.stroke();
            }
            break;
        default:
            // Fallback: draw the word as text
            c.fillStyle = '#FFF';
            c.font = 'bold 28px "VT323", monospace';
            c.textAlign = 'center';
            c.textBaseline = 'middle';
            c.fillText(word, w / 2, h / 2);
            c.textAlign = 'start';
            c.textBaseline = 'alphabetic';
            break;
    }
}

function playHurtSound() {
    if (audioCtx && audioCtx.state !== 'suspended') {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(50, audioCtx.currentTime + 0.3);
        gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.3);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.3);
    }
}

let quizTimerInterval = null;
let quizTimeLeft = 0;
let quizTimeMax = 0;
const quizTimerBar = document.getElementById('quiz-timer-bar');
const quizTimerFill = document.getElementById('quiz-timer-fill');

function showQuiz(quizType, damageSource) {
    quizActive = true;

    if (quizType === 'math') {
        currentQuiz = generateMathQuestion();
        quizCanvas.classList.add('hidden');
    } else if (quizType === 'trivia') {
        currentQuiz = generateTriviaQuestion();
        quizCanvas.classList.add('hidden');
    } else {
        currentQuiz = generatePictureQuestion();
        quizCanvas.classList.remove('hidden');
        drawQuizPicture(currentQuiz.picture);
    }

    currentQuiz.damageSource = damageSource; // 'obstacle' or 'pit'

    // Set text direction for Hebrew (medium) vs English (hard)
    let isHebrew = gameLevel === 'medium';
    quizQuestionText.style.direction = isHebrew ? 'rtl' : 'ltr';
    quizResult.style.direction = isHebrew ? 'rtl' : 'ltr';

    quizQuestionText.textContent = currentQuiz.question;
    quizResult.textContent = '';
    quizResult.style.color = '';

    quizAnswerBtns.forEach((btn, i) => {
        btn.textContent = currentQuiz.choices[i];
        btn.className = 'quiz-answer-btn';
        btn.disabled = false;
    });

    // Quiz timer for medium and hard levels
    if (quizTimerInterval) clearInterval(quizTimerInterval);
    if (gameLevel === 'hard' || gameLevel === 'medium') {
        quizTimeMax = gameLevel === 'medium' ? 10 : 5; // medium: 10s, hard: 5s
        quizTimeLeft = quizTimeMax * 10; // tenths of a second for smooth bar
        quizTimerBar.classList.remove('hidden');
        quizTimerFill.style.width = '100%';
        quizTimerFill.className = '';

        quizTimerInterval = setInterval(() => {
            quizTimeLeft--;
            let ratio = quizTimeLeft / (quizTimeMax * 10);
            quizTimerFill.style.width = (ratio * 100) + '%';

            // Color changes
            if (ratio <= 0.25) {
                quizTimerFill.className = 'critical';
            } else if (ratio <= 0.5) {
                quizTimerFill.className = 'warning';
            } else {
                quizTimerFill.className = '';
            }

            // Tick sound in last 5 seconds
            if (quizTimeLeft <= 50 && quizTimeLeft % 10 === 0 && quizTimeLeft > 0) {
                playSound('quiz_tick');
            }

            if (quizTimeLeft <= 0) {
                clearInterval(quizTimerInterval);
                quizTimerInterval = null;
                // Time's up — auto-fail
                quizTimerFill.style.width = '0%';
                playSound('quiz_timeout');
                quizAnswerBtns.forEach((btn, i) => {
                    btn.disabled = true;
                    if (currentQuiz.choices[i] === currentQuiz.correctAnswer) {
                        btn.classList.add('correct');
                    }
                });
                lives--;
                playHurtSound();
                quizResult.textContent = "TIME'S UP! -1 Life. Answer: " + currentQuiz.correctAnswer;
                quizResult.style.color = '#FF9800';
                setTimeout(() => {
                    quizOverlay.classList.add('hidden');
                    quizTimerBar.classList.add('hidden');
                    quizActive = false;
                    currentQuiz = null;
                    if (lives <= 0) {
                        showGameOver();
                    }
                }, 2000);
            }
        }, 100); // update every 100ms
    } else {
        quizTimerBar.classList.add('hidden');
    }

    quizOverlay.classList.remove('hidden');
}

function handleQuizAnswer(selectedIndex) {
    // Delegate to riddle handler if a riddle is active
    if (riddleActive) {
        handleRiddleAnswer(selectedIndex);
        return;
    }

    // Stop the quiz timer
    if (quizTimerInterval) {
        clearInterval(quizTimerInterval);
        quizTimerInterval = null;
    }

    let selected = currentQuiz.choices[selectedIndex];
    let correct = currentQuiz.correctAnswer;
    let isCorrect = selected === correct;

    // Highlight buttons
    quizAnswerBtns.forEach((btn, i) => {
        btn.disabled = true;
        if (currentQuiz.choices[i] === correct) {
            btn.classList.add('correct');
        }
        if (i === selectedIndex && !isCorrect) {
            btn.classList.add('wrong');
        }
    });

    if (isCorrect) {
        // Bonus points for fast answers in hard mode
        let bonus = 100;
        if (gameLevel === 'hard' && quizTimeMax > 0) {
            let timeRatio = quizTimeLeft / (quizTimeMax * 10);
            let speedBonus = Math.floor(timeRatio * 50); // up to +50 for fast answer
            bonus += speedBonus;
        }
        score += bonus;
        let bonusText = bonus > 100 ? `+${bonus}! FAST!` : '+100!';
        quizResult.textContent = `CORRECT! +${bonus} No damage!`;
        quizResult.style.color = '#4CAF50';
        // Celebration animation
        spawnParticles(canvas.width / 2, canvas.height / 2, 'correct_answer');
        spawnFloatingText(canvas.width / 2, canvas.height / 2 - 40, bonusText, '#69F0AE', 36);
        triggerScreenFlash('#69F0AE', 20);
        playSound('powerup');
    } else {
        lives--;
        playHurtSound();
        quizResult.textContent = 'WRONG! -1 Life. Answer: ' + correct;
        quizResult.style.color = '#F44336';
    }

    setTimeout(() => {
        quizOverlay.classList.add('hidden');
        quizTimerBar.classList.add('hidden');
        quizActive = false;
        currentQuiz = null;

        if (lives <= 0) {
            showGameOver();
        }
    }, 2000);
}

// === RIDDLE SYSTEM ===

// Riddle pool now loaded from external files (hebrewRiddles / hardRiddles)
// Fallback pool for easy mode or if external files fail to load
const fallbackRiddlePool = [
    { q: "I have hands but can't clap. What am I?", a: "Clock", wrong: ["Glove", "Statue"] },
    { q: "I have teeth but can't bite. What am I?", a: "Comb", wrong: ["Shark", "Zipper"] },
    { q: "What has keys but no locks?", a: "Piano", wrong: ["Map", "Phone"] },
    { q: "What gets wetter the more it dries?", a: "Towel", wrong: ["Rain", "Sponge"] },
    { q: "What has a neck but no head?", a: "Bottle", wrong: ["Giraffe", "Shirt"] },
    { q: "What has words but never speaks?", a: "Book", wrong: ["Phone", "Radio"] },
    { q: "What goes up but never comes down?", a: "Age", wrong: ["Balloon", "Rocket"] },
    { q: "What building has the most stories?", a: "Library", wrong: ["Skyscraper", "Castle"] },
];

function generateRiddle() {
    let pool;
    if (gameLevel === 'hard' && typeof hardRiddles !== 'undefined') {
        pool = hardRiddles;
    } else if (gameLevel === 'medium' && typeof hebrewRiddles !== 'undefined') {
        pool = hebrewRiddles;
    } else {
        pool = fallbackRiddlePool;
    }
    let riddle = pool[Math.floor(Math.random() * pool.length)];
    let choices = [riddle.a, ...riddle.wrong];
    // Shuffle
    for (let i = choices.length - 1; i > 0; i--) {
        let j = Math.floor(Math.random() * (i + 1));
        [choices[i], choices[j]] = [choices[j], choices[i]];
    }
    return {
        question: riddle.q,
        choices: choices,
        correctAnswer: riddle.a
    };
}

function showRiddle() {
    riddleActive = true;
    riddleTimer = riddleMaxTime;
    quizActive = true;

    currentRiddle = generateRiddle();

    quizCanvas.classList.add('hidden');
    let isHebrew = gameLevel === 'medium';
    quizQuestionText.style.direction = isHebrew ? 'rtl' : 'ltr';
    quizResult.style.direction = isHebrew ? 'rtl' : 'ltr';

    quizQuestionText.textContent = currentRiddle.question;
    quizResult.textContent = '';
    quizResult.style.color = '';

    // Show only 3 buttons for riddles
    quizAnswerBtns.forEach((btn, i) => {
        if (i < 3) {
            btn.textContent = currentRiddle.choices[i];
            btn.className = 'quiz-answer-btn';
            btn.disabled = false;
            btn.style.display = '';
            btn.style.direction = isHebrew ? 'rtl' : 'ltr';
        } else {
            btn.style.display = 'none';
        }
    });

    quizOverlay.classList.remove('hidden');

    // Start riddle countdown
    if (window.riddleCountdown) clearInterval(window.riddleCountdown);
    window.riddleCountdown = setInterval(() => {
        if (!riddleActive) { clearInterval(window.riddleCountdown); return; }
        riddleTimer -= 6; // roughly 10fps update rate for the timer
        if (riddleTimer <= 0) {
            clearInterval(window.riddleCountdown);
            // Auto-dismiss - no reward
            quizResult.textContent = "Time's up! No power-up.";
            quizResult.style.color = '#FF9800';
            quizAnswerBtns.forEach(btn => btn.disabled = true);
            setTimeout(() => {
                quizOverlay.classList.add('hidden');
                quizActive = false;
                riddleActive = false;
                currentRiddle = null;
                // Restore 4th button
                quizAnswerBtns.forEach(btn => btn.style.display = '');
            }, 1500);
        }
        // Update countdown display in result area
        if (riddleActive && riddleTimer > 0) {
            let secs = Math.ceil(riddleTimer / 60);
            quizResult.textContent = 'Time: ' + secs + 's';
            quizResult.style.color = riddleTimer < 180 ? '#F44336' : '#FFC107';
        }
    }, 100);
}

function handleRiddleAnswer(selectedIndex) {
    if (window.riddleCountdown) clearInterval(window.riddleCountdown);

    let selected = currentRiddle.choices[selectedIndex];
    let correct = currentRiddle.correctAnswer;
    let isCorrect = selected === correct;

    quizAnswerBtns.forEach((btn, i) => {
        btn.disabled = true;
        if (i < 3 && currentRiddle.choices[i] === correct) {
            btn.classList.add('correct');
        }
        if (i === selectedIndex && !isCorrect) {
            btn.classList.add('wrong');
        }
    });

    if (isCorrect) {
        // Grant random power-up
        let powerUps = ['triple_jump', 'shooting', 'invulnerable'];
        activePowerUp = powerUps[Math.floor(Math.random() * powerUps.length)];
        powerUpTimer = powerUpMaxTimer;
        playSound('powerup');

        let label = activePowerUp.replace('_', ' ').toUpperCase();
        quizResult.textContent = 'CORRECT! Power-up: ' + label + '!';
        quizResult.style.color = '#4CAF50';
        // Celebration animation
        spawnParticles(canvas.width / 2, canvas.height / 2, 'correct_answer');
        spawnFloatingText(canvas.width / 2, canvas.height / 2 - 40, 'POWER UP!', '#76FF03', 32);
        triggerScreenFlash('#76FF03', 20);
    } else {
        if (gameLevel === 'hard') {
            lives--;
            playHurtSound();
            quizResult.textContent = 'Wrong! -1 Life. Answer: ' + correct;
            quizResult.style.color = '#F44336';
        } else {
            quizResult.textContent = 'Wrong! Answer: ' + correct + '. No penalty.';
            quizResult.style.color = '#FF9800';
        }
    }

    setTimeout(() => {
        quizOverlay.classList.add('hidden');
        quizActive = false;
        riddleActive = false;
        currentRiddle = null;
        // Restore 4th button
        quizAnswerBtns.forEach(btn => btn.style.display = '');
        if (gameLevel === 'hard' && lives <= 0) {
            showGameOver();
        }
    }, 2000);
}

// Quiz answer button listeners
quizAnswerBtns.forEach((btn, i) => {
    btn.addEventListener('click', () => { if (!btn.disabled) handleQuizAnswer(i); });
    btn.addEventListener('touchstart', (e) => { e.preventDefault(); if (!btn.disabled) handleQuizAnswer(i); }, { passive: false });
});
