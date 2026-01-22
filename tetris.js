// Tetris Game Implementation

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const nextCanvas = document.getElementById('nextCanvas');
const nextCtx = nextCanvas.getContext('2d');
const holdCanvas = document.getElementById('holdCanvas');
const holdCtx = holdCanvas.getContext('2d');

// Game constants
const COLS = 10;
const ROWS = 20;
const BLOCK_SIZE = 30;
const PREVIEW_BLOCK_SIZE = 20;

// Colors for tetrominoes
const COLORS = {
    I: '#00f5ff',
    O: '#ffeb3b',
    T: '#9c27b0',
    S: '#4caf50',
    Z: '#f44336',
    J: '#2196f3',
    L: '#ff9800'
};

// Tetromino shapes
const SHAPES = {
    I: [
        [[0, 0, 0, 0], [1, 1, 1, 1], [0, 0, 0, 0], [0, 0, 0, 0]],
        [[0, 0, 1, 0], [0, 0, 1, 0], [0, 0, 1, 0], [0, 0, 1, 0]],
        [[0, 0, 0, 0], [0, 0, 0, 0], [1, 1, 1, 1], [0, 0, 0, 0]],
        [[0, 1, 0, 0], [0, 1, 0, 0], [0, 1, 0, 0], [0, 1, 0, 0]]
    ],
    O: [
        [[1, 1], [1, 1]],
        [[1, 1], [1, 1]],
        [[1, 1], [1, 1]],
        [[1, 1], [1, 1]]
    ],
    T: [
        [[0, 1, 0], [1, 1, 1], [0, 0, 0]],
        [[0, 1, 0], [0, 1, 1], [0, 1, 0]],
        [[0, 0, 0], [1, 1, 1], [0, 1, 0]],
        [[0, 1, 0], [1, 1, 0], [0, 1, 0]]
    ],
    S: [
        [[0, 1, 1], [1, 1, 0], [0, 0, 0]],
        [[0, 1, 0], [0, 1, 1], [0, 0, 1]],
        [[0, 0, 0], [0, 1, 1], [1, 1, 0]],
        [[1, 0, 0], [1, 1, 0], [0, 1, 0]]
    ],
    Z: [
        [[1, 1, 0], [0, 1, 1], [0, 0, 0]],
        [[0, 0, 1], [0, 1, 1], [0, 1, 0]],
        [[0, 0, 0], [1, 1, 0], [0, 1, 1]],
        [[0, 1, 0], [1, 1, 0], [1, 0, 0]]
    ],
    J: [
        [[1, 0, 0], [1, 1, 1], [0, 0, 0]],
        [[0, 1, 1], [0, 1, 0], [0, 1, 0]],
        [[0, 0, 0], [1, 1, 1], [0, 0, 1]],
        [[0, 1, 0], [0, 1, 0], [1, 1, 0]]
    ],
    L: [
        [[0, 0, 1], [1, 1, 1], [0, 0, 0]],
        [[0, 1, 0], [0, 1, 0], [0, 1, 1]],
        [[0, 0, 0], [1, 1, 1], [1, 0, 0]],
        [[1, 1, 0], [0, 1, 0], [0, 1, 0]]
    ]
};

// Game state
let board = [];
let currentPiece = null;
let nextPiece = null;
let holdPiece = null;
let canHold = true;
let score = 0;
let level = 1;
let lines = 0;
let gameOver = false;
let paused = false;
let dropInterval = 1000;
let lastDrop = 0;
let animationId = null;

// Initialize the board
function createBoard() {
    board = [];
    for (let row = 0; row < ROWS; row++) {
        board[row] = [];
        for (let col = 0; col < COLS; col++) {
            board[row][col] = 0;
        }
    }
}

// Piece class
class Piece {
    constructor(type) {
        this.type = type;
        this.color = COLORS[type];
        this.rotationState = 0;
        this.shape = SHAPES[type][0];
        this.x = Math.floor(COLS / 2) - Math.floor(this.shape[0].length / 2);
        this.y = 0;
    }

    rotate() {
        this.rotationState = (this.rotationState + 1) % 4;
        this.shape = SHAPES[this.type][this.rotationState];
    }

    rotateBack() {
        this.rotationState = (this.rotationState + 3) % 4;
        this.shape = SHAPES[this.type][this.rotationState];
    }
}

// Get random piece
function getRandomPiece() {
    const types = Object.keys(SHAPES);
    const randomType = types[Math.floor(Math.random() * types.length)];
    return new Piece(randomType);
}

// Check collision
function checkCollision(piece, offsetX = 0, offsetY = 0) {
    for (let row = 0; row < piece.shape.length; row++) {
        for (let col = 0; col < piece.shape[row].length; col++) {
            if (piece.shape[row][col]) {
                const newX = piece.x + col + offsetX;
                const newY = piece.y + row + offsetY;

                if (newX < 0 || newX >= COLS || newY >= ROWS) {
                    return true;
                }

                if (newY >= 0 && board[newY][newX]) {
                    return true;
                }
            }
        }
    }
    return false;
}

// Lock piece to board
function lockPiece() {
    for (let row = 0; row < currentPiece.shape.length; row++) {
        for (let col = 0; col < currentPiece.shape[row].length; col++) {
            if (currentPiece.shape[row][col]) {
                const boardY = currentPiece.y + row;
                const boardX = currentPiece.x + col;

                if (boardY < 0) {
                    gameOver = true;
                    showGameOver();
                    return;
                }

                board[boardY][boardX] = currentPiece.color;
            }
        }
    }

    clearLines();
    spawnPiece();
}

// Clear completed lines
function clearLines() {
    let linesCleared = 0;

    for (let row = ROWS - 1; row >= 0; row--) {
        let isComplete = true;

        for (let col = 0; col < COLS; col++) {
            if (!board[row][col]) {
                isComplete = false;
                break;
            }
        }

        if (isComplete) {
            board.splice(row, 1);
            board.unshift(new Array(COLS).fill(0));
            linesCleared++;
            row++;
        }
    }

    if (linesCleared > 0) {
        updateScore(linesCleared);
    }
}

// Update score
function updateScore(linesCleared) {
    const points = [0, 100, 300, 500, 800];
    score += points[linesCleared] * level;
    lines += linesCleared;

    // Level up every 10 lines
    const newLevel = Math.floor(lines / 10) + 1;
    if (newLevel > level) {
        level = newLevel;
        dropInterval = Math.max(100, 1000 - (level - 1) * 100);
    }

    updateDisplay();
}

// Update display
function updateDisplay() {
    document.getElementById('score').textContent = score;
    document.getElementById('level').textContent = level;
    document.getElementById('lines').textContent = lines;
}

// Spawn new piece
function spawnPiece() {
    currentPiece = nextPiece || getRandomPiece();
    nextPiece = getRandomPiece();
    canHold = true;

    if (checkCollision(currentPiece)) {
        gameOver = true;
        showGameOver();
    }

    drawNextPiece();
}

// Hold piece
function holdCurrentPiece() {
    if (!canHold) return;

    canHold = false;

    if (holdPiece) {
        const temp = holdPiece;
        holdPiece = new Piece(currentPiece.type);
        currentPiece = new Piece(temp.type);
    } else {
        holdPiece = new Piece(currentPiece.type);
        currentPiece = nextPiece;
        nextPiece = getRandomPiece();
    }

    drawHoldPiece();
    drawNextPiece();
}

// Move piece
function movePiece(dir) {
    if (gameOver || paused) return;

    if (!checkCollision(currentPiece, dir, 0)) {
        currentPiece.x += dir;
    }
}

// Drop piece
function dropPiece() {
    if (gameOver || paused) return;

    if (!checkCollision(currentPiece, 0, 1)) {
        currentPiece.y++;
    } else {
        lockPiece();
    }
}

// Hard drop
function hardDrop() {
    if (gameOver || paused) return;

    while (!checkCollision(currentPiece, 0, 1)) {
        currentPiece.y++;
        score += 2;
    }
    lockPiece();
    updateDisplay();
}

// Rotate piece
function rotatePiece() {
    if (gameOver || paused) return;

    currentPiece.rotate();

    // Wall kick
    if (checkCollision(currentPiece)) {
        // Try moving left
        if (!checkCollision(currentPiece, -1, 0)) {
            currentPiece.x--;
        }
        // Try moving right
        else if (!checkCollision(currentPiece, 1, 0)) {
            currentPiece.x++;
        }
        // Try moving left 2
        else if (!checkCollision(currentPiece, -2, 0)) {
            currentPiece.x -= 2;
        }
        // Try moving right 2
        else if (!checkCollision(currentPiece, 2, 0)) {
            currentPiece.x += 2;
        }
        // Revert rotation
        else {
            currentPiece.rotateBack();
        }
    }
}

// Get ghost piece position
function getGhostY() {
    let ghostY = currentPiece.y;
    while (!checkCollision(currentPiece, 0, ghostY - currentPiece.y + 1)) {
        ghostY++;
    }
    return ghostY;
}

// Draw functions
function drawBlock(context, x, y, color, blockSize = BLOCK_SIZE, isGhost = false) {
    const padding = 1;

    if (isGhost) {
        context.fillStyle = 'rgba(255, 255, 255, 0.2)';
        context.strokeStyle = color;
        context.lineWidth = 2;
        context.fillRect(
            x * blockSize + padding,
            y * blockSize + padding,
            blockSize - padding * 2,
            blockSize - padding * 2
        );
        context.strokeRect(
            x * blockSize + padding,
            y * blockSize + padding,
            blockSize - padding * 2,
            blockSize - padding * 2
        );
    } else {
        // Main block
        context.fillStyle = color;
        context.fillRect(
            x * blockSize + padding,
            y * blockSize + padding,
            blockSize - padding * 2,
            blockSize - padding * 2
        );

        // Highlight
        context.fillStyle = 'rgba(255, 255, 255, 0.3)';
        context.fillRect(
            x * blockSize + padding,
            y * blockSize + padding,
            blockSize - padding * 2,
            (blockSize - padding * 2) / 4
        );

        // Shadow
        context.fillStyle = 'rgba(0, 0, 0, 0.3)';
        context.fillRect(
            x * blockSize + padding,
            y * blockSize + (blockSize - padding * 2) * 3 / 4 + padding,
            blockSize - padding * 2,
            (blockSize - padding * 2) / 4
        );
    }
}

function drawBoard() {
    // Clear canvas
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;

    for (let row = 0; row <= ROWS; row++) {
        ctx.beginPath();
        ctx.moveTo(0, row * BLOCK_SIZE);
        ctx.lineTo(canvas.width, row * BLOCK_SIZE);
        ctx.stroke();
    }

    for (let col = 0; col <= COLS; col++) {
        ctx.beginPath();
        ctx.moveTo(col * BLOCK_SIZE, 0);
        ctx.lineTo(col * BLOCK_SIZE, canvas.height);
        ctx.stroke();
    }

    // Draw locked pieces
    for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
            if (board[row][col]) {
                drawBlock(ctx, col, row, board[row][col]);
            }
        }
    }
}

function drawPiece() {
    if (!currentPiece) return;

    // Draw ghost piece
    const ghostY = getGhostY();
    for (let row = 0; row < currentPiece.shape.length; row++) {
        for (let col = 0; col < currentPiece.shape[row].length; col++) {
            if (currentPiece.shape[row][col]) {
                drawBlock(ctx, currentPiece.x + col, ghostY + row, currentPiece.color, BLOCK_SIZE, true);
            }
        }
    }

    // Draw current piece
    for (let row = 0; row < currentPiece.shape.length; row++) {
        for (let col = 0; col < currentPiece.shape[row].length; col++) {
            if (currentPiece.shape[row][col]) {
                drawBlock(ctx, currentPiece.x + col, currentPiece.y + row, currentPiece.color);
            }
        }
    }
}

function drawPreviewPiece(context, piece) {
    context.fillStyle = 'rgba(0, 0, 0, 0.5)';
    context.fillRect(0, 0, 100, 100);

    if (!piece) return;

    const shape = SHAPES[piece.type][0];
    const offsetX = (100 - shape[0].length * PREVIEW_BLOCK_SIZE) / 2;
    const offsetY = (100 - shape.length * PREVIEW_BLOCK_SIZE) / 2;

    for (let row = 0; row < shape.length; row++) {
        for (let col = 0; col < shape[row].length; col++) {
            if (shape[row][col]) {
                const x = offsetX / PREVIEW_BLOCK_SIZE + col;
                const y = offsetY / PREVIEW_BLOCK_SIZE + row;
                drawBlock(context, x, y, COLORS[piece.type], PREVIEW_BLOCK_SIZE);
            }
        }
    }
}

function drawNextPiece() {
    drawPreviewPiece(nextCtx, nextPiece);
}

function drawHoldPiece() {
    drawPreviewPiece(holdCtx, holdPiece);
}

// Game loop
function gameLoop(timestamp) {
    if (gameOver) return;

    if (!paused) {
        if (timestamp - lastDrop > dropInterval) {
            dropPiece();
            lastDrop = timestamp;
        }

        drawBoard();
        drawPiece();
    }

    animationId = requestAnimationFrame(gameLoop);
}

// Toggle pause
function togglePause() {
    if (gameOver) return;

    paused = !paused;
    document.getElementById('pauseOverlay').classList.toggle('hidden', !paused);
}

// Show game over
function showGameOver() {
    document.getElementById('finalScore').textContent = score;
    document.getElementById('gameOver').classList.remove('hidden');
    cancelAnimationFrame(animationId);
}

// Reset game
function resetGame() {
    createBoard();
    score = 0;
    level = 1;
    lines = 0;
    gameOver = false;
    paused = false;
    dropInterval = 1000;
    lastDrop = 0;
    holdPiece = null;
    canHold = true;

    updateDisplay();
    document.getElementById('gameOver').classList.add('hidden');
    document.getElementById('pauseOverlay').classList.add('hidden');

    drawHoldPiece();
    spawnPiece();
    animationId = requestAnimationFrame(gameLoop);
}

// Keyboard controls
document.addEventListener('keydown', (e) => {
    if (gameOver && e.key !== 'Enter') return;

    switch (e.key) {
        case 'ArrowLeft':
            movePiece(-1);
            break;
        case 'ArrowRight':
            movePiece(1);
            break;
        case 'ArrowDown':
            dropPiece();
            score += 1;
            updateDisplay();
            break;
        case 'ArrowUp':
            rotatePiece();
            break;
        case ' ':
            e.preventDefault();
            hardDrop();
            break;
        case 'c':
        case 'C':
            holdCurrentPiece();
            break;
        case 'p':
        case 'P':
            togglePause();
            break;
        case 'Enter':
            if (gameOver) {
                resetGame();
            }
            break;
    }
});

// Restart button
document.getElementById('restartBtn').addEventListener('click', resetGame);

// Start the game
resetGame();
