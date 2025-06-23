// --- PYRAMID OF CUPS ---
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const CUP_RADIUS = 28;
const BALL_RADIUS = 12;
let cups = [];
let ball = { x: canvas.width / 2, y: canvas.height - 60, vx: 0, vy: 0, moving: false };
let aimTarget = null;

// Add wind and fan variables
let wind = 0; // wind strength
let fanAngle = 0; // for animating the fan

// Add an Aim & Throw button to the UI
const aimBtn = document.createElement('button');
aimBtn.id = 'aim-btn';
aimBtn.textContent = 'Aim & Throw';
aimBtn.style.fontFamily = "'Pacifico', cursive";
aimBtn.style.fontSize = '1.1em';
aimBtn.style.marginLeft = '10px';
aimBtn.style.display = 'none';
document.getElementById('difficulty-menu').appendChild(aimBtn);

function setupCups() {
    cups = [];
    let rows = 3;
    let startY = 120;
    let spacing = 8;
    for (let row = 0; row < rows; row++) {
        let cupsInRow = row + 1;
        let rowWidth = cupsInRow * CUP_RADIUS * 2 + (cupsInRow - 1) * spacing;
        let xStart = (canvas.width - rowWidth) / 2 + CUP_RADIUS;
        for (let i = 0; i < cupsInRow; i++) {
            cups.push({
                x: xStart + i * (CUP_RADIUS * 2 + spacing),
                y: startY + row * (CUP_RADIUS * 2 + spacing),
                hit: false
            });
        }
    }
}

function drawCups() {
    for (const cup of cups) {
        if (cup.hit) continue;
        ctx.save();
        ctx.beginPath();
        ctx.arc(cup.x, cup.y, CUP_RADIUS, 0, Math.PI * 2);
        ctx.fillStyle = '#d32f2f';
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 4;
        ctx.stroke();
        ctx.restore();
    }
}

function drawBall() {
    ctx.save();
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, BALL_RADIUS, 0, Math.PI * 2);
    ctx.fillStyle = '#e6007a';
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
}

// Add wind to ball physics
function update() {
    if (ball.moving) {
        ball.x += ball.vx;
        ball.y += ball.vy;
        ball.vx += wind * 0.08; // wind effect
        ball.vy += 0.25; // gravity
        // Bounce off floor
        if (ball.y > canvas.height - BALL_RADIUS) {
            ball.y = canvas.height - BALL_RADIUS;
            ball.vy *= -0.4;
            ball.vx *= 0.7;
            if (Math.abs(ball.vy) < 1) {
                ball.moving = false;
                // After the shot, return ball to starting spot
                setTimeout(() => {
                    if (cups.some(c => !c.hit)) {
                        ball.x = canvas.width / 2;
                        ball.y = canvas.height - 60;
                        ball.vx = 0;
                        ball.vy = 0;
                        ball.moving = false;
                    }
                }, 500);
            }
        }
        // Bounce off walls
        if (ball.x < BALL_RADIUS) {
            ball.x = BALL_RADIUS;
            ball.vx *= -0.7;
        }
        if (ball.x > canvas.width - BALL_RADIUS) {
            ball.x = canvas.width - BALL_RADIUS;
            ball.vx *= -0.7;
        }
        // Check for cup hit
        for (const cup of cups) {
            if (!cup.hit) {
                const dx = ball.x - cup.x;
                const dy = ball.y - cup.y;
                const dist = Math.sqrt(dx*dx + dy*dy);
                if (dist < CUP_RADIUS + BALL_RADIUS) {
                    cup.hit = true;
                    ball.moving = false;
                    // After the shot, return ball to starting spot
                    setTimeout(() => {
                        if (cups.some(c => !c.hit)) {
                            ball.x = canvas.width / 2;
                            ball.y = canvas.height - 60;
                            ball.vx = 0;
                            ball.vy = 0;
                            ball.moving = false;
                        }
                    }, 500);
                }
            }
        }
    }
    fanAngle += 0.1;
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
        ctx.fillStyle = '#00aaff';
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

// Draw fan in draw()
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawFan();
    drawCups();
    drawBall();
    // Draw aim indicator if aiming
    if (aimTarget && !ball.moving && cups.some(c => !c.hit)) {
        ctx.save();
        ctx.strokeStyle = '#00aaff';
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 6]);
        ctx.beginPath();
        ctx.moveTo(ball.x, ball.y);
        ctx.lineTo(aimTarget.x, aimTarget.y);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.beginPath();
        ctx.arc(aimTarget.x, aimTarget.y, 12, 0, Math.PI * 2);
        ctx.strokeStyle = '#00aaff';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.restore();
    }
    ctx.font = '22px Arial';
    ctx.fillStyle = '#e6007a';
    if (cups.every(c => c.hit)) {
        ctx.font = '32px Arial';
        ctx.fillStyle = '#388e3c';
        ctx.fillText('You Win!', canvas.width / 2 - 60, canvas.height / 2);
        ctx.font = '18px Arial';
        ctx.fillStyle = '#e6007a';
        ctx.fillText('Click to play again', canvas.width / 2 - 70, canvas.height / 2 + 40);
    }
}

// Set wind randomly on each shot
function shootBall() {
    if (aimTarget && !ball.moving && cups.some(c => !c.hit)) {
        let dx = aimTarget.x - ball.x;
        let dy = aimTarget.y - ball.y;
        const angle = Math.atan2(dy, dx);
        const speed = 20; // Increased speed for faster shots
        dx = Math.cos(angle) * speed;
        dy = Math.sin(angle) * speed;
        wind = (Math.random() - 0.5) * 1.2; // wind between -0.6 and 0.6
        ball.vx = dx;
        ball.vy = dy;
        ball.moving = true;
        aimBtn.style.display = 'none';
        aimTarget = null;
    }
}

aimBtn.onclick = shootBall;
document.addEventListener('keydown', (e) => {
    if (e.code === 'Space' && aimTarget && !ball.moving && cups.some(c => !c.hit)) {
        shootBall();
        e.preventDefault();
    }
});

// Hide aim button on win or reset
function resetGame() {
    setupCups();
    ball = { x: canvas.width / 2, y: canvas.height - 60, vx: 0, vy: 0, moving: false };
    aimBtn.style.display = 'none';
    aimTarget = null;
}

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

// Menu logic
const menu = document.getElementById('difficulty-menu');
const startBtn = document.getElementById('start-btn');
const restartBtn = document.getElementById('restart-btn');
canvas.style.display = 'none';
menu.style.display = 'flex';

startBtn.onclick = function() {
    menu.style.display = 'none';
    canvas.style.display = 'block';
    resetGame();
};

restartBtn.onclick = function() {
    resetGame();
};

gameLoop();

window.onload = function() {
    // Ensure canvas size is set correctly for GitHub Pages
    canvas.width = 600;
    canvas.height = 600;
};
