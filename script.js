var board, game = new Chess();

// performs minimax search on each possible move and returns the best move
// inspired by https://www.chessprogramming.org/Minimax & https://www.chessprogramming.org/Alpha-Beta
const getBestMove = (searchDepth, gameState, isPlayerMaximising) => {
    let possibleMoves = gameState.ugly_moves();
    let highestScore = Number.MIN_SAFE_INTEGER;
    let optimalMove;

    // Evaluate and sort the moves so we can start with the most promising ones
    possibleMoves = possibleMoves.map(move => evaluateMove(move, gameState))
        .sort((a, b) => b.score - a.score);


    // implementation is similar to "generate subsets" type problems
    // perform move -> recursively permute board state -> undo move
    possibleMoves.forEach(({ move }) => {
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


const getMinimax = (searchDepth, gameState, alpha, beta, isPlayerMaximising) => {
    positionCount++;

    if (searchDepth === 0) {
        return -1 * evaluateGameBoard(gameState.board());
    }

    let possibleMoves = gameState.ugly_moves();

    possibleMoves = possibleMoves.map(move => evaluateMove(move, gameState))
        .sort((a, b) => isPlayerMaximising ? b.score - a.score : a.score - b.score);

    if (isPlayerMaximising) {
        let optimalScore = Number.MIN_SAFE_INTEGER;
        possibleMoves.forEach(({ move }) => {
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
        possibleMoves.forEach(({ move }) => {
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


// helper function for performing move ordering https://www.chessprogramming.org/Move_Ordering
const evaluateMove = (move, gameState) => {
    gameState.ugly_move(move);
    let score = evaluateGameBoard(gameState.board());
    gameState.undo();

    return { move, score };
};


// returns a value between 0 and 100 representing the probability of the player winning
const getWinProbability = (gameState) => {
    let totalScore = evaluateGameBoard(gameState.board());
    let normalizedScore = (totalScore / 10) + 50;

    normalizedScore = Math.max(0, normalizedScore);
    normalizedScore = Math.min(100, normalizedScore);

    return normalizedScore;
};


// sums up the value of each piece on the board
const evaluateGameBoard = (gameBoard) => {
    let totalScore = 0;
    gameBoard.forEach((row, i) => {
        row.forEach((piece, j) => {
            totalScore += getPieceValue(piece, i, j);
        });
    });
    return totalScore;
};


// returns the value of a piece at a given position using the piece square tables
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


// functions for interacting with the UI inspired by https://github.com/lhartikk/simple-chess-ai

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
    const optimalMove = getBestMove(searchDepth, game, true);

    $('#position-count').text(positionCount);
    let winProbability = getWinProbability(game);
    $('#win-probability').text(winProbability.toFixed(2) + '%');

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
    $('#position-count').text('');
    $('#move-history').empty();
    $('#win-probability').text('');
    removeGreySquares();
};
$('#startBtn').on('click', startGame);


const config = {
    draggable: true,
    position: 'start',
    onDragStart: onDragStart,
    onDrop: onDrop,
    onMouseoutSquare: onMouseoutSquare,
    onMouseoverSquare: onMouseoverSquare,
    onSnapEnd: onSnapEnd,
};
board = ChessBoard('board', config);


const reverseArray = array => [...array].reverse();


// piece square tables from https://www.chessprogramming.org/Piece-Square_Tables

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