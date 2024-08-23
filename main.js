document.addEventListener('DOMContentLoaded', (event) => {
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');

    function resizeCanvas() {
        const maxSize = Math.min(window.innerWidth * 0.9, window.innerHeight * 0.9);
        canvas.width = maxSize;
        canvas.height = maxSize;
        draw(); // Redraw the canvas after resizing
    }

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    const origin = { x: canvas.width / 2, y: canvas.height / 2 };
    let initialUnitVectorX = { x: 50, y: 0 };
    let initialUnitVectorY = { x: 0, y: -50 };
    let unitVectorX = { ...initialUnitVectorX };
    let unitVectorY = { ...initialUnitVectorY };

    let dragging = null;
    let moveCounter = 0;
    let gameWon = false;
    let gameStarted = false;
    let timer = null;
    let elapsedTime = 0;
    let isPaused = false;

    function getRandomPoint() {
        const min = -6;
        const max = 6;
        return { x: Math.floor(Math.random() * (max - min + 1)) + min, y: Math.floor(Math.random() * (max - min + 1)) + min };
    }

    function generateValidPoints() {
        let bluePoint, redPoint;
        do {
            bluePoint = getRandomPoint();
            redPoint = getRandomPoint();
        } while (bluePoint.x === redPoint.x && bluePoint.y === redPoint.y);
        return { bluePoint, redPoint };
    }

    let { bluePoint, redPoint } = generateValidPoints();

    function gridToCanvas(point) {
        return { x: origin.x + point.x * 50, y: origin.y - point.y * 50 };
    }

    function drawGrid() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.strokeStyle = 'lightgray';
        for (let i = -canvas.width / 2; i <= canvas.width / 2; i += 50) {
            ctx.beginPath();
            ctx.moveTo(origin.x + i, 0);
            ctx.lineTo(origin.x + i, canvas.height);
            ctx.stroke();
            ctx.closePath();
        }
        for (let j = -canvas.height / 2; j <= canvas.height / 2; j += 50) {
            ctx.beginPath();
            ctx.moveTo(0, origin.y - j);
            ctx.lineTo(canvas.width, origin.y - j);
            ctx.stroke();
            ctx.closePath();
        }
    }

    function drawAxes() {
        ctx.beginPath();
        ctx.moveTo(0, origin.y);
        ctx.lineTo(canvas.width, origin.y);
        ctx.strokeStyle = 'black';
        ctx.stroke();
        ctx.closePath();

        ctx.beginPath();
        ctx.moveTo(origin.x, 0);
        ctx.lineTo(origin.x, canvas.height);
        ctx.strokeStyle = 'black';
        ctx.stroke();
        ctx.closePath();
    }

    function drawArrow(start, end, color, label = '') {
        const headLength = 10;
        const dx = end.x - start.x;
        const dy = end.y - start.y;
        const angle = Math.atan2(dy, dx);

        ctx.beginPath();
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(end.x, end.y);
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.closePath();

        ctx.beginPath();
        ctx.moveTo(end.x, end.y);
        ctx.lineTo(end.x - headLength * Math.cos(angle - Math.PI / 6), end.y - headLength * Math.sin(angle - Math.PI / 6));
        ctx.lineTo(end.x - headLength * Math.cos(angle + Math.PI / 6), end.y - headLength * Math.sin(angle + Math.PI / 6));
        ctx.lineTo(end.x, end.y);
        ctx.lineTo(end.x - headLength * Math.cos(angle - Math.PI / 6), end.y - headLength * Math.sin(angle - Math.PI / 6));
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.fillStyle = color;
        ctx.fill();
        ctx.closePath();

        if (label) {
            ctx.font = '12px Arial';
            ctx.fillStyle = color;
            ctx.fillText(label, end.x + 5, end.y - 5);
        }
    }

    function drawPoints() {
        const redCanvasPoint = gridToCanvas(redPoint);
        ctx.beginPath();
        ctx.arc(redCanvasPoint.x, redCanvasPoint.y, 5, 0, Math.PI * 2);
        ctx.fillStyle = 'red';
        ctx.fill();
        ctx.closePath();

        const blueCanvasPoint = gridToCanvas(bluePoint);
        ctx.beginPath();
        ctx.arc(blueCanvasPoint.x, blueCanvasPoint.y, 5, 0, Math.PI * 2);
        ctx.fillStyle = 'blue';
        ctx.fill();
        ctx.closePath();
    }

    function draw() {
        drawGrid();
        drawAxes();
        drawArrow(origin, { x: origin.x + initialUnitVectorX.x, y: origin.y + initialUnitVectorX.y }, 'black', 'i');
        drawArrow(origin, { x: origin.x + initialUnitVectorY.x, y: origin.y + initialUnitVectorY.y }, 'black', 'j');

        drawArrow(origin, { x: origin.x + unitVectorX.x, y: origin.y + unitVectorX.y }, 'green', "i'");
        drawArrow(origin, { x: origin.x + unitVectorY.x, y: origin.y + unitVectorY.y }, 'green', "j'");
        drawPoints();
    }

    function isOnVector(point, vector) {
        const vectorPoint = { x: origin.x + vector.x, y: origin.y + vector.y };
        const distance = Math.sqrt((point.x - vectorPoint.x) ** 2 + (point.y - vectorPoint.y) ** 2);
        return distance < 10;
    }

    function handleMouseMove(event) {
        if (dragging && !isPaused) {
            const rect = canvas.getBoundingClientRect();
            const x = event.clientX - rect.left;
            const y = event.clientY - rect.top;
            const gridPoint = { x: Math.round((x - origin.x) / 50), y: Math.round((origin.y - y) / 50) };

            const snappedX = gridPoint.x * 50;
            const snappedY = gridPoint.y * -50;

            if (dragging === 'unitVectorX') {
                unitVectorX = { x: snappedX, y: snappedY };
            } else if (dragging === 'unitVectorY') {
                unitVectorY = { x: snappedX, y: snappedY };
            }

            draw();
        }
    }

    canvas.addEventListener('mousedown', (event) => {
        if (gameWon || isPaused) return;

        const rect = canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        if (isOnVector({ x, y }, unitVectorX)) {
            dragging = 'unitVectorX';
            event.preventDefault();  // Prevent scrolling when dragging starts
        } else if (isOnVector({ x, y }, unitVectorY)) {
            dragging = 'unitVectorY';
            event.preventDefault();  // Prevent scrolling when dragging starts
        }
    });

    canvas.addEventListener('mousemove', handleMouseMove);

    canvas.addEventListener('mouseup', () => {
        dragging = null;
    });

    canvas.addEventListener('touchstart', (event) => {
        if (gameWon || isPaused) return;

        const touch = event.touches[0];
        const rect = canvas.getBoundingClientRect();
        const x = touch.clientX - rect.left;
        const y = touch.clientY - rect.top;

        if (isOnVector({ x, y }, unitVectorX)) {
            dragging = 'unitVectorX';
            event.preventDefault();  // Prevent scrolling when dragging starts
        } else if (isOnVector({ x, y }, unitVectorY)) {
            dragging = 'unitVectorY';
            event.preventDefault();  // Prevent scrolling when dragging starts
        }
    });

    canvas.addEventListener('touchmove', (event) => {
        if (dragging && !isPaused) {
            const touch = event.touches[0];
            const rect = canvas.getBoundingClientRect();
            const x = touch.clientX - rect.left;
            const y = touch.clientY - rect.top;
            const gridPoint = { x: Math.round((x - origin.x) / 50), y: Math.round((origin.y - y) / 50) };

            const snappedX = gridPoint.x * 50;
            const snappedY = gridPoint.y * -50;

            if (dragging === 'unitVectorX') {
                unitVectorX = { x: snappedX, y: snappedY };
            } else if (dragging === 'unitVectorY') {
                unitVectorY = { x: snappedX, y: snappedY };
            }

            draw();
            event.preventDefault();  // Prevent scrolling during dragging
        }
    });

    canvas.addEventListener('touchend', () => {
        dragging = null;
    });

    function startTimer() {
        if (!timer) {
            timer = setInterval(() => {
                elapsedTime += 1;
                document.getElementById('timer').innerText = `Timer: ${elapsedTime} seconds`;
            }, 1000);
        }
    }

    function stopTimer() {
        clearInterval(timer);
        timer = null;
    }

    document.getElementById('goButton').addEventListener('click', () => {
        if (gameWon) return;
        if (!gameStarted) {
            gameStarted = true;
            draw();
            startTimer();
        }
        moveCounter += 1;
        document.getElementById('moveCounter').innerText = `${moveCounter}`;
    });

    document.getElementById('resetButton').addEventListener('click', () => {
        const points = generateValidPoints();
        bluePoint = points.bluePoint;
        redPoint = points.redPoint;

        unitVectorX = { ...initialUnitVectorX };
        unitVectorY = { ...initialUnitVectorY };
        moveCounter = 0;
        gameWon = false;
        gameStarted = false;
        elapsedTime = 0;
        document.getElementById('goButton').disabled = false;
        document.getElementById('moveCounter').innerText = `${moveCounter}`;
        document.getElementById('winMessage').innerText = '';
        document.getElementById('timer').innerText = `Timer: ${elapsedTime} seconds`;

        isPaused = false;
        document.getElementById('pauseButton').innerText = 'Pause';
        document.getElementById('pauseButton').disabled = false;

        draw();
        startTimer();
    });

    document.getElementById('pauseButton').addEventListener('click', () => {
        if (!gameWon) {
            togglePause();
        }
    });

    function togglePause() {
        if (gameWon) return;

        if (isPaused) {
            isPaused = false;
            document.getElementById('pauseButton').innerText = 'Pause';
            startTimer();
            draw();
        } else {
            isPaused = true;
            document.getElementById('pauseButton').innerText = 'Resume';
            stopTimer();
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            drawGrid();
            drawAxes();
        }
    }

    // Start the game with the grid and vectors shown, timer running
    drawGrid();
    draw();
    startTimer();
});

