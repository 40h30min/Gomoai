const SIZE = 15;
const board = [];
const boardDiv = document.getElementById("board");
const turnText = document.getElementById("turn");
const judgeText = document.getElementById("judge");
const reasonText = document.getElementById("reason");

let currentPlayer = 1;
let gameOver = false;

let memory = JSON.parse(localStorage.getItem("gomokuMemory")) || {};

for (let y = 0; y < SIZE; y++) {
  board[y] = [];
  for (let x = 0; x < SIZE; x++) {
    board[y][x] = 0;
    const cell = document.createElement("div");
    cell.className = "cell";
    cell.dataset.x = x;
    cell.dataset.y = y;
    cell.addEventListener("click", () => {
      if (currentPlayer === 1) placeStone(x, y, cell, true);
    });
    boardDiv.appendChild(cell);
  }
}

function opponent(p){ return p===1?2:1; }

function placeStone(x,y,cell,isHuman){
  if(board[y][x]||gameOver)return;

  let evalData=null;
  if(isHuman){
    evalData = evaluateMove(x,y,1,true);
  }

  board[y][x]=currentPlayer;
  drawStone(cell,currentPlayer);

  if(isHuman){
    showJudge(evalData.score);
    reasonText.textContent = evalData.reason;
  } else {
    judgeText.textContent = "";
    reasonText.textContent = "";
  }

  if(checkWin(x,y,currentPlayer)){
    turnText.textContent = (currentPlayer===1?"黒":"CPU")+"の勝ち";
    if(isHuman && evalData) learn(evalData.keys,true);
    gameOver=true;
    return;
  }

  currentPlayer = opponent(currentPlayer);
  turnText.textContent = currentPlayer===1?"黒の番":"CPU思考中";

  clearScores();

  if(currentPlayer===2)setTimeout(cpuMove,500);
}

function drawStone(cell,p){
  const s=document.createElement("div");
  s.className="stone "+(p===1?"black":"white");
  cell.appendChild(s);
}

function cpuMove(){
  let best=-Infinity, move=null;

  for(let y=0;y<SIZE;y++){
    for(let x=0;x<SIZE;x++){
      if(board[y][x]===0){
        const data = evaluateMove(x,y,2,false);
        if(data.score>best){
          best=data.score;
          move={x,y};
        }
      }
    }
  }

  const cell=document.querySelector(`.cell[data-x="${move.x}"][data-y="${move.y}"]`);
  placeStone(move.x,move.y,cell,false);
}

function evaluateMove(x,y,p,detail=false){
  let score=0;
  let reasons=[];
  let keys=[];

  const self=lineScore(x,y,p);
  const enemy=lineScore(x,y,opponent(p));

  score+=self*2;
  score+=enemy*1.5;

  if(self>=4) reasons.push("攻め");
  if(enemy>=4) reasons.push("守り");

  const center=centerScore(x,y);
  score+=center;
  if(center>8) reasons.push("中央");

  const memKey=`${self}-${enemy}`;
  const memScore=memory[memKey]||0;
  score+=memScore;
  if(memScore!==0) reasons.push("経験");

  keys.push(memKey);

  if(detail){
    return {score:Math.floor(score), reason:reasons.join("・"), keys};
  }
  return {score:Math.floor(score)};
}

function lineScore(x,y,p){
  let max=0;
  const dirs=[[1,0],[0,1],[1,1],[1,-1]];
  for(const[dX,dY]of dirs){
    let c=1;
    c+=count(x,y,dX,dY,p);
    c+=count(x,y,-dX,-dY,p);
    if(c>max)max=c;
  }
  if(max>=5)return 100;
  if(max===4)return 80;
  if(max===3)return 40;
  if(max===2)return 10;
  return 0;
}

function count(x,y,dx,dy,p){
  let c=0,nx=x+dx,ny=y+dy;
  while(nx>=0&&nx<SIZE&&ny>=0&&ny<SIZE&&board[ny][nx]===p){
    c++;nx+=dx;ny+=dy;
  }
  return c;
}

function centerScore(x,y){
  const c=7;
  const d=Math.abs(x-c)+Math.abs(y-c);
  return Math.max(0,14-d);
}

function checkWin(x,y,p){
  return lineScore(x,y,p)>=100;
}

function showJudge(score){
  let t="悪手";
  if(score>=120)t="神の一手";
  else if(score>=80)t="かなり良い";
  else if(score>=50)t="良い";
  else if(score>=20)t="微妙";
  judgeText.textContent=`評価：${t}（${score}点）`;
}

function learn(keys,win){
  keys.forEach(k=>{
    memory[k]=(memory[k]||0)+(win?1:-1);
  });
  localStorage.setItem("gomokuMemory",JSON.stringify(memory));
}

function clearScores(){
  document.querySelectorAll(".score").forEach(e=>e.remove());
}

function showCandidateScores(){
  clearScores();
  if(currentPlayer!==1)return;
  for(let y=0;y<SIZE;y++){
    for(let x=0;x<SIZE;x++){
      if(board[y][x]===0){
        const s=evaluateMove(x,y,1).score;
        if(s>0){
          const cell=document.querySelector(`.cell[data-x="${x}"][data-y="${y}"]`);
          const d=document.createElement("div");
          d.className="score";
          d.textContent=s;
          cell.appendChild(d);
        }
      }
    }
  }
}

showCandidateScores();
