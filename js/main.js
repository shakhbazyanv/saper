/*----- constants -----*/
let bombImage = '<div id="bomb"></div>';
let flagImage = '<div id="flag"></div>';
let wrongBombImage = '<div id="wrong-bomb"></div>';
let sizeLookup = {
  '16': {totalBombs: 40, tableWidth: '316px'},
};
let colors = [
  '',
  '#0000FA',
  '#4B802D',
  '#DB1300',
  '#202081',
  '#690400',
  '#457A7A',
  '#1B1B1B',
  '#7A7A7A',
];


/*----- app's state (variables) -----*/
let size = 16;
let board;
let minutes = 40;
let timeElapsed;
let adjBombs;
let hitBomb;
let elapsedTime;
let timerId;
let winner;

/*----- cached element references -----*/
let boardEl = document.getElementById('board');

/*----- event listeners -----*/
boardEl.addEventListener('click', function(e) {
  if (winner || hitBomb || minutes < 0) return;
  let clickedEl;
  clickedEl = e.target.tagName.toLowerCase() === 'img' ? e.target.parentElement : e.target;
  if (clickedEl.classList.contains('game-cell')) {
    if (!timerId) setTimer();
    let row = parseInt(clickedEl.dataset.row);
    let col = parseInt(clickedEl.dataset.col);
    let cell = board[row][col];
    if (e.shiftKey && !cell.revealed) {
    } else {
      hitBomb = cell.reveal();
      if (hitBomb) {
        revealAll();
        clearInterval(timerId);
        e.target.innerHTML = wrongBombImage;
      }
    }
    winner = getWinner();
    render();
  }
});

boardEl.addEventListener('contextmenu', (e) => {
  e.preventDefault();

  let clickedEl = e.target.tagName.toLowerCase() === 'img' ? e.target.parentElement : e.target;
  if (clickedEl.classList.contains('game-cell')) {
    let row = parseInt(clickedEl.dataset.row);
    let col = parseInt(clickedEl.dataset.col);
    let cell = board[row][col];
    if (!cell.revealed) {
      cell.flag();
    } 

    render();
  }

  return false;
}, false)

function createResetListener() { 
  document.getElementById('reset').addEventListener('click', function() {
    init();
    render();
  });
}

/*----- functions -----*/

function setTimer () {
  timerId = setInterval(function(){
    elapsedTime += 1;
    if (elapsedTime > 60) {
      elapsedTime = 0;
      minutes -= 1; 
    }

    if (minutes < 0) {
      clearInterval(timerId);
      return alert('Вы проиграли!');
    }

    document.getElementById('minutes').innerText = minutes.toString().padStart(3, '0');
    document.getElementById('seconds').innerText = elapsedTime.toString().padStart(3, '0');
  }, 1000);
};

function revealAll() {
  board.forEach(function(rowArr) {
    rowArr.forEach(function(cell) {
      cell.reveal();
    });
  });
};

function buildTable() {
  let topRow = `
  <tr>
  </tr>
  </tr>
    <tr>
      <td class="menu" colspan="${size}">
          <section id="status-bar">
            <div id="minutes">000</div>
            <div id="reset">
              <div id="default-face"></div>
            </div>
            <div id="seconds">000</div>
          </section>
      </td>
    </tr>
    `;
  boardEl.innerHTML = topRow + `<tr>${'<td class="game-cell"></td>'.repeat(size)}</tr>`.repeat(size);
  boardEl.style.width = sizeLookup[size].tableWidth;
  createResetListener();
  let cells = Array.from(document.querySelectorAll('td:not(.menu)'));
  cells.forEach(function(cell, idx) {
    cell.setAttribute('data-row', Math.floor(idx / size));
    cell.setAttribute('data-col', idx % size);
  });
}

function buildArrays() {
  let arr = Array(size).fill(null);
  arr = arr.map(function() {
    return new Array(size).fill(null);
  });
  return arr;
};

function buildCells(){
  board.forEach(function(rowArr, rowIdx) {
    rowArr.forEach(function(slot, colIdx) {
      board[rowIdx][colIdx] = new Cell(rowIdx, colIdx, board);
    });
  });
  addBombs();
  runCodeForAllCells(function(cell){
    cell.calcAdjBombs();
  });
};

function init() {
  buildTable();
  board = buildArrays();
  buildCells();
  minutes = getMinutes();
  elapsedTime = 0;
  clearInterval(timerId);
  timerId = null;
  hitBomb = false;
  winner = false;
};

function getMinutes() {
  let count = 0;
  board.forEach(function(row){
    count += row.filter(function(cell) {
      return cell.bomb;
    }).length
  });
  return count;
};

function addBombs() {
  let currentTotalBombs = sizeLookup[`${size}`].totalBombs;
  while (currentTotalBombs !== 0) {
    let row = Math.floor(Math.random() * size);
    let col = Math.floor(Math.random() * size);
    let currentCell = board[row][col]
    if (!currentCell.bomb){
      currentCell.bomb = true
      currentTotalBombs -= 1
    }
  }
};

function getWinner() {
  for (let row = 0; row<board.length; row++) {
    for (let col = 0; col<board[0].length; col++) {
      let cell = board[row][col];
      if (!cell.revealed && !cell.bomb) return false;
    }
  } 
  return true;
};

function render() {
  document.getElementById('minutes').innerText = minutes.toString().padStart(3, '0');
  let tdList = Array.from(document.querySelectorAll('[data-row]'));
  tdList.forEach(function(td) {
    let rowIdx = parseInt(td.getAttribute('data-row'));
    let colIdx = parseInt(td.getAttribute('data-col'));
    let cell = board[rowIdx][colIdx];
    if (cell.flagged) {
      td.innerHTML = flagImage;
    } else if (cell.revealed) {
      if (cell.bomb) {
          td.innerHTML = td.innerHTML === wrongBombImage ? td.innerHTML : bombImage;
      } else if (cell.adjBombs) {
        td.className = 'revealed'
        td.style.color = colors[cell.adjBombs];

        td.textContent = cell.adjBombs;
      } else {
        td.className = 'revealed'
      }
    } else {
      td.innerHTML = '';
    }

  });
  if (hitBomb) {
    document.getElementById('reset').innerHTML = '<div id="dead-face"></div>';
    runCodeForAllCells(function(cell) {
      if (!cell.bomb && cell.flagged) {
        
        let td = document.querySelector(`[data-row="${cell.row}"][data-col="${cell.col}"]`);
        td.innerHTML = wrongBombImage;

      }
    });
  } else if (winner) {
    document.getElementById('reset').innerHTML = '<div id="cool-face"></div>';
    clearInterval(timerId);
  }
};

function runCodeForAllCells(cb) {
  board.forEach(function(rowArr) {
    rowArr.forEach(function(cell) {
      cb(cell);
    });
  });
}

init();
render();