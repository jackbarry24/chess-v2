var board, game = new Chess();

// performs minimax search on each possible move and returns the best move
const getBestMove = (searchDepth, gameState, isPlayerMaximising) => {
    let possibleMoves = gameState.ugly_moves();
    let highestScore = Number.MIN_SAFE_INTEGER;
    let optimalMove;

    possibleMoves.forEach((move) => {
        gameState.ugly_move(move);
        let score = getMinimax(searchDepth - 1, gameState, Number.MIN_SAFE_INTEGER, Number.MAX_SAFE_INTEGER, !isPlayerMaximising);
        gameState.undo();
        if(score >= highestScore) {
            highestScore = score;
            optimalMove = move;
        }
    });

    return optimalMove;
};


// simulates game outcomes by performing minimax search w/ alpha-beta pruning
const getMinimax = (searchDepth, gameState, alpha, beta, isPlayerMaximising) => {
    positionCount++;

    if (searchDepth === 0) {
        return -1 * evaluateGameBoard(gameState.board());
    }

    let possibleMoves = gameState.ugly_moves();

    if (isPlayerMaximising) {
        let optimalScore = Number.MIN_SAFE_INTEGER;
        possibleMoves.forEach((move) => {
            gameState.ugly_move(move);
            optimalScore = Math.max(optimalScore, getMinimax(searchDepth - 1, gameState, alpha, beta, !isPlayerMaximising));
            gameState.undo();
            alpha = Math.max(alpha, optimalScore);
            if (beta <= alpha) {
                return optimalScore;
            }
        });
        return optimalScore;
    } else {
        let optimalScore = Number.MAX_SAFE_INTEGER;
        possibleMoves.forEach((move) => {
            gameState.ugly_move(move);
            optimalScore = Math.min(optimalScore, getMinimax(searchDepth - 1, gameState, alpha, beta, !isPlayerMaximising));
            gameState.undo();
            beta = Math.min(beta, optimalScore);
            if (beta <= alpha) {
                return optimalScore;
            }
        });
        return optimalScore;
    }
};


const getWinProbability = (gameState) => {
    let totalScore = evaluateGameBoard(gameState.board());
    console.log(totalScore);
    let normalizedScore = totalScore / 100;

    normalizedScore = Math.max(-1, normalizedScore);
    normalizedScore = Math.min(1, normalizedScore);

    return normalizedScore;
};


const evaluateGameBoard = (gameBoard) => {
    let totalScore = 0;
    gameBoard.forEach((row, i) => {
        row.forEach((piece, j) => {
            totalScore += getPieceValue(piece, i, j);
        });
    });
    return totalScore;
};


const getPieceValue = (piece, x, y) => {
    if (!piece) return 0;

    const getPieceAbsoluteValue = (piece, isWhite, x, y) => {
        const pieceType = piece.type;

        const pieceValueMap = {
            'p': 10 + (isWhite ? pawnEvalWhite[y][x] : pawnEvalBlack[y][x]),
            'r': 50 + (isWhite ? rookEvalWhite[y][x] : rookEvalBlack[y][x]),
            'n': 30 + knightEval[y][x],
            'b': 30 + (isWhite ? bishopEvalWhite[y][x] : bishopEvalBlack[y][x]),
            'q': 90 + queenEval[y][x],
            'k': 900 + (isWhite ? kingEvalWhite[y][x] : kingEvalBlack[y][x])
        };

        return pieceValueMap[pieceType];
    };

    const isWhite = piece.color === 'w';
    const absoluteValue = getPieceAbsoluteValue(piece, isWhite, x ,y);
    return isWhite ? absoluteValue : -absoluteValue;
};


/* board visualization and games state handling */

const onDragStart = (source, piece, position, orientation) => {
    if (game.in_checkmate() || game.in_draw() || piece.search(/^b/) !== -1) {
        return false;
    }
};

const makeBestMove = function () {
    const bestMove = getBestMoveWrapper(game);
    game.ugly_move(bestMove);
    board.position(game.fen());
    dispMoveHistory(game.history());
    if (game.game_over()) {
        alert('Game over');
    }
};


let positionCount;

const getBestMoveWrapper = (game) => {
    if (game.game_over()) {
        alert('Game over');
    }

    positionCount = 0;
    const searchDepth = parseInt($('#search-depth').find(':selected').text());

    const startTime = new Date().getTime();
    const optimalMove = getBestMove(searchDepth, game, true);
    const endTime = new Date().getTime();

    const moveDuration = (endTime - startTime);
    const positionsPerSecond = (positionCount * 1000 / moveDuration);

    $('#position-count').text(positionCount);
    $('#time').text(moveDuration / 1000 + 's');
    $('#positions-per-s').text(positionsPerSecond.toFixed(2)); 
    let winProbability = getWinProbability(game);
    $('#win-probability').text(winProbability.toFixed(2));
    // $('#win-probability-range').val(winProbability.toFixed(2));


    return optimalMove;
};

const dispMoveHistory = (moves) => {
    if (moves.length === 0) {
        return;
    }
    const historyElement = $('#move-history').empty();

    moves.forEach((move, index) => {
        if (index % 2 === 0) {
            historyElement.append(`<span>${parseInt(index/2) + 1}. Anon: ${move} Bot: ${moves[index + 1] || ' '}</span><br>`);
        }
    });

    historyElement.scrollTop(historyElement[0].scrollHeight);
};

const onDrop = function (source, target) {
    var move = game.move({
        from: source,
        to: target,
        promotion: 'q'
    });

    removeGreySquares();
    if (move === null) {
        return 'snapback';
    }

    dispMoveHistory(game.history());
    window.setTimeout(makeBestMove, 250);
};

const onSnapEnd = function () {
    board.position(game.fen());
};

const onMouseoverSquare = function(square, piece) {
    const moves = game.moves({
        square: square,
        verbose: true
    });

    if (moves.length === 0) return;

    greySquare(square);

    moves.forEach(move => {
        greySquare(move.to);
    });
};

const onMouseoutSquare = function(square, piece) {
    removeGreySquares();
};

const removeGreySquares = function() {
    $('#board .square-55d63').css('background', '');
};

const greySquare = function(square) {
    let squareEl = $('#board .square-' + square);

    let background = '#a9a9a9';
    if (squareEl.hasClass('black-3c85d') === true) {
        background = '#696969';
    }

    squareEl.css('background', background);
};

const startGame = () => {
    board.start();
    game.reset();
    $('#time').text('');
    $('#position-count').text('');
    $('#positions-per-s').text('');
    $('#win-probability').text('');
    $('#move-history').empty();
    removeGreySquares();
};

$('#startBtn').on('click', startGame);

const cfg = {
    draggable: true,
    position: 'start',
    onDragStart: onDragStart,
    onDrop: onDrop,
    onMouseoutSquare: onMouseoutSquare,
    onMouseoverSquare: onMouseoverSquare,
    onSnapEnd: onSnapEnd,
};
board = ChessBoard('board', cfg);


const reverseArray = array => [...array].reverse();


const pawnEvalWhite =
    [
        [0.0,  0.0,  0.0,  0.0,  0.0,  0.0,  0.0,  0.0],
        [5.0,  5.0,  5.0,  5.0,  5.0,  5.0,  5.0,  5.0],
        [1.0,  1.0,  2.0,  3.0,  3.0,  2.0,  1.0,  1.0],
        [0.5,  0.5,  1.0,  2.5,  2.5,  1.0,  0.5,  0.5],
        [0.0,  0.0,  0.0,  2.0,  2.0,  0.0,  0.0,  0.0],
        [0.5, -0.5, -1.0,  0.0,  0.0, -1.0, -0.5,  0.5],
        [0.5,  1.0, 1.0,  -2.0, -2.0,  1.0,  1.0,  0.5],
        [0.0,  0.0,  0.0,  0.0,  0.0,  0.0,  0.0,  0.0]
    ];
const pawnEvalBlack = reverseArray(pawnEvalWhite);

// knight eval is same for both white and black
const knightEval =
    [
        [-5.0, -4.0, -3.0, -3.0, -3.0, -3.0, -4.0, -5.0],
        [-4.0, -2.0,  0.0,  0.0,  0.0,  0.0, -2.0, -4.0],
        [-3.0,  0.0,  1.0,  1.5,  1.5,  1.0,  0.0, -3.0],
        [-3.0,  0.5,  1.5,  2.0,  2.0,  1.5,  0.5, -3.0],
        [-3.0,  0.0,  1.5,  2.0,  2.0,  1.5,  0.0, -3.0],
        [-3.0,  0.5,  1.0,  1.5,  1.5,  1.0,  0.5, -3.0],
        [-4.0, -2.0,  0.0,  0.5,  0.5,  0.0, -2.0, -4.0],
        [-5.0, -4.0, -3.0, -3.0, -3.0, -3.0, -4.0, -5.0]
    ];

const bishopEvalWhite = 
    [
        [ -2.0, -1.0, -1.0, -1.0, -1.0, -1.0, -1.0, -2.0],
        [ -1.0,  0.0,  0.0,  0.0,  0.0,  0.0,  0.0, -1.0],
        [ -1.0,  0.0,  0.5,  1.0,  1.0,  0.5,  0.0, -1.0],
        [ -1.0,  0.5,  0.5,  1.0,  1.0,  0.5,  0.5, -1.0],
        [ -1.0,  0.0,  1.0,  1.0,  1.0,  1.0,  0.0, -1.0],
        [ -1.0,  1.0,  1.0,  1.0,  1.0,  1.0,  1.0, -1.0],
        [ -1.0,  0.5,  0.0,  0.0,  0.0,  0.0,  0.5, -1.0],
        [ -2.0, -1.0, -1.0, -1.0, -1.0, -1.0, -1.0, -2.0]
    ];
const bishopEvalBlack = reverseArray(bishopEvalWhite);

const rookEvalWhite = 
    [
        [  0.0,  0.0,  0.0,  0.0,  0.0,  0.0,  0.0,  0.0],
        [  0.5,  1.0,  1.0,  1.0,  1.0,  1.0,  1.0,  0.5],
        [ -0.5,  0.0,  0.0,  0.0,  0.0,  0.0,  0.0, -0.5],
        [ -0.5,  0.0,  0.0,  0.0,  0.0,  0.0,  0.0, -0.5],
        [ -0.5,  0.0,  0.0,  0.0,  0.0,  0.0,  0.0, -0.5],
        [ -0.5,  0.0,  0.0,  0.0,  0.0,  0.0,  0.0, -0.5],
        [ -0.5,  0.0,  0.0,  0.0,  0.0,  0.0,  0.0, -0.5],
        [  0.0,   0.0, 0.0,  0.5,  0.5,  0.0,  0.0,  0.0]
    ];
const rookEvalBlack = reverseArray(rookEvalWhite);

// queen has same eval for both white and black
const queenEval = 
    [
        [ -2.0, -1.0, -1.0, -0.5, -0.5, -1.0, -1.0, -2.0],
        [ -1.0,  0.0,  0.0,  0.0,  0.0,  0.0,  0.0, -1.0],
        [ -1.0,  0.0,  0.5,  0.5,  0.5,  0.5,  0.0, -1.0],
        [ -0.5,  0.0,  0.5,  0.5,  0.5,  0.5,  0.0, -0.5],
        [  0.0,  0.0,  0.5,  0.5,  0.5,  0.5,  0.0, -0.5],
        [ -1.0,  0.5,  0.5,  0.5,  0.5,  0.5,  0.0, -1.0],
        [ -1.0,  0.0,  0.5,  0.0,  0.0,  0.0,  0.0, -1.0],
        [ -2.0, -1.0, -1.0, -0.5, -0.5, -1.0, -1.0, -2.0]
    ];

const kingEvalWhite = 
    [
        [ -3.0, -4.0, -4.0, -5.0, -5.0, -4.0, -4.0, -3.0],
        [ -3.0, -4.0, -4.0, -5.0, -5.0, -4.0, -4.0, -3.0],
        [ -3.0, -4.0, -4.0, -5.0, -5.0, -4.0, -4.0, -3.0],
        [ -3.0, -4.0, -4.0, -5.0, -5.0, -4.0, -4.0, -3.0],
        [ -2.0, -3.0, -3.0, -4.0, -4.0, -3.0, -3.0, -2.0],
        [ -1.0, -2.0, -2.0, -2.0, -2.0, -2.0, -2.0, -1.0],
        [  2.0,  2.0,  0.0,  0.0,  0.0,  0.0,  2.0,  2.0 ],
        [  2.0,  3.0,  1.0,  0.0,  0.0,  1.0,  3.0,  2.0 ]
    ];
const kingEvalBlack = reverseArray(kingEvalWhite);