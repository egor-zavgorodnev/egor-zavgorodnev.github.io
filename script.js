const mazeContainer = document.querySelector('.maze');
const message = document.querySelector('.message');
const timerDisplay = document.querySelector('.timer');
const scoresList = document.querySelector('.scores-list');

let maze = [];
let rows = 16;
let cols = 16;
let startCell, finishCell;
let isGameOver = false;
let isGameStarted = false;
let startTime = 0;
let timerInterval = null;
let highScores = JSON.parse(localStorage.getItem('highScores')) || [];

const directions = [
    { row: -1, col: 0 },
    { row: 1, col: 0 },
    { row: 0, col: -1 },
    { row: 0, col: 1 }
];

function initializeMaze() {
    maze = [];
    for (let row = 0; row < rows; row++) {
        maze[row] = [];
        for (let col = 0; col < cols; col++) {
            maze[row][col] = { row, col, walls: [true, true, true, true], visited: false };
        }
    }
}

function generateMaze(row, col) {
    const currentCell = maze[row][col];
    currentCell.visited = true;

    const shuffledDirections = directions.sort(() => Math.random() - 0.5);

    for (const dir of shuffledDirections) {
        const newRow = row + dir.row;
        const newCol = col + dir.col;

        if (newRow >= 0 && newRow < rows && newCol >= 0 && newCol < cols && !maze[newRow][newCol].visited) {
            if (dir.row === -1) {
                currentCell.walls[0] = false;
                maze[newRow][newCol].walls[2] = false;
            } else if (dir.row === 1) {
                currentCell.walls[2] = false;
                maze[newRow][newCol].walls[0] = false;
            } else if (dir.col === -1) {
                currentCell.walls[3] = false;
                maze[newRow][newCol].walls[1] = false;
            } else if (dir.col === 1) {
                currentCell.walls[1] = false;
                maze[newRow][newCol].walls[3] = false;
            }

            generateMaze(newRow, newCol);
        }
    }
}

function renderMaze() {
    mazeContainer.innerHTML = '';
    mazeContainer.style.gridTemplateColumns = `repeat(${cols}, 25px)`;
    mazeContainer.style.gridTemplateRows = `repeat(${rows}, 25px)`;

    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            const cell = document.createElement('div');
            cell.classList.add('cell');

            const walls = maze[row][col].walls;
            if (walls[0]) cell.style.borderTop = '1px solid #000';
            if (walls[1]) cell.style.borderRight = '1px solid #000';
            if (walls[2]) cell.style.borderBottom = '1px solid #000';
            if (walls[3]) cell.style.borderLeft = '1px solid #000';

            if (row === startCell.row && col === startCell.col) {
                cell.classList.add('start');
            } else if (row === finishCell.row && col === finishCell.col) {
                cell.classList.add('finish');
            }

            mazeContainer.appendChild(cell);
        }
    }

    const startButton = document.querySelector('.start');
    startButton.addEventListener('click', startGame);
}

function startGame() {
    if (!isGameStarted && !isGameOver) {
        isGameStarted = true;
        mazeContainer.classList.remove('lose', 'win');
        message.textContent = 'Игра началась! Проведите курсор через лабиринт.';
        const startButton = document.querySelector('.start');
        startButton.style.animation = 'none';

        startTime = Date.now();
        timerInterval = setInterval(updateTimer, 10);
    }
}

function updateTimer() {
    const currentTime = Date.now();
    const elapsedTime = (currentTime - startTime) / 1000;
    timerDisplay.textContent = `Время: ${elapsedTime.toFixed(2)}`;
}

function checkCollision(x, y) {
    if (isGameStarted && !isGameOver) {
        const cellSize = 25;
        const col = Math.floor(x / cellSize);
        const row = Math.floor(y / cellSize);

        if (row < 0 || row >= rows || col < 0 || col >= cols) {
            return true;
        }

        const cell = maze[row][col];
        if (cell.walls[0] && y % cellSize < 2) return true;
        if (cell.walls[1] && x % cellSize > cellSize - 2) return true;
        if (cell.walls[2] && y % cellSize > cellSize - 2) return true;
        if (cell.walls[3] && x % cellSize < 2) return true;
    }
    return false;
}

function checkWin(x, y) {
    if (isGameStarted && !isGameOver) {
        const cellSize = 25;
        const col = Math.floor(x / cellSize);
        const row = Math.floor(y / cellSize);

        if (row === finishCell.row && col === finishCell.col) {
            isGameOver = true;
            mazeContainer.classList.add('win');
            message.textContent = 'Поздравляем! Вы прошли лабиринт! Нажмите R для рестарта.';

            clearInterval(timerInterval);
            const elapsedTime = (Date.now() - startTime) / 1000;
            saveHighScore(elapsedTime);
        }
    }
}

function saveHighScore(time) {
    highScores.push(time);
    highScores.sort((a, b) => a - b);
    if (highScores.length > 5) {
        highScores = highScores.slice(0, 5);
    }
    localStorage.setItem('highScores', JSON.stringify(highScores));
    updateHighScores();
}

function updateHighScores() {
    scoresList.innerHTML = '';
    highScores.forEach((score, index) => {
        const li = document.createElement('li');
        li.textContent = `${index + 1}. ${score.toFixed(2)} сек`;
        scoresList.appendChild(li);
    });
}

function restartGame() {
    isGameOver = false;
    isGameStarted = false;
    mazeContainer.classList.remove('lose', 'win');
    message.textContent = 'Нажмите на зеленый квадрат, чтобы начать!';
    clearInterval(timerInterval);
    timerDisplay.textContent = 'Время: 0.00';
    initializeMaze();
    generateMaze(0, 0);
    startCell = { row: 0, col: 0 };
    finishCell = { row: rows - 1, col: cols - 1 };
    renderMaze();
}

function initializeGame() {
    initializeMaze();
    generateMaze(0, 0);
    startCell = { row: 0, col: 0 };
    finishCell = { row: rows - 1, col: cols - 1 };
    renderMaze();
    updateHighScores();

    mazeContainer.addEventListener('mousemove', (event) => {
        if (isGameStarted) {
            const rect = mazeContainer.getBoundingClientRect();
            const x = event.clientX - rect.left;
            const y = event.clientY - rect.top;

            if (checkCollision(x, y)) {
                isGameOver = true;
                mazeContainer.classList.add('lose');
                message.textContent = 'Вы проиграли! Нажмите R для рестарта.';
                clearInterval(timerInterval);
            } else {
                checkWin(x, y);
            }
        }
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === 'r' || event.key === 'R') {
            restartGame();
        }
    });
}

window.onload = initializeGame;