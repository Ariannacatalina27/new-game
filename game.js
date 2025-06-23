// --- PYRAMID OF CUPS ---
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const CUP_RADIUS = 28;
const BALL_RADIUS = 12;
let cups = [];
let ball = { x: canvas.width / 2, y: canvas.height - 60, vx: 0, vy: 0, moving: false };

// Add wind and fan variables
let wind = 0; // wind strength
let fanAngle = 0; // for animating the fan

// Add aiming and shooting logic
let aimAngle = -Math.PI / 2; // Default aim straight up
let leverPower = 0; // Power of the pull lever
let leverPulling = false;
const LEVER_POWER_MIN = 8;
const LEVER_POWER_MAX = 44;

// Remove Aim & Throw button logic

canvas.addEventListener('mousedown', (e) => {
    if (!ball.moving && cups.some(c => !c.hit)) {
        const rect = canvas.getBoundingClientRect();
        aimTarget = {
            x: (e.clientX - rect.left) * (canvas.width / rect.width),
            y: (e.clientY - rect.top) * (canvas.height / rect.height)
        };
        aimBtn.style.display = 'inline-block';
    } else if (cups.every(c => c.hit)) {
        resetGame();
    }
});

// Mouse movement sets aim direction
canvas.addEventListener('mousemove', (e) => {
    if (!ball.moving && cups.some(c => !c.hit)) {
        const rect = canvas.getBoundingClientRect();
        const mx = (e.clientX - rect.left) * (canvas.width / rect.width);
        const my = (e.clientY - rect.top) * (canvas.height / rect.height);
        aimAngle = Math.atan2(my - ball.y, mx - ball.x);
    }
});

// Spacebar pull lever mechanic
// Hold spacebar to pull, release to shoot

document.addEventListener('keydown', (e) => {
    if (e.code === 'Space' && !ball.moving && cups.some(c => !c.hit)) {
        if (!leverPulling) {
            leverPulling = true;
            leverPower = LEVER_POWER_MIN;
        }
        e.preventDefault();
    }
});
document.addEventListener('keyup', (e) => {
    if (e.code === 'Space' && leverPulling && !ball.moving && cups.some(c => !c.hit)) {
        shootBall();
        leverPulling = false;
        e.preventDefault();
    }
});

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

// Draw lever/arrow showing power
function drawLever() {
    if (!ball.moving && cups.some(c => !c.hit)) {
        ctx.save();
        // Draw lever base (circle at ball)
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, 18, 0, Math.PI * 2);
        ctx.fillStyle = '#e6007a22';
        ctx.fill();
        ctx.strokeStyle = '#e6007a';
        ctx.lineWidth = 3;
        ctx.stroke();
        // Draw lever shaft
        ctx.strokeStyle = '#00aaff';
        ctx.lineWidth = 6;
        ctx.setLineDash([10, 8]);
        const len = 40 + (leverPower - LEVER_POWER_MIN) * 7;
        const ex = ball.x + Math.cos(aimAngle) * len;
        const ey = ball.y + Math.sin(aimAngle) * len;
        ctx.beginPath();
        ctx.moveTo(ball.x, ball.y);
        ctx.lineTo(ex, ey);
        ctx.stroke();
        ctx.setLineDash([]);
        // Draw lever handle (circle at end)
        ctx.beginPath();
        ctx.arc(ex, ey, 13, 0, Math.PI * 2);
        ctx.fillStyle = leverPulling ? '#00aaff' : '#fff';
        ctx.globalAlpha = 0.85;
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.strokeStyle = '#00aaff';
        ctx.lineWidth = 3;
        ctx.stroke();
        // Draw arrowhead
        ctx.beginPath();
        ctx.moveTo(ex, ey);
        ctx.lineTo(ex - 16 * Math.cos(aimAngle - 0.3), ey - 16 * Math.sin(aimAngle - 0.3));
        ctx.moveTo(ex, ey);
        ctx.lineTo(ex - 16 * Math.cos(aimAngle + 0.3), ey - 16 * Math.sin(aimAngle + 0.3));
        ctx.strokeStyle = '#00aaff';
        ctx.lineWidth = 3;
        ctx.stroke();
        // Draw power bar at bottom
        const barW = 220, barH = 18;
        const barX = (canvas.width - barW) / 2, barY = canvas.height - 38;
        ctx.save();
        ctx.beginPath();
        ctx.roundRect(barX, barY, barW, barH, 9);
        ctx.fillStyle = '#fff0fa';
        ctx.fill();
        ctx.strokeStyle = '#e6007a';
        ctx.lineWidth = 2;
        ctx.stroke();
        // Fill power
        const pct = (leverPower - LEVER_POWER_MIN) / (LEVER_POWER_MAX - LEVER_POWER_MIN);
        ctx.beginPath();
        ctx.roundRect(barX + 3, barY + 3, (barW - 6) * pct, barH - 6, 6);
        ctx.fillStyle = '#00aaff';
        ctx.globalAlpha = 0.7;
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.restore();
        // Power text
        ctx.font = 'bold 15px Quicksand, Arial';
        ctx.fillStyle = '#e6007a';
        ctx.fillText('Power', barX + barW / 2 - 24, barY + barH - 4);
        ctx.restore();
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawFan();
    drawCups();
    drawBall();
    drawLever();
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
    if (!ball.moving && cups.some(c => !c.hit)) {
        const speed = leverPower;
        const dx = Math.cos(aimAngle) * speed;
        const dy = Math.sin(aimAngle) * speed;
        wind = (Math.random() - 0.5) * 1.2; // wind between -0.6 and 0.6
        ball.vx = dx;
        ball.vy = dy;
        ball.moving = true;
        leverPower = LEVER_POWER_MIN;
    }
}

function resetGame() {
    setupCups();
    ball = { x: canvas.width / 2, y: canvas.height - 60, vx: 0, vy: 0, moving: false };
    leverPower = LEVER_POWER_MIN;
    leverPulling = false;
}

// Menu logic
document.addEventListener('DOMContentLoaded', function() {
    const menu = document.getElementById('difficulty-menu');
    const startBtn = document.getElementById('start-btn');
    const restartBtn = document.getElementById('restart-btn');
    const canvas = document.getElementById('gameCanvas');

    canvas.width = 600;
    canvas.height = 600;
    canvas.style.display = 'none';
    menu.style.display = 'flex';

    startBtn.onclick = function() {
        menu.style.display = 'none';
        canvas.style.display = 'block';
        if (typeof resetGame === 'function') resetGame();
    };

    restartBtn.onclick = function() {
        if (typeof resetGame === 'function') resetGame();
    };
});

gameLoop();
