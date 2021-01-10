// NOTE: this example uses the chess.js library:
// https://github.com/jhlywa/chess.js

var board = null
var game = new Chess()
var $status = $('#status')
var $fen = $('#fen')
var $pgn = $('#pgn')
var pionki = ''

createConnection()

$('#bialy').click(function(){
    pionki = 'w';
    document.getElementById("bialy").disabled = true;
    $('#czarny')[0].style.display = "none";
})
$('#czarny').click(function(){
  pionki = 'b';
  document.getElementById("czarny").disabled = true;
  $('#bialy')[0].style.display = "none";
  board.orientation('black');
})



// $('#jeden').click(function(){
//     userno = '1';
//     document.getElementById("jeden").disabled = true;
//     $('#dwa')[0].style.display = "none";
// })

// $('#dwa').click(function(){
//     userno = '2';
//     document.getElementById("dwa").disabled = true;
//     $('#jeden')[0].style.display = "none";
// })




// wysylanie stanu gry do drugiego użytkownika
function sendMessage(message) {
    stompClient.send('/app/user2', {}, message);
}


function createConnection() {
    var socket = new  SockJS('http://localhost:8090/chat-app')
    stompClient = Stomp.over(socket);
    stompClient.connect({},function(connectionData){
        console.log(connectionData);
        stompClient.subscribe('/sample/publish2', function(data) {
            console.log(data.body);
            game.load_pgn(data.body);
            updateStatus();
            board.position(game.fen())
        })
    })
}


function onDragStart (source, piece, position, orientation) {
  // do not move pieces when it's not your turn or game is over
  if (game.turn() !== pionki || game.game_over()) return false
  // only pick up pieces for the side to move
  if ((game.turn() === 'w' && piece.search(/^b/) !== -1) ||
      (game.turn() === 'b' && piece.search(/^w/) !== -1)) {
    return false
  }
}

function onDrop (source, target) {
  // see if the move is legal
  var move = game.move({
    from: source,
    to: target,
    promotion: 'q' // NOTE: always promote to a queen for example simplicity
  })

  // illegal move
  if (move === null) return 'snapback'

  updateStatus()
}



// update the board position after the piece snap
// for castling, en passant, pawn promotion
function onSnapEnd () {
  board.position(game.fen())
  sendMessage(game.pgn())
}

function updateStatus () {
  var status = ''

  var moveColor = 'White'
  if (game.turn() === 'b') {
    moveColor = 'Black'
  }

  // checkmate?
  if (game.in_checkmate()) {
    status = 'Game over, ' + moveColor + ' is in checkmate.'
  }

  // draw?
  else if (game.in_draw()) {
    status = 'Game over, drawn position'
  }

  // game still on
  else {
    status = moveColor + ' to move'

    // check?
    if (game.in_check()) {
      status += ', ' + moveColor + ' is in check'
    }
  }
 
  $status.html(status)
  $fen.html(game.fen())
  $pgn.html(game.pgn())
}

var config = {
  draggable: true,
  position: 'start',
  onDragStart: onDragStart,
  onDrop: onDrop,
  onSnapEnd: onSnapEnd
}
board = Chessboard('myBoard', config)

updateStatus()