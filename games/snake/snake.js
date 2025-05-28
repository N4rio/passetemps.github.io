const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreDisplay = document.getElementById('score');

const gridSize = 20; // La taille de chaque carré de la grille
const canvasSize = canvas.width; // 400
const tileCount = canvasSize / gridSize; // 400 / 20 = 20

let snake = [ // Le serpent commence avec 3 segments
    { x: 10, y: 10 }
];
let food = { x: 15, y: 15 };
let dx = 0; // Direction x
let dy = 0; // Direction y
let score = 0;
let changingDirection = false; // Pour éviter les demi-tours rapides
let gameEnded = false;
let gameSpeed = 150; // Millisecondes - plus bas = plus rapide

// Fonction principale du jeu (boucle)
function main() {
    if (gameEnded) {
        ctx.fillStyle = 'white';
        ctx.font = '50px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Game Over!', canvas.width / 2, canvas.height / 2);
        ctx.font = '20px Arial';
        ctx.fillText('Appuyez sur "Entrée" pour rejouer', canvas.width / 2, canvas.height / 2 + 40);
        return;
    }

    changingDirection = false;
    setTimeout(function onTick() {
        clearCanvas();
        drawFood();
        moveSnake();
        drawSnake();
        main(); // Rappelle la fonction main pour continuer la boucle
    }, gameSpeed);
}

function clearCanvas() {
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#111'; // Grille légère (optionnel)
    for(let i = 0; i < tileCount; i++) {
        ctx.beginPath();
        ctx.moveTo(i * gridSize, 0);
        ctx.lineTo(i * gridSize, canvasSize);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, i * gridSize);
        ctx.lineTo(canvasSize, i * gridSize);
        ctx.stroke();
    }
}

function drawSnakePart(snakePart) {
    ctx.fillStyle = 'lightgreen';
    ctx.strokeStyle = 'darkgreen';
    ctx.fillRect(snakePart.x * gridSize, snakePart.y * gridSize, gridSize, gridSize);
    ctx.strokeRect(snakePart.x * gridSize, snakePart.y * gridSize, gridSize, gridSize);
}

function drawSnake() {
    snake.forEach(drawSnakePart);
}

function drawFood() {
    ctx.fillStyle = 'red';
    ctx.strokeStyle = 'darkred';
    ctx.fillRect(food.x * gridSize, food.y * gridSize, gridSize, gridSize);
    ctx.strokeRect(food.x * gridSize, food.y * gridSize, gridSize, gridSize);
}

function moveSnake() {
    const head = { x: snake[0].x + dx, y: snake[0].y + dy };
    snake.unshift(head); // Ajoute la nouvelle tête

    // Vérifie si le serpent a mangé la nourriture
    const didEatFood = snake[0].x === food.x && snake[0].y === food.y;
    if (didEatFood) {
        score += 10;
        scoreDisplay.textContent = score;
        generateFood();
        // Augmente la vitesse (optionnel)
        // if(gameSpeed > 50) gameSpeed -= 5;
    } else {
        snake.pop(); // Retire la queue si pas mangé
    }

    // Vérifie les collisions
    checkGameOver();
}

function changeDirection(event) {
    if (changingDirection) return;
    changingDirection = true;

    const LEFT_KEY = 37;
    const RIGHT_KEY = 39;
    const UP_KEY = 38;
    const DOWN_KEY = 40;
    const ENTER_KEY = 13;


    const keyPressed = event.keyCode;
    const goingUp = dy === -1;
    const goingDown = dy === 1;
    const goingLeft = dx === -1;
    const goingRight = dx === 1;

    if (keyPressed === LEFT_KEY && !goingRight) {
        dx = -1;
        dy = 0;
    }
    if (keyPressed === UP_KEY && !goingDown) {
        dx = 0;
        dy = -1;
    }
    if (keyPressed === RIGHT_KEY && !goingLeft) {
        dx = 1;
        dy = 0;
    }
    if (keyPressed === DOWN_KEY && !goingUp) {
        dx = 0;
        dy = 1;
    }
    if (keyPressed === ENTER_KEY && gameEnded) {
        restartGame();
    }
}

function randomCoord(min, max) {
    return Math.floor(Math.random() * (max - min) + min);
}

function generateFood() {
    food.x = randomCoord(0, tileCount);
    food.y = randomCoord(0, tileCount);
    // S'assure que la nourriture n'apparaît pas sur le serpent
    snake.forEach(function isFoodOnSnake(part) {
        if (part.x === food.x && part.y === food.y) {
            generateFood();
        }
    });
}

function checkGameOver() {
    const head = snake[0];

    // Collision avec le mur
    const hitLeftWall = head.x < 0;
    const hitRightWall = head.x >= tileCount;
    const hitTopWall = head.y < 0;
    const hitBottomWall = head.y >= tileCount;

    if (hitLeftWall || hitRightWall || hitTopWall || hitBottomWall) {
        gameEnded = true;
        return;
    }

    // Collision avec soi-même
    for (let i = 4; i < snake.length; i++) {
        if (head.x === snake[i].x && head.y === snake[i].y) {
            gameEnded = true;
            return;
        }
    }
}

function restartGame() {
    snake = [{ x: 10, y: 10 }];
    food = { x: 15, y: 15 };
    dx = 0;
    dy = 0;
    score = 0;
    scoreDisplay.textContent = score;
    gameEnded = false;
    gameSpeed = 150;
    main(); // Relance la boucle de jeu
}


// Ajoute l'écouteur d'événements pour les touches
document.addEventListener('keydown', changeDirection);

// Démarre le jeu
generateFood(); // Génère la première nourriture
main();         // Lance la boucle principale