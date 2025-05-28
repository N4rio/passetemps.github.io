const canvas = document.getElementById('tetris');
const context = canvas.getContext('2d');
const nextCanvas = document.getElementById('next');
const nextContext = nextCanvas.getContext('2d');
const scoreElement = document.getElementById('score');

const ROWS = 20;
const COLS = 10;
const BLOCK_SIZE = 20;
const NEXT_BLOCK_SIZE = 20; // Block size for the 'next' canvas

context.scale(BLOCK_SIZE, BLOCK_SIZE);
nextContext.scale(NEXT_BLOCK_SIZE, NEXT_BLOCK_SIZE);

let score = 0;
let board = createBoard();
let player;
let nextPiece;
let gamePaused = false;

const COLORS = [
    null,
    '#FF0D72', // T
    '#0DC2FF', // O
    '#0DFF72', // L
    '#F538FF', // J
    '#FF8E0D', // I
    '#FFE138', // S
    '#3877FF', // Z
];

const SHAPES = [
    [], // 0
    [[0, 0, 0], [1, 1, 1], [0, 1, 0]], // T
    [[2, 2], [2, 2]],                   // O
    [[0, 3, 0], [0, 3, 0], [0, 3, 3]], // L
    [[0, 4, 0], [0, 4, 0], [4, 4, 0]], // J
    [[0, 5, 0, 0], [0, 5, 0, 0], [0, 5, 0, 0], [0, 5, 0, 0]], // I
    [[0, 6, 6], [6, 6, 0], [0, 0, 0]], // S
    [[7, 7, 0], [0, 7, 7], [0, 0, 0]], // Z
];

function createBoard() {
    return Array.from({ length: ROWS }, () => Array(COLS).fill(0));
}

function createPiece(type) {
    switch (type) {
        case 1: return SHAPES[1]; // T
        case 2: return SHAPES[2]; // O
        case 3: return SHAPES[3]; // L
        case 4: return SHAPES[4]; // J
        case 5: return SHAPES[5]; // I
        case 6: return SHAPES[6]; // S
        case 7: return SHAPES[7]; // Z
    }
}

function draw() {
    // Draw main board
    context.fillStyle = '#000';
    context.fillRect(0, 0, canvas.width, canvas.height);
    drawMatrix(board, { x: 0, y: 0 }, context);
    drawMatrix(player.matrix, player.pos, context);

    // Draw next piece
    nextContext.fillStyle = '#000';
    nextContext.fillRect(0, 0, nextCanvas.width, nextCanvas.height);
    drawMatrix(nextPiece.matrix, { x: 1, y: 1 }, nextContext, true); // Centered a bit
}

function drawMatrix(matrix, offset, ctx, isNext = false) {
    const size = isNext ? NEXT_BLOCK_SIZE / BLOCK_SIZE : 1;
    matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                ctx.fillStyle = COLORS[value];
                ctx.fillRect(
                    (x + offset.x) * size,
                    (y + offset.y) * size,
                    size, size
                );
                ctx.strokeStyle = '#000'; // Add a border for better visibility
                ctx.lineWidth = 0.1 * size;
                ctx.strokeRect(
                   (x + offset.x) * size,
                   (y + offset.y) * size,
                    size, size
                );
            }
        });
    });
}

function merge(board, player) {
    player.matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                board[y + player.pos.y][x + player.pos.x] = value;
            }
        });
    });
}

function rotate(matrix, dir) {
    for (let y = 0; y < matrix.length; ++y) {
        for (let x = 0; x < y; ++x) {
            [
                matrix[x][y],
                matrix[y][x],
            ] = [
                matrix[y][x],
                matrix[x][y],
            ];
        }
    }

    if (dir > 0) {
        matrix.forEach(row => row.reverse());
    } else {
        matrix.reverse();
    }
}

function playerRotate(dir) {
    const pos = player.pos.x;
    let offset = 1;
    rotate(player.matrix, dir);
    while (collide(board, player)) {
        player.pos.x += offset;
        offset = -(offset + (offset > 0 ? 1 : -1));
        if (offset > player.matrix[0].length) {
            rotate(player.matrix, -dir);
            player.pos.x = pos;
            return;
        }
    }
}

function playerMove(offset) {
    player.pos.x += offset;
    if (collide(board, player)) {
        player.pos.x -= offset;
    }
}

function playerDrop() {
    player.pos.y++;
    if (collide(board, player)) {
        player.pos.y--;
        merge(board, player);
        playerReset();
        boardSweep();
        updateScore();
    }
    dropCounter = 0;
}

function collide(board, player) {
    const [m, o] = [player.matrix, player.pos];
    for (let y = 0; y < m.length; ++y) {
        for (let x = 0; x < m[y].length; ++x) {
            if (m[y][x] !== 0 &&
               (board[y + o.y] &&
                board[y + o.y][x + o.x]) !== 0) {
                return true;
            }
        }
    }
    return false;
}

function boardSweep() {
    let rowCount = 1;
    outer: for (let y = board.length - 1; y > 0; --y) {
        for (let x = 0; x < board[y].length; ++x) {
            if (board[y][x] === 0) {
                continue outer;
            }
        }

        const row = board.splice(y, 1)[0].fill(0);
        board.unshift(row);
        ++y;

        score += rowCount * 10;
        rowCount *= 2;
    }
}

function playerReset() {
    player = nextPiece;
    player.pos.x = (COLS / 2 | 0) - (player.matrix[0].length / 2 | 0);
    player.pos.y = 0;

    nextPiece = {
        pos: { x: 0, y: 0 },
        matrix: createPiece(Math.floor(Math.random() * 7) + 1),
    };

    if (collide(board, player)) {
        // Game Over
        board = createBoard();
        score = 0;
        alert('Game Over! Score: ' + score);
    }
    updateScore();
}

function updateScore() {
    scoreElement.innerText = score;
}

let dropCounter = 0;
let dropInterval = 1000; // milliseconds
let lastTime = 0;

function update(time = 0) {
    if (gamePaused) {
        requestAnimationFrame(update);
        return;
    }
    const deltaTime = time - lastTime;
    lastTime = time;

    dropCounter += deltaTime;
    if (dropCounter > dropInterval) {
        playerDrop();
    }

    draw();
    requestAnimationFrame(update);
}

document.addEventListener('keydown', event => {
    if (gamePaused && event.key !== 'p' && event.key !== 'P') return;

    switch (event.key) {
        case 'ArrowLeft':
            playerMove(-1);
            break;
        case 'ArrowRight':
            playerMove(1);
            break;
        case 'ArrowDown':
            playerDrop();
            break;
        case 'ArrowUp': // Use ArrowUp for rotation
            playerRotate(1);
            break;
        case 'p':
        case 'P':
            gamePaused = !gamePaused;
            if (gamePaused) {
                 context.fillStyle = 'rgba(0, 0, 0, 0.5)';
                 context.fillRect(0, 0, canvas.width, canvas.height);
                 context.fillStyle = '#fff';
                 context.font = '1.5px Arial';
                 context.textAlign = 'center';
                 context.fillText('PAUSE', COLS / 2, ROWS / 2);
            }
            break;
    }
});

// Init
nextPiece = {
    pos: { x: 0, y: 0 },
    matrix: createPiece(Math.floor(Math.random() * 7) + 1),
};
playerReset();
updateScore();
update();