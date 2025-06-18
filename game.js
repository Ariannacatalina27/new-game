const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const ROWS = 4;
const CUPS = [];
const BALL_START = { x: canvas.width / 2, y: canvas.height - 60 };
let ball = { ...BALL_START, vx: 0, vy: 0, moving: false };
let score = 0;
let wind = 0; // wind strength for the current throw
let fanAngle = 0; // for animating the fan blades
let scoreFlash = 0; // For scoreboard flash effect

// Difficulty settings
const DIFFICULTY_SETTINGS = {
    easy:    { ballRadius: 14, cupRadius: 34, deviation: 0, cupCount: 6, cupSpacing: 10 },
    medium:  { ballRadius: 10, cupRadius: 30, deviation: Math.PI / 36, cupCount: 9, cupSpacing: 24 }, // ~5 deg
    hard:    { ballRadius: 7,  cupRadius: 26, deviation: Math.PI / 18, cupCount: 12, cupSpacing: 38 }  // ~10 deg
};
let currentDifficulty = 'medium';
let currentMap = 'hearts';

// Timed Mode settings
let timedMode = false;
let timeLeft = 60; // seconds
let timerActive = false;
let timerFlash = 0;

// Arrange cups in a pyramid
function setupCups() {
    CUPS.length = 0;
    let count = 0;
    // Calculate rows needed for the cup count (pyramid)
    const totalCups = DIFFICULTY_SETTINGS[currentDifficulty].cupCount;
    let rows = 1;
    while ((rows * (rows + 1)) / 2 < totalCups) rows++;
    let cupIndex = 0;
    for (let row = 0; row < rows; row++) {
        let cupsInRow = row + 1;
        let y = 120 + row * (DIFFICULTY_SETTINGS[currentDifficulty].cupRadius * 1.5 + DIFFICULTY_SETTINGS[currentDifficulty].cupSpacing / 2);
        let rowWidth = cupsInRow * DIFFICULTY_SETTINGS[currentDifficulty].cupRadius * 2 + (cupsInRow - 1) * DIFFICULTY_SETTINGS[currentDifficulty].cupSpacing;
        let xStart = (canvas.width - rowWidth) / 2 + DIFFICULTY_SETTINGS[currentDifficulty].cupRadius;
        for (let i = 0; i < cupsInRow; i++) {
            if (cupIndex >= totalCups) break;
            CUPS.push({
                x: xStart + i * (DIFFICULTY_SETTINGS[currentDifficulty].cupRadius * 2 + DIFFICULTY_SETTINGS[currentDifficulty].cupSpacing),
                y,
                hit: false
            });
            cupIndex++;
        }
    }
}

function drawCups() {
    for (const cup of CUPS) {
        ctx.save();
        ctx.globalAlpha = cup.hit ? 0.2 : 1;
        ctx.beginPath();
        ctx.arc(cup.x, cup.y, DIFFICULTY_SETTINGS[currentDifficulty].cupRadius, 0, Math.PI * 2);
        ctx.fillStyle = '#ff69b4'; // hot pink
        ctx.fill();
        ctx.strokeStyle = '#e6007a'; // deep pink
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.restore();
    }
}

function drawBall() {
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, DIFFICULTY_SETTINGS[currentDifficulty].ballRadius, 0, Math.PI * 2);
    ctx.fillStyle = '#e6007a'; // deep pink
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();
}

function drawFan() {
    // Fan position (left side)
    const fanX = 60;
    const fanY = canvas.height / 2;
    ctx.save();
    ctx.translate(fanX, fanY);
    // Draw fan body
    ctx.beginPath();
    ctx.arc(0, 0, 30, 0, Math.PI * 2);
    ctx.fillStyle = '#fff0fa';
    ctx.strokeStyle = '#e6007a';
    ctx.lineWidth = 4;
    ctx.fill();
    ctx.stroke();
    // Draw fan blades (rotate for animation)
    for (let i = 0; i < 3; i++) {
        ctx.save();
        ctx.rotate(fanAngle + i * (Math.PI * 2 / 3));
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, 24, -0.3, 0.3);
        ctx.lineTo(0, 0);
        ctx.fillStyle = '#ff69b4';
        ctx.fill();
        ctx.restore();
    }
    // Draw wind direction arrow
    ctx.save();
    ctx.rotate(wind > 0 ? Math.PI / 2 : -Math.PI / 2);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, -40);
    ctx.lineTo(-8, -32);
    ctx.moveTo(0, -40);
    ctx.lineTo(8, -32);
    ctx.strokeStyle = wind > 0 ? '#e6007a' : '#00aaff';
    ctx.lineWidth = 4;
    ctx.stroke();
    ctx.restore();
    ctx.restore();
}

function drawScoreboard() {
    // Scoreboard background
    ctx.save();
    ctx.globalAlpha = 0.95;
    ctx.fillStyle = scoreFlash > 0 ? '#ffb6e6' : '#fff0fa'; // Light up when scored
    ctx.strokeStyle = '#e6007a';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(420, 20, 160, 60, 18);
    ctx.fill();
    ctx.stroke();
    // Score text
    ctx.font = 'bold 28px Arial';
    ctx.fillStyle = '#e6007a';
    ctx.textAlign = 'center';
    ctx.fillText('Score', 500, 48);
    ctx.font = 'bold 32px Arial';
    ctx.fillStyle = scoreFlash > 0 ? '#fff' : '#e6007a';
    ctx.fillText(`${score} / ${DIFFICULTY_SETTINGS[currentDifficulty].cupCount}`, 500, 78);
    ctx.textAlign = 'start';
    ctx.restore();
}

function drawMapBackground() {
    ctx.save();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (currentMap === 'hearts') {
        // Pink gradient with hearts (static positions)
        const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
        grad.addColorStop(0, '#ffe0f7');
        grad.addColorStop(1, '#ffb6e6');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        // Use fixed positions for hearts
        const heartPositions = [
            [80, 100], [200, 180], [400, 120], [520, 90], [150, 350], [300, 250], [500, 300],
            [100, 500], [250, 480], [400, 420], [520, 520], [60, 320], [350, 540], [220, 60], [480, 200], [320, 400], [180, 260], [540, 400]
        ];
        for (const [x, y] of heartPositions) {
            drawHeart(x, y, 18, '#ff69b4', 0.13);
        }
    } else if (currentMap === 'stars') {
        // Pink gradient with stars (static positions)
        const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        grad.addColorStop(0, '#ffe0f7');
        grad.addColorStop(1, '#ffb6e6');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        const starPositions = [
            [100, 80], [180, 200], [350, 100], [500, 60], [120, 400], [300, 200], [480, 250],
            [80, 520], [220, 500], [420, 480], [540, 420], [60, 320], [350, 540], [220, 60], [480, 200], [320, 400], [180, 260], [540, 400], [400, 320], [200, 340], [300, 520], [520, 180]
        ];
        for (const [x, y] of starPositions) {
            drawStar(x, y, 12, '#ff69b4', 0.15);
        }
    } else if (currentMap === 'bows') {
        // Pink gradient with bows (static positions)
        const grad = ctx.createRadialGradient(canvas.width/2, canvas.height/2, 100, canvas.width/2, canvas.height/2, 600);
        grad.addColorStop(0, '#fff0fa');
        grad.addColorStop(1, '#ffb6e6');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        const bowPositions = [
            [100, 120], [200, 400], [300, 300], [400, 200], [500, 500], [150, 500], [350, 500], [500, 120], [120, 300], [480, 350]
        ];
        for (const [x, y] of bowPositions) {
            drawBow(x, y, 32, '#e6007a', 0.18);
        }
    } else if (currentMap === 'sparkles') {
        // Pink gradient with sparkles (static positions)
        const grad = ctx.createLinearGradient(0, 0, canvas.width, 0);
        grad.addColorStop(0, '#ffe0f7');
        grad.addColorStop(1, '#fff0fa');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        const sparklePositions = [
            [80, 100], [200, 180], [400, 120], [520, 90], [150, 350], [300, 250], [500, 300],
            [100, 500], [250, 480], [400, 420], [520, 520], [60, 320], [350, 540], [220, 60], [480, 200], [320, 400], [180, 260], [540, 400], [400, 320], [200, 340], [300, 520], [520, 180], [160, 220], [420, 180]
        ];
        for (const [x, y] of sparklePositions) {
            drawSparkle(x, y, 12, '#ff69b4', 0.13);
        }
    }
    ctx.restore();
}

function drawHeart(x, y, size, color, alpha) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.bezierCurveTo(x, y - size/2, x - size, y - size/2, x - size, y);
    ctx.bezierCurveTo(x - size, y + size, x, y + size*1.3, x, y + size*1.7);
    ctx.bezierCurveTo(x, y + size*1.3, x + size, y + size, x + size, y);
    ctx.bezierCurveTo(x + size, y - size/2, x, y - size/2, x, y);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
    ctx.restore();
}

function drawStar(x, y, r, color, alpha) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
        ctx.lineTo(
            x + r * Math.cos((18 + i * 72) * Math.PI / 180),
            y - r * Math.sin((18 + i * 72) * Math.PI / 180)
        );
        ctx.lineTo(
            x + (r/2) * Math.cos((54 + i * 72) * Math.PI / 180),
            y - (r/2) * Math.sin((54 + i * 72) * Math.PI / 180)
        );
    }
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
    ctx.restore();
}

function drawBow(x, y, size, color, alpha) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.beginPath();
    ctx.arc(x - size/2, y, size/2, Math.PI*0.2, Math.PI*1.8, false);
    ctx.arc(x + size/2, y, size/2, Math.PI*1.2, Math.PI*0.8, true);
    ctx.ellipse(x, y, size/4, size/2.5, 0, 0, Math.PI*2);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.restore();
}

function drawSparkle(x, y, r, color, alpha) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.beginPath();
    for (let i = 0; i < 8; i++) {
        ctx.moveTo(x, y);
        ctx.lineTo(
            x + r * Math.cos((i * 45) * Math.PI / 180),
            y + r * Math.sin((i * 45) * Math.PI / 180)
        );
    }
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
}

function drawMapDetails() {
    ctx.save();
    ctx.globalAlpha = 0.93;
    ctx.fillStyle = '#fff0fa';
    ctx.strokeStyle = '#e6007a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(20, 520, 320, 60, 16);
    ctx.fill();
    ctx.stroke();
    ctx.font = 'bold 22px Arial';
    ctx.fillStyle = '#e6007a';
    ctx.textAlign = 'left';
    let mapName = '';
    let mapDesc = '';
    if (currentMap === 'hearts') {
        mapName = 'Hearts';
        mapDesc = 'A dreamy pink world filled with floating hearts.';
    } else if (currentMap === 'stars') {
        mapName = 'Stars';
        mapDesc = 'Sparkling pink stars twinkle in a magical sky.';
    } else if (currentMap === 'bows') {
        mapName = 'Bows';
        mapDesc = 'Cute bows decorate this sweet, girly background.';
    } else if (currentMap === 'sparkles') {
        mapName = 'Sparkles';
        mapDesc = 'Glittery sparkles shimmer across a soft pink field.';
    }
    ctx.fillText(`Map: ${mapName}`, 36, 548);
    ctx.font = '16px Arial';
    ctx.fillStyle = '#e6007a';
    ctx.fillText(mapDesc, 36, 570);
    ctx.textAlign = 'start';
    ctx.restore();
}

let bomb = {
    x: 300,
    y: 200,
    radius: 22,
    speed: 1.7,
    dir: 1
};

function resetBomb() {
    bomb.x = 100 + Math.random() * 400;
    bomb.y = 400; // Lowered bomb position
    bomb.dir = Math.random() > 0.5 ? 1 : -1;
    bomb.speed = 1.7 + Math.random() * 0.8;
}

function drawBomb() {
    ctx.save();
    ctx.beginPath();
    ctx.arc(bomb.x, bomb.y, bomb.radius, 0, Math.PI * 2);
    ctx.fillStyle = '#ff4b7b';
    ctx.shadowColor = '#e6007a';
    ctx.shadowBlur = 16;
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = '#e6007a';
    ctx.lineWidth = 3;
    ctx.stroke();
    // Draw fuse
    ctx.beginPath();
    ctx.moveTo(bomb.x, bomb.y - bomb.radius);
    ctx.lineTo(bomb.x, bomb.y - bomb.radius - 14);
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();
    // Draw spark
    ctx.beginPath();
    ctx.arc(bomb.x, bomb.y - bomb.radius - 16, 3, 0, Math.PI * 2);
    ctx.fillStyle = '#ffe600';
    ctx.fill();
    ctx.restore();
}

function updateBomb() {
    bomb.x += bomb.speed * bomb.dir;
    if (bomb.x < 60 + bomb.radius || bomb.x > canvas.width - 60 - bomb.radius) {
        bomb.dir *= -1;
    }
}

function ballHitsBomb() {
    const dx = ball.x - bomb.x;
    const dy = ball.y - bomb.y;
    return Math.sqrt(dx * dx + dy * dy) < bomb.radius + DIFFICULTY_SETTINGS[currentDifficulty].ballRadius;
}

function drawTimer() {
    if (!timedMode) return;
    ctx.save();
    ctx.globalAlpha = 0.97;
    ctx.beginPath();
    ctx.roundRect(220, 20, 120, 48, 14);
    ctx.fillStyle = timerFlash > 0 ? '#ffb6e6' : '#fff0fa';
    ctx.fill();
    ctx.strokeStyle = '#e6007a';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.font = 'bold 26px Quicksand, Arial, sans-serif';
    ctx.fillStyle = '#e6007a';
    ctx.textAlign = 'center';
    ctx.fillText('Time', 280, 44);
    ctx.font = 'bold 28px Quicksand, Arial, sans-serif';
    ctx.fillStyle = timerFlash > 0 ? '#fff' : '#e6007a';
    ctx.fillText(`${timeLeft}s`, 280, 70);
    ctx.textAlign = 'start';
    ctx.restore();
}

let maps = ['hearts', 'stars', 'bows', 'sparkles'];

function getNextMap(current) {
    const idx = maps.indexOf(current);
    return maps[(idx + 1) % maps.length];
}

let showNextLevelBtn = false;

function drawNextLevelButton() {
    if (!showNextLevelBtn) return;
    ctx.save();
    ctx.globalAlpha = 1;
    ctx.beginPath();
    ctx.roundRect(canvas.width/2 - 90, canvas.height/2 + 40, 180, 48, 16);
    ctx.fillStyle = '#fff0fa';
    ctx.fill();
    ctx.strokeStyle = '#e6007a';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.font = "bold 22px 'Pacifico', cursive";
    ctx.fillStyle = '#e6007a';
    ctx.textAlign = 'center';
    ctx.fillText('Next Level', canvas.width/2, canvas.height/2 + 72);
    ctx.textAlign = 'start';
    ctx.restore();
}

function draw() {
    drawMapBackground();
    drawFan();
    drawBomb();
    drawCups();
    drawBall();
    drawScoreboard();
    drawMapDetails();
    drawTimer();
    drawNextLevelButton();
    ctx.fillStyle = '#e6007a';
    ctx.font = '20px Arial';
    ctx.fillText(`Cups hit: ${score}/${DIFFICULTY_SETTINGS[currentDifficulty].cupCount}`, 20, 40);
    // Draw wind info
    ctx.font = '18px Arial';
    ctx.fillStyle = '#ff69b4';
    ctx.fillText(`Fan (wind): ${wind > 0 ? '+' : ''}${wind.toFixed(2)}`, 20, 100);
    if (score === DIFFICULTY_SETTINGS[currentDifficulty].cupCount) {
        ctx.font = '32px Arial';
        ctx.fillStyle = '#e6007a';
        ctx.fillText('You Win!', canvas.width / 2 - 70, canvas.height / 2);
        showNextLevelBtn = true;
    } else {
        showNextLevelBtn = false;
    }
}

canvas.addEventListener('mousedown', (e) => {
    if (showNextLevelBtn) {
        const mx = e.offsetX, my = e.offsetY;
        if (
            mx >= canvas.width/2 - 90 && mx <= canvas.width/2 + 90 &&
            my >= canvas.height/2 + 40 && my <= canvas.height/2 + 88
        ) {
            // Go to next map
            currentMap = getNextMap(currentMap);
            resetGame();
            showNextLevelBtn = false;
            return;
        }
    }
    // Remove aim/drag logic and use click-to-aim
    if (!ball.moving && score < 10) {
        // Set wind for this throw: random between -0.5 and 0.5 (stronger)
        wind = (Math.random() - 0.5) * 1.0;
        const target = getMousePos(e);
        let dx = target.x - ball.x;
        let dy = target.y - ball.y;
        // Add random angle deviation (simulate inaccuracy)
        const angle = Math.atan2(dy, dx);
        const deviation = (Math.random() - 0.5) * DIFFICULTY_SETTINGS[currentDifficulty].deviation;
        const speed = throwSpeed;
        const newAngle = angle + deviation;
        dx = Math.cos(newAngle) * speed;
        dy = Math.sin(newAngle) * speed;
        ball.vx = dx;
        ball.vy = dy;
        ball.moving = true;
    }
});
// Remove mousemove and mouseup listeners

function getMousePos(evt) {
    const rect = canvas.getBoundingClientRect();
    return {
        x: (evt.clientX - rect.left) * (canvas.width / rect.width),
        y: (evt.clientY - rect.top) * (canvas.height / rect.height)
    };
}

let frameCount = 0;
function gameLoop() {
    frameCount++;
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

function resetGame() {
    setupCups();
    score = 0;
    resetBall();
    resetBomb();
    if (timedMode) {
        timeLeft = 60;
        timerActive = true;
    } else {
        timerActive = false;
    }
}

// Difficulty menu logic
const menu = document.getElementById('difficulty-menu');
const select = document.getElementById('difficulty');
const mapSelect = document.getElementById('map');
const throwSpeedSlider = document.getElementById('throwSpeed');
const throwSpeedValue = document.getElementById('throwSpeedValue');
let throwSpeed = 15;

throwSpeedSlider.oninput = function() {
    throwSpeed = parseInt(throwSpeedSlider.value);
    throwSpeedValue.textContent = throwSpeed;
};
throwSpeed = parseInt(throwSpeedSlider.value);

const startBtn = document.getElementById('start-btn');
canvas.style.display = 'none';
menu.style.display = 'flex';

startBtn.onclick = function() {
    currentDifficulty = select.value;
    currentMap = mapSelect.value;
    throwSpeed = parseInt(throwSpeedSlider.value);
    timedMode = timedModeCheckbox.checked;
    menu.style.display = 'none';
    canvas.style.display = 'block';
    resetGame();
};

// Start game loop only once
let started = false;
function startLoopOnce() {
    if (!started) {
        started = true;
        gameLoop();
    }
}
startLoopOnce();
