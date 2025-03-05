document.addEventListener('DOMContentLoaded', (event) => {
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');

    // Set fixed canvas size
    canvas.width = 600;
    canvas.height = 600;
    const width = canvas.width;
    const height = canvas.height;
    const baseVectorLength = 50;
    let origin = { x: width / 2, y: height / 2 };

    // Initialize vectors
    const initialUnitVectorX = { x: baseVectorLength, y: 0 };
    const initialUnitVectorY = { x: 0, y: -baseVectorLength };
    let unitVectorX = { ...initialUnitVectorX };
    let unitVectorY = { ...initialUnitVectorY };

    // Game state variables
    let isFirstGame = true;
    let dragging = null;
    let moveCounter = 0;
    let gameWon = false;
    let gameStarted = false;
    let timer = null;
    let elapsedTime = 0;
    let isPaused = false;
    let isShowingInstructions = false;
    let isShowingSolution = false;
    
    function getScaledPoint(event, rect) {
    let x, y;
    const scaleX = canvas.width / canvas.clientWidth;
    const scaleY = canvas.height / canvas.clientHeight;
    
    if (event.type.includes('touch')) {
        const touch = event.touches[0];
        x = (touch.clientX - rect.left) * scaleX;
        y = (touch.clientY - rect.top) * scaleY;
    } else {
        x = (event.clientX - rect.left) * scaleX;
        y = (event.clientY - rect.top) * scaleY;
    }
    
    return { x, y };
}
    // Point generation functions
    

// Replace your existing getRandomPoint function with this:
    function getRandomPoint() {
        if (isFirstGame) {
            // Starting positions for first game
            const startingPoints = [
                { x: 1, y: 1 },
                { x: 1, y: -1 },
                { x: -1, y: 1 },
                { x: -1, y: -1 }
            ];
            // Randomly select one of the four starting points
            const randomIndex = Math.floor(Math.random() * startingPoints.length);
            isFirstGame = false; // Set to false so future points are random
            return startingPoints[randomIndex];
        }
    
        // Original random point generation for subsequent games
        const min = -5;
        const max = 5;
        let x, y;
        do {
            x = Math.floor(Math.random() * (max - min + 1)) + min;
            y = Math.floor(Math.random() * (max - min + 1)) + min;
        } while ((x === 1 && y === 0) || (x === 0 && y === 1));
        return { x, y };
    }

    function hasIntegerSolution(bluePoint, redPoint) {
        const [b1, b2] = [bluePoint.x, bluePoint.y];
        const [r1, r2] = [redPoint.x, redPoint.y];
        let bestSolution = null;
        let minSum = Infinity;

        for (let a = -6; a <= 6; a++) {
            for (let b = -6; b <= 6; b++) {
                const x1 = a * b1 + b * b2;
                for (let c = -6; c <= 6; c++) {
                    for (let d = -6; d <= 6; d++) {
                        const x2 = c * b1 + d * b2;
                        if (x1 === r1 && x2 === r2) {
                            const sum = Math.abs(a) + Math.abs(b) + Math.abs(c) + Math.abs(d);
                            if (sum < minSum) {
                                minSum = sum;
                                bestSolution = { a, b, c, d };
                            }
                        }
                    }
                }
            }
        }
        return bestSolution;
    }

                              function generateValidPoints() {
        let bluePoint, redPoint, solution;
        do {
            bluePoint = getRandomPoint();
            redPoint = getRandomPoint();
            solution = hasIntegerSolution(bluePoint, redPoint);
        } while (bluePoint.x === redPoint.x && bluePoint.y === redPoint.y || !solution);
        return { bluePoint, redPoint, solution };
    }

    let { bluePoint, redPoint, solution } = generateValidPoints();

    // Coordinate conversion functions
    function gridToCanvas(point) {
        return {
            x: origin.x + point.x * baseVectorLength,
            y: origin.y - point.y * baseVectorLength
        };
    }

    function canvasToGrid(point) {
        return {
            x: Math.round((point.x - origin.x) / baseVectorLength),
            y: Math.round((origin.y - point.y) / baseVectorLength)
        };
    }

    // Drawing functions
    function drawGrid() {
        ctx.clearRect(0, 0, width, height);
        ctx.strokeStyle = 'lightgray';
        
        // Draw grid lines
        for (let i = -Math.ceil(width / (2 * baseVectorLength)); i <= Math.ceil(width / (2 * baseVectorLength)); i++) {
            ctx.beginPath();
            ctx.moveTo(origin.x + i * baseVectorLength, 0);
            ctx.lineTo(origin.x + i * baseVectorLength, height);
            ctx.stroke();
        }

        for (let j = -Math.ceil(height / (2 * baseVectorLength)); j <= Math.ceil(height / (2 * baseVectorLength)); j++) {
            ctx.beginPath();
            ctx.moveTo(0, origin.y + j * baseVectorLength);
            ctx.lineTo(width, origin.y + j * baseVectorLength);
            ctx.stroke();
        }
    }

    function drawAxes() {
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 2;

        // X-axis
        ctx.beginPath();
        ctx.moveTo(0, origin.y);
        ctx.lineTo(width, origin.y);
        ctx.stroke();

        // Y-axis
        ctx.beginPath();
        ctx.moveTo(origin.x, 0);
        ctx.lineTo(origin.x, height);
        ctx.stroke();

        // Labels
        ctx.font = '16px Arial';
        ctx.fillStyle = 'black';
        ctx.fillText('X', width - 20, origin.y - 10);
        ctx.fillText('Y', origin.x + 10, 20);
    }

    function drawArrow(start, end, color, label = '') {
        const headLength = baseVectorLength / 5;
        const dx = end.x - start.x;
        const dy = end.y - start.y;
        const angle = Math.atan2(dy, dx);

        // Draw line
        ctx.beginPath();
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(end.x, end.y);
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.stroke();

        // Draw arrowhead
        ctx.beginPath();
        ctx.moveTo(end.x, end.y);
        ctx.lineTo(
            end.x - headLength * Math.cos(angle - Math.PI / 6),
            end.y - headLength * Math.sin(angle - Math.PI / 6)
        );
        ctx.lineTo(
            end.x - headLength * Math.cos(angle + Math.PI / 6),
            end.y - headLength * Math.sin(angle + Math.PI / 6)
        );
        ctx.closePath();
        ctx.fillStyle = color;
        ctx.fill();

        // Add label
        if (label) {
            ctx.font = '16px Arial';
            ctx.fillStyle = color;
            ctx.fillText(label, end.x + 5, end.y - 5);
        }
    }

                              function drawPoints() {
        // Draw red target point
        const redCanvasPoint = gridToCanvas(redPoint);
        ctx.beginPath();
        ctx.arc(redCanvasPoint.x, redCanvasPoint.y, baseVectorLength/10, 0, Math.PI * 2);
        ctx.fillStyle = 'red';
        ctx.fill();

        // Draw blue starting point
        const blueCanvasPoint = gridToCanvas(bluePoint);
        ctx.beginPath();
        ctx.arc(blueCanvasPoint.x, blueCanvasPoint.y, baseVectorLength/10, 0, Math.PI * 2);
        ctx.fillStyle = 'blue';
        ctx.fill();

        drawArrow(origin, blueCanvasPoint, 'blue');
    }

    function drawTransformedVector() {
        const A = [
            [(unitVectorX.x / baseVectorLength), (unitVectorY.x / baseVectorLength)],
            [(-unitVectorX.y / baseVectorLength), (-unitVectorY.y / baseVectorLength)]
        ];

        const transformedBluePoint = {
            x: (A[0][0] * bluePoint.x) + (A[0][1] * bluePoint.y),
            y: (A[1][0] * bluePoint.x) + (A[1][1] * bluePoint.y)
        };

        const transformedBlueCanvasPoint = gridToCanvas(transformedBluePoint);
        ctx.beginPath();
        ctx.arc(transformedBlueCanvasPoint.x, transformedBlueCanvasPoint.y, baseVectorLength/10, 0, Math.PI * 2);
        ctx.fillStyle = 'lightblue';
        ctx.fill();

        drawArrow(origin, transformedBlueCanvasPoint, 'lightblue');
        checkWinCondition(transformedBluePoint);
    }

    function draw() {
        if (isShowingInstructions || isShowingSolution) return;
        
        drawGrid();
        drawAxes();
        
        // Draw original basis vectors
        drawArrow(origin, 
                 { x: origin.x + initialUnitVectorX.x, y: origin.y + initialUnitVectorX.y }, 
                 'black', 'i');
        drawArrow(origin, 
                 { x: origin.x + initialUnitVectorY.x, y: origin.y + initialUnitVectorY.y }, 
                 'black', 'j');

        // Draw transformed basis vectors
        const labelIX = (unitVectorX.x !== initialUnitVectorX.x || 
                        unitVectorX.y !== initialUnitVectorX.y) ? "i'" : '';
        const labelJY = (unitVectorY.x !== initialUnitVectorY.x || 
                        unitVectorY.y !== initialUnitVectorY.y) ? "j'" : '';
        
        drawArrow(origin, 
                 { x: origin.x + unitVectorX.x, y: origin.y + unitVectorX.y }, 
                 'green', labelIX);
        drawArrow(origin, 
                 { x: origin.x + unitVectorY.x, y: origin.y + unitVectorY.y }, 
                 'green', labelJY);
        
        drawPoints();
    }

    function isOnVector(point, vector) {
    const vectorPoint = { x: origin.x + vector.x, y: origin.y + vector.y };
    const distance = Math.sqrt(
        (point.x - vectorPoint.x) ** 2 + 
        (point.y - vectorPoint.y) ** 2
    );
    // Increase the touch area for mobile devices
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    const touchArea = isMobile ? baseVectorLength/2 : baseVectorLength/5;
    
    // Also check if we're near the vector's line
    const nearLine = isNearVectorLine(point, origin, vectorPoint);
    
    return distance < touchArea || nearLine;
}

// Add this new helper function right after isOnVector
function isNearVectorLine(point, start, end) {
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    const tolerance = isMobile ? 20 : 10; // Larger tolerance for mobile

    // Calculate the distance from point to the line segment
    const a = point.x - start.x;
    const b = point.y - start.y;
    const c = end.x - start.x;
    const d = end.y - start.y;

    const dot = a * c + b * d;
    const len_sq = c * c + d * d;
    
    // Find the closest point on the line
    let param = -1;
    if (len_sq !== 0) param = dot / len_sq;

    let xx, yy;

    if (param < 0) {
        xx = start.x;
        yy = start.y;
    } else if (param > 1) {
        xx = end.x;
        yy = end.y;
    } else {
        xx = start.x + param * c;
        yy = start.y + param * d;
    }

    const dx = point.x - xx;
    const dy = point.y - yy;
    const distance = Math.sqrt(dx * dx + dy * dy);

    return distance < tolerance;
}

                              // Event handlers for both mouse and touch
    function handlePointerStart(event) {
    event.preventDefault();
    if (gameWon || isPaused) return;

    const rect = canvas.getBoundingClientRect();
    const point = getScaledPoint(event, rect);

    if (isOnVector(point, unitVectorX)) {
        dragging = 'unitVectorX';
    } else if (isOnVector(point, unitVectorY)) {
        dragging = 'unitVectorY';
    }
}

    function handlePointerMove(event) {
    event.preventDefault();
    if (dragging && !isPaused) {
        const rect = canvas.getBoundingClientRect();
        const point = getScaledPoint(event, rect);
        
        const gridPoint = canvasToGrid(point);
        const snappedX = Math.round(gridPoint.x) * baseVectorLength;
        const snappedY = Math.round(gridPoint.y) * -baseVectorLength;

        if (dragging === 'unitVectorX') {
            unitVectorX = { x: snappedX, y: snappedY };
        } else if (dragging === 'unitVectorY') {
            unitVectorY = { x: snappedX, y: snappedY };
        }
        draw();
    }
}

    function handlePointerEnd(event) {
    event.preventDefault();  // Add this line
    dragging = null;
    // Force a redraw to ensure everything is updated
    draw();
}

    // Add event listeners for both mouse and touch
   // Replace your existing event listeners with these
    canvas.addEventListener('mousedown', handlePointerStart);
    canvas.addEventListener('mousemove', handlePointerMove);
    canvas.addEventListener('mouseup', handlePointerEnd);
    canvas.addEventListener('mouseleave', handlePointerEnd);
    
    // Touch event handlers with proper options
    canvas.addEventListener('touchstart', handlePointerStart, { passive: false });
    canvas.addEventListener('touchmove', handlePointerMove, { passive: false });
    canvas.addEventListener('touchend', handlePointerEnd, { passive: false });
    
    // Add these two new touch event listeners
    canvas.addEventListener('touchcancel', handlePointerEnd, { passive: false });
    canvas.addEventListener('touchleave', handlePointerEnd, { passive: false });
    
    // Also add this to prevent any potential touch issues
    canvas.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        return false;
    }, { passive: false });

    // Game control functions
    function checkWinCondition(transformedPoint) {
        if (Math.round(transformedPoint.x) === redPoint.x && 
            Math.round(transformedPoint.y) === redPoint.y) {
            gameWon = true;
            stopTimer();
            document.getElementById('winMessage').innerText = 
                `Congratulations! You won in ${moveCounter} moves and ${elapsedTime} seconds!`;
            disableButtonsAfterWin();
        }
    }

    function startTimer() {
        if (!timer) {
            timer = setInterval(() => {
                if (!isPaused) {
                    elapsedTime += 1;
                    document.getElementById('timer').innerText = `Timer: ${elapsedTime} seconds`;
                }
            }, 1000);
        }
    }

    function stopTimer() {
        clearInterval(timer);
        timer = null;
    }

                              // Overlay control functions
    function toggleInstructions() {
        isShowingInstructions = !isShowingInstructions;
        const overlay = document.getElementById('instructionsOverlay');
        overlay.style.display = isShowingInstructions ? 'block' : 'none';
        
        if (isShowingInstructions) {
            isPaused = true;
        } else {
            isPaused = false;
            draw();
        }
    }

    function toggleSolution() {
        isShowingSolution = !isShowingSolution;
        const overlay = document.getElementById('solutionOverlay');
        
        if (isShowingSolution) {
            isPaused = true;
            // Update solution display with MathJax formatting
            const equationText = `
                \\[
                \\begin{bmatrix}
                ${solution.a} & ${solution.b} \\\\
                ${solution.c} & ${solution.d} \\\\
                \\end{bmatrix}
                \\begin{bmatrix}
                ${bluePoint.x} \\\\
                ${bluePoint.y} \\\\
                \\end{bmatrix}
                =
                \\begin{bmatrix}
                ${redPoint.x} \\\\
                ${redPoint.y} \\\\
                \\end{bmatrix}
                \\]
            `;

            const systemText = `
                \\[
                \\begin{aligned}
                ${solution.a}(${bluePoint.x}) + ${solution.b}(${bluePoint.y}) &= ${redPoint.x} \\\\
                ${solution.c}(${bluePoint.x}) + ${solution.d}(${bluePoint.y}) &= ${redPoint.y}
                \\end{aligned}
                \\]
            `;

            const vectorText = `
                \\[
                \\text{Basis vectors: } i' = (${solution.a}, ${solution.c}), \\; j' = (${solution.b}, ${solution.d})
                \\]
            `;

            document.getElementById('equation').innerHTML = equationText;
            document.getElementById('equationText').innerHTML = systemText;
            document.getElementById('vectorMapping').innerHTML = vectorText;
            
            // Trigger MathJax to process the new content
            MathJax.typeset();
        } else {
            isPaused = false;
            draw();
        }
        
        overlay.style.display = isShowingSolution ? 'block' : 'none';
    }

    function togglePause() {
        if (gameWon) return;
        
        isPaused = !isPaused;
        document.getElementById('pauseButton').innerText = isPaused ? 'Resume' : 'Pause';
        
        if (isPaused) {
            stopTimer();
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            drawGrid();
            drawAxes();
        } else {
            startTimer();
            draw();
        }
    }

    // Button event listeners
    document.getElementById('howToPlayButton').addEventListener('click', toggleInstructions);
    document.getElementById('backToGameButton').addEventListener('click', toggleInstructions);
    document.getElementById('solveButton').addEventListener('click', toggleSolution);
    document.getElementById('backFromSolutionButton').addEventListener('click', toggleSolution);

    document.getElementById('goButton').addEventListener('click', () => {
        if (gameWon || isShowingInstructions || isShowingSolution) return;
        if (!gameStarted) {
            gameStarted = true;
            draw();
            startTimer();
        }
        moveCounter += 1;
        document.getElementById('moveCounter').innerText = moveCounter;
        drawTransformedVector();
    });

    document.getElementById('resetButton').addEventListener('click', () => {
    // Add this line to ensure the next game uses random points
        isFirstGame = false;
        
        // Generate new points and reset game state
        const points = generateValidPoints();
        bluePoint = points.bluePoint;
        redPoint = points.redPoint;
        solution = points.solution;
        
        // Reset vectors
        unitVectorX = { ...initialUnitVectorX };
        unitVectorY = { ...initialUnitVectorY };
        
        // Reset game state
        moveCounter = 0;
        gameWon = false;
        gameStarted = false;
        elapsedTime = 0;
        isPaused = false;
        isShowingInstructions = false;
        isShowingSolution = false;
        
        // Reset UI elements
        document.getElementById('goButton').disabled = false;
        document.getElementById('pauseButton').disabled = false;
        document.getElementById('moveCounter').innerText = moveCounter;
        document.getElementById('winMessage').innerText = '';
        document.getElementById('timer').innerText = `Timer: ${elapsedTime} seconds`;
        document.getElementById('instructionsOverlay').style.display = 'none';
        document.getElementById('solutionOverlay').style.display = 'none';
        document.getElementById('pauseButton').innerText = 'Pause';
        
        // Reset display
        draw();
        stopTimer();
        startTimer();
    });
    
    document.getElementById('pauseButton').addEventListener('click', () => {
        if (!gameWon) {
            togglePause();
        }
    });
    
    function disableButtonsAfterWin() {
        document.getElementById('goButton').disabled = true;
        document.getElementById('pauseButton').disabled = true;
    }
    
    // Mobile touch event prevention
    document.addEventListener('touchstart', (e) => {
        if (e.target === canvas) {
            e.preventDefault();
        }
    }, { passive: false });
    
    document.addEventListener('touchmove', (e) => {
        if (e.target === canvas) {
            e.preventDefault();
        }
    }, { passive: false });
    
    // Handle window resize
    function handleResize() {
        const displayWidth = Math.min(600, window.innerWidth - 40);
        const scale = displayWidth / canvas.width;
        
        canvas.style.width = `${displayWidth}px`;
        canvas.style.height = `${canvas.height * scale}px`;
    }
    
    window.addEventListener('resize', handleResize);
    handleResize();
    
    // Initialize game
    draw();
    startTimer();
});
