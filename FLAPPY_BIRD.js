var score = 0;
var keys = {}
var gameOverFlag = false;
var victory = false
var BIRD = {
    x: 80,
    y: 100,
    width: 110,
    height: 90,
    widthScaled: 110,
    heightScaled: 90,
    gapMinScaled: 120,
    img: new Image(),
    stepSize: 4,
    stepSizeScaled: 4
}
BIRD.img.src = "./Птичка.png"


var PIPE = {
    width: 80,
    widthScaled: 80,
    gap: 440,
    gapScaled: 500,
    speed: 3,
    speedScaled: 3,
    color: "green",
    pipes: [],
    imgTop: new Image(),
    imgBottom: new Image()
}
PIPE.imgTop.src = "./top-crystal.png"
PIPE.imgBottom.src = "./bottom-crystal.png"
var GAME = {
    width: 1700,
    height: 900,
    displayWidth: 1700,
    displayHeight: 900,
    fillcolor: "rgba(74, 170, 197, 1)",
    img: new Image()
}
GAME.img.src = "./Небо.png"

var canvas = document.createElement("canvas")
document.body.appendChild(canvas);


var canvasContext = canvas.getContext("2d")

let MIN_HEIGHT = 0
let MAX_HEIGHT = 810
const SMOOTHING = 0.7
let rms = 0
let isMicActive = false
let isResizing = false
let dpr = window.devicePixelRatio || 1

function drawBird() {
    if (BIRD.img.complete) {

        canvasContext.drawImage(BIRD.img, BIRD.x, BIRD.y, BIRD.widthScaled, BIRD.heightScaled);
    } else {
        canvasContext.fillStyle = "yellow";
        canvasContext.fillRect(BIRD.x, BIRD.y, BIRD.widthScaled, BIRD.heightScaled);
    }
}

function resizeCanvas() {

    if (isResizing) return;
    isResizing = true;

    setTimeout(() => {
        isResizing = false;
    }, 300);

    dpr = window.devicePixelRatio || 1;
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;

    const aspectRatio = GAME.width / GAME.height;
    let newWidth, newHeight;

    if (screenWidth / screenHeight > aspectRatio) {
        newHeight = screenHeight;
        newWidth = newHeight * aspectRatio;
    } else {
        newWidth = screenWidth;
        newHeight = newWidth / aspectRatio;
    }

    canvas.width = newWidth * dpr;
    canvas.height = newHeight * dpr;

    canvas.style.width = newWidth + 'px';
    canvas.style.height = newHeight + 'px';
    canvas.style.position = 'absolute';
    canvas.style.left = (screenWidth - newWidth) / 2 + 'px';
    canvas.style.top = (screenHeight - newHeight) / 2 + 'px';
    canvas.style.display = 'block';

    canvasContext.setTransform(1, 0, 0, 1, 0, 0);
    canvasContext.scale(dpr, dpr);

    GAME.displayWidth = newWidth;
    GAME.displayHeight = newHeight;

    calculateScaling();
    updateGameBounds();

    recalculateExistingPipes();
}

function updatePipeGaps() {
    for (var i = 0; i < PIPE.pipes.length; i++) {
        var pipe = PIPE.pipes[i];

        const minTopHeight = BIRD.heightScaled * 2;
        const minBottomHeight = BIRD.heightScaled * 2;
        const availableHeight = GAME.displayHeight - PIPE.gapScaled;

        const randomTopHeight = Math.random() * (availableHeight - minTopHeight) + minTopHeight;

        pipe.top.height = randomTopHeight;
        pipe.bottom.y = pipe.top.height + PIPE.gapScaled;
        pipe.bottom.height = GAME.displayHeight - pipe.bottom.y;

        if (pipe.bottom.height < minBottomHeight) {
            pipe.bottom.height = minBottomHeight;
            pipe.bottom.y = GAME.displayHeight - pipe.bottom.height;
            pipe.top.height = pipe.bottom.y - PIPE.gapScaled;
        }

        if (pipe.top.height < minTopHeight) {
            pipe.top.height = minTopHeight;
            pipe.bottom.y = pipe.top.height + PIPE.gapScaled;
            pipe.bottom.height = GAME.displayHeight - pipe.bottom.y;
        }
    }
}

function recalculateExistingPipes() {
    for (var i = 0; i < PIPE.pipes.length; i++) {
        var pipe = PIPE.pipes[i];

        const minTopHeight = BIRD.heightScaled * 2;
        const minBottomHeight = BIRD.heightScaled * 2;
        const maxTopHeight = GAME.displayHeight - PIPE.gapScaled - minBottomHeight;

        const totalHeight = GAME.displayHeight;
        const oldTotalHeight = 900; 

        let newTopHeight = pipe.top.height * (totalHeight / oldTotalHeight);


        if (newTopHeight < minTopHeight) {
            newTopHeight = minTopHeight;
        }
        if (newTopHeight > maxTopHeight) {
            newTopHeight = maxTopHeight;
        }

        pipe.top.height = newTopHeight;
        pipe.bottom.y = pipe.top.height + PIPE.gapScaled;
        pipe.bottom.height = GAME.displayHeight - pipe.bottom.y;

        if (pipe.bottom.height < minBottomHeight) {
            pipe.bottom.height = minBottomHeight;
            pipe.bottom.y = GAME.displayHeight - pipe.bottom.height;
            pipe.top.height = pipe.bottom.y - PIPE.gapScaled;

            if (pipe.top.height < minTopHeight) {
                pipe.top.height = minTopHeight;
            }
        }
    }
}

function updateGameBounds() {
    MIN_HEIGHT = 0;
    MAX_HEIGHT = GAME.displayHeight - BIRD.heightScaled;  
}

function calculateScaling() {
    const scaleX = GAME.displayWidth / GAME.width;
    const scaleY = GAME.displayHeight / GAME.height;
    const scale = (scaleX + scaleY) / 2;

    PIPE.widthScaled = Math.max(PIPE.width * scaleX, 40);

    const minGapByBird = BIRD.height * scaleY * 3;
    PIPE.gapScaled = Math.max(PIPE.gap * scaleY, minGapByBird);
    PIPE.gapMinScaled = minGapByBird;

    PIPE.speedScaled = PIPE.speed * scale;

    BIRD.widthScaled = BIRD.width * scaleX;
    BIRD.heightScaled = BIRD.height * scaleY;
    BIRD.stepSizeScaled = BIRD.stepSize * scale;

    const bottomEdge = GAME.displayHeight - BIRD.heightScaled;
    if (BIRD.y > bottomEdge) {
        BIRD.y = bottomEdge;
    }
}


function setupTextStyle() {
    canvasContext.font = "35px serif";
    canvasContext.fillStyle = "black";
    canvasContext.textAlign = "left";
    canvasContext.textBaseline = "top";
}

function drawScore() {
    setupTextStyle()
    canvasContext.font = "35px serif";
    canvasContext.fillStyle = "black";

    const x = 20;
    const y = 20;

    canvasContext.fillText("Cчёт: " + score, x, y);
}

function checkGameOver() {

    for (var i = 0; i < PIPE.pipes.length; i++) {
        if (checkCollision(PIPE.pipes[i])) {
            gameOverFlag = true;
            return;
        }
    }
}
function checkVictory() {
    if (score === 10) {
        victory = true
        return
    }
}

function drawTextWithWrap(text, x, y, maxWidth, fontSize, lineHeight) {
    const words = text.split(' ');
    const lines = [];
    let currentLine = '';

    for (const word of words) {
        const testLine = currentLine ? currentLine + ' ' + word : word;
        const metrics = canvasContext.measureText(testLine);
        const testWidth = metrics.width;

        if (testWidth > maxWidth && currentLine) {
            lines.push(currentLine);
            currentLine = word;
        } else {
            currentLine = testLine;
        }
    }
    lines.push(currentLine);

    lines.forEach((line, index) => {
        canvasContext.fillText(line, x, y + (index * lineHeight));
    });
}

function drawGameOver() {
    if (gameOverFlag) {
        const isMobile = window.innerWidth <= 768;
        const fontSize = isMobile ? 36 : Math.min(60, GAME.displayWidth / 12);
        const maxTextWidth = GAME.displayWidth * 0.8; // 80% ширины экрана
        const lineHeight = fontSize * 1.4;

        canvasContext.font = `${fontSize}px serif`;
        canvasContext.fillStyle = "black";
        canvasContext.textAlign = "center";

        const textY = GAME.displayHeight * 0.4; // Сдвигаем текст выше для лучшего баланса

        drawTextWithWrap("Игра окончена!", GAME.displayWidth / 2, textY, maxTextWidth, fontSize, lineHeight);
        drawTextWithWrap("Нажмите пробел, чтобы продолжить", GAME.displayWidth / 2, textY + lineHeight * 2, maxTextWidth, fontSize * 0.8, lineHeight * 0.9);
    }
}

function drawVictory() {
    if (victory) {
        const isMobile = window.innerWidth <= 768;
        const fontSize = isMobile ? 36 : Math.min(60, GAME.displayWidth / 12);
        const maxTextWidth = GAME.displayWidth * 0.8;
        const lineHeight = fontSize * 1.4;

        canvasContext.font = `${fontSize}px serif`;
        canvasContext.fillStyle = "black";
        canvasContext.textAlign = "center";

        const textY = GAME.displayHeight * 0.4;

        drawTextWithWrap("Победа!", GAME.displayWidth / 2, textY, maxTextWidth, fontSize, lineHeight);
        drawTextWithWrap("Нажмите пробел, чтобы продолжить", GAME.displayWidth / 2, textY + lineHeight * 2, maxTextWidth, fontSize * 0.8, lineHeight * 0.9);
    }
}

function updateBird() {
   
    if (keys["ArrowUp"] || keys["w"]) {
        BIRD.y -= BIRD.stepSizeScaled;
    }
    if (keys["ArrowDown"] || keys["s"]) {
        BIRD.y += BIRD.stepSizeScaled;
    }

    const topEdge = 0;
    const bottomEdge = GAME.displayHeight - BIRD.heightScaled;  

    if (BIRD.y < topEdge) {
        BIRD.y = topEdge;
    } else if (BIRD.y > bottomEdge) {
        BIRD.y = bottomEdge;
    }
}


function drawBackground() {
    if (GAME.img.complete) {
        canvasContext.drawImage(GAME.img, 0, 0, GAME.displayWidth, GAME.displayHeight);
    } else {

        canvasContext.fillStyle = GAME.fillcolor;
        canvasContext.fillRect(0, 0, GAME.displayWidth, GAME.displayHeight);
    }
}
function createPipe() {
    const minTopHeight = BIRD.heightScaled * 0.3;
    const minBottomHeight = BIRD.heightScaled * 0.3;
    const availableHeight = GAME.displayHeight - PIPE.gapScaled;

    var topHeight = Math.random() * (availableHeight - minTopHeight) + minTopHeight;
    var bottomHeight = GAME.displayHeight - PIPE.gapScaled - topHeight;
    if (bottomHeight < minBottomHeight) {
        bottomHeight = minBottomHeight;
        topHeight = GAME.displayHeight - PIPE.gapScaled - bottomHeight;
    }

    if (topHeight < minTopHeight) {
        topHeight = minTopHeight;
        bottomHeight = GAME.displayHeight - PIPE.gapScaled - topHeight;
    }

    PIPE.pipes.push({
        x: GAME.displayWidth,
        top: {
            y: 0,
            height: topHeight
        },
        bottom: {
            y: GAME.displayHeight - bottomHeight,
            height: bottomHeight
        }
    });
}

function drawPipe(pipe) {
    canvasContext.drawImage(
        PIPE.imgTop,
        pipe.x,
        pipe.top.y,
        PIPE.widthScaled,
        pipe.top.height
    );

    canvasContext.drawImage(
        PIPE.imgBottom,
        pipe.x,
        pipe.bottom.y,
        PIPE.widthScaled,
        pipe.bottom.height
    );
}

function updatePipes() {
    for (var i = 0; i < PIPE.pipes.length; i++) {
        var pipe = PIPE.pipes[i];
        pipe.x -= PIPE.speedScaled;

        if (pipe.x + PIPE.widthScaled < BIRD.x && !pipe.scored) {
            score++;
            pipe.scored = true;
        }

        if (pipe.x < -PIPE.widthScaled) {
            PIPE.pipes.splice(i, 1);
            i--;
        }
    }

    if (PIPE.pipes.length === 0 || PIPE.pipes[PIPE.pipes.length - 1].x < GAME.displayWidth - 650) {
        createPipe();
    }
}


function checkCollision(pipe) {
    if (BIRD.x + BIRD.widthScaled > pipe.x &&
        BIRD.x < pipe.x + PIPE.widthScaled &&
        BIRD.y < pipe.top.y + pipe.top.height) {
        return true;
    }

    if (BIRD.x + BIRD.widthScaled > pipe.x &&
        BIRD.x < pipe.x + PIPE.widthScaled &&
        BIRD.y + BIRD.heightScaled > pipe.bottom.y) {
        return true;
    }

    return false;
}


async function initMic() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        isMicActive = true;

        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const source = audioContext.createMediaStreamSource(stream);
        const analyser = audioContext.createAnalyser();

        analyser.fftSize = 2048;
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        source.connect(analyser);

        function updateAudio() {
            if (!isMicActive) return;

            analyser.getByteTimeDomainData(dataArray);

            let sum = 0;
            for (let i = 0; i < bufferLength; i++) {
                const v = (dataArray[i] - 128) / 128;
                sum += v * v;
            }
            const newRMS = Math.sqrt(sum / bufferLength);
            rms = rms * SMOOTHING + newRMS * (1 - SMOOTHING);

            const targetY = MAX_HEIGHT - (rms * MAX_HEIGHT * 8.0);
            const clampedTargetY = Math.max(MIN_HEIGHT, Math.min(MAX_HEIGHT, targetY));

            controlBirdByVolume(clampedTargetY);

            requestAnimationFrame(updateAudio);
        }

        updateAudio();

    } catch (err) {
        console.error("Ошибка микрофона:", err.message);
        isMicActive = false;
    }
}

function controlBirdByVolume(targetY) {
    const delta = targetY - BIRD.y;
    const step = delta * 0.1;

    BIRD.y += step;

    if (BIRD.y < MIN_HEIGHT) {
        BIRD.y = MIN_HEIGHT;
    } else if (BIRD.y > MAX_HEIGHT) {
        BIRD.y = MAX_HEIGHT;
    }
}

function gameOver() {
    isGameOver = true;
    document.getElementById('game').style.display = 'none';
    document.getElementById('gameOver').style.display = 'block';
}

function restartGame() {
    if (gameOverFlag || victory) {

        gameOverFlag = false;
        victory = false;
        score = 0;
        PIPE.pipes = [];
        BIRD.y = 100;

        canvasContext.clearRect(0, 0, GAME.displayWidth, GAME.displayHeight);
        // createPipe();
        requestAnimationFrame(play)
    }
}

window.addEventListener('keydown', function (e) {
    keys[e.key] = true;

    if (e.key === ' ' && (gameOverFlag || victory)) {
        restartGame();
    }
});

window.addEventListener('keyup', function (e) {
    keys[e.key] = false;
})

canvas.addEventListener('touchstart', function (e) {
    // Перезапуск при Game Over или Victory
    if (gameOverFlag || victory) {
        e.preventDefault(); // Предотвращаем стандартное поведение браузера
        restartGame();
    }
});

// Альтернативный способ: тап по любому месту экрана
document.addEventListener('touchstart', function (e) {
    // Проверяем, что это не текстовое поле или другой интерактивный элемент
    if ((gameOverFlag || victory) && e.target === canvas) {
        restartGame();
    }
});


//
function drawFrame() {
    canvasContext.clearRect(0, 0, GAME.displayWidth, GAME.displayHeight);
    drawBackground();

    for (var i = 0; i < PIPE.pipes.length; i++) {
        drawPipe(PIPE.pipes[i]);
    }

    drawBird();
    drawScore();
    if (!isResizing) {
        drawVictory();
        drawGameOver();
    }
}

function play() {
    if (gameOverFlag || victory) {
        return;
    }

    updatePipes();
    updateBird();
    checkVictory();
    checkGameOver();
    drawFrame();

    requestAnimationFrame(play);
}

window.addEventListener('keydown', function (e) {
    keys[e.key] = true;
    if (e.key === ' ' && (gameOver || victory)) {
        restartGame();
    }
});

window.addEventListener('keyup', function (e) {
    keys[e.key] = false;
});

BIRD.img.onload = function () {
    PIPE.imgTop.onload = function () {
        PIPE.imgBottom.onload = function () {
            resizeCanvas();
            updateGameBounds();

            initMic();
            // createPipe();
            play();
        }
    }
}


let resizeTimeout;
window.addEventListener('resize', function () {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
        resizeCanvas();
        updateGameBounds();
    }, 200);
});

if (BIRD.img.complete) {
    resizeCanvas();
    updateGameBounds();
    createPipe();
    play();
}
