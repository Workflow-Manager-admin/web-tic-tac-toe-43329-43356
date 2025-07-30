import React, { useState, useEffect } from 'react';
import './App.css';

/**
 * Color theme overrides for minimal light design.
 * main colors: primary: #1976D2, secondary: #424242, accent: #FFC107
 */
const COLOR_PRIMARY = '#1976D2';
const COLOR_SECONDARY = '#424242';
const COLOR_ACCENT = '#FFC107';

const emptyBoard = () => Array(9).fill(null);

// Utility functions for game logic
function calculateWinner(squares) {
  const lines = [
    [0,1,2],[3,4,5],[6,7,8], // rows
    [0,3,6],[1,4,7],[2,5,8], // cols
    [0,4,8],[2,4,6] // diag
  ];
  for (let [a, b, c] of lines) {
    if (squares[a] && squares[a] === squares[b] && squares[b] === squares[c]) {
      return squares[a];
    }
  }
  return null;
}

// Backend API
const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:8000/api'; // Override via .env for deployment

// PUBLIC_INTERFACE
function App() {
  // Theme & UI
  const [theme, setTheme] = useState('light');
  // Game logic state
  const [board, setBoard] = useState(emptyBoard());
  const [xIsNext, setXIsNext] = useState(true);
  const [mode, setMode] = useState('human'); // 'human' or 'computer'
  const [status, setStatus] = useState('Ready');
  const [gameOver, setGameOver] = useState(false);

  // History & score
  const [history, setHistory] = useState([]);
  const [scores, setScores] = useState({X:0, O:0, ties:0});

  // Startup: fetch history and scores from backend
  useEffect(() => {
    // Load game history and scores from backend
    fetchHistory();
    fetchScores();
  }, []);

  // Update game status when board changes
  useEffect(() => {
    const winner = calculateWinner(board);
    if (winner) {
      setStatus(`Winner: ${winner}`);
      setGameOver(true);
      updateScores(winner);
      saveGameToHistory(board, winner);
    } else if (board.every(cell => cell !== null)) {
      setStatus('Draw');
      setGameOver(true);
      updateScores('tie');
      saveGameToHistory(board, 'tie');
    } else {
      setStatus(`Turn: ${xIsNext ? 'X' : 'O'}`);
      setGameOver(false);
    }
    // eslint-disable-next-line
  }, [board]);

  // Computer move effect
  useEffect(() => {
    if (
      mode === "computer" &&
      !gameOver &&
      !xIsNext // O is always computer in this simple impl, X always human
    ) {
      // Small delay for realism
      const t = setTimeout(() => {
        doComputerMove();
      }, 500);
      return () => clearTimeout(t);
    }
    // eslint-disable-next-line
  }, [xIsNext, gameOver, mode, board]);

  // Theme to <html>
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // PUBLIC_INTERFACE
  const toggleTheme = () => setTheme(theme === "light" ? "dark" : "light");

  // PUBLIC_INTERFACE
  function handleSquareClick(idx) {
    if (gameOver || board[idx]) return;
    if (mode === 'computer' && !xIsNext) return; // don't play in computer turn
    const next = board.slice();
    next[idx] = xIsNext ? "X" : "O";
    setBoard(next);
    setXIsNext(!xIsNext);
  }

  // PUBLIC_INTERFACE
  function handleModeChange(evt) {
    setMode(evt.target.value);
    handleNewGame(); // reset
  }

  // PUBLIC_INTERFACE
  function handleNewGame() {
    setBoard(emptyBoard());
    setXIsNext(true);
    setGameOver(false);
    setStatus('Ready');
  }

  // PUBLIC_INTERFACE
  function handleHistoryItemClick(item) {
    setBoard(item.board);
    setGameOver(true);
    setStatus(item.result === 'tie' ? 'Draw' : `Winner: ${item.result}`);
  }

  // PUBLIC_INTERFACE
  function doComputerMove() {
    // simple AI: pick a random empty cell
    const empties = board.map((v,i)=>v===null?i:null).filter(i=>i!==null);
    if(empties.length===0) return;
    const idx = empties[Math.floor(Math.random()*empties.length)];
    const next = board.slice();
    next[idx] = "O";
    setBoard(next);
    setXIsNext(true);
  }

  // PUBLIC_INTERFACE
  async function fetchHistory() {
    // Optionally: await fetch(`${API_BASE}/history`) if available
    setHistory([]); // Replace [] w/fetched data
    // For now, local history only
  }

  // PUBLIC_INTERFACE
  async function fetchScores() {
    // Optionally: await fetch(`${API_BASE}/scores`)
    setScores({X:0, O:0, ties:0}); // Replace with fetched data
  }

  // PUBLIC_INTERFACE
  function updateScores(winner) {
    if (winner === "X") setScores(s => ({...s,X:s.X+1}));
    else if (winner === "O") setScores(s => ({...s,O:s.O+1}));
    else setScores(s => ({...s, ties: s.ties+1}));
    // TODO: send to backend for persistence
  }

  // PUBLIC_INTERFACE
  function saveGameToHistory(finalBoard, winner) {
    const item = {
      board: [...finalBoard],
      result: (winner==="tie"?"tie":winner),
      date: new Date().toISOString()
    };
    setHistory(h => [item, ...h].slice(0,10));
    // TODO: send to backend for persistence
  }

  // -- Render Components --

  function renderSquare(i) {
    return (
      <button
        key={i}
        className="ttt-square"
        style={{
          color: board[i]==="X"?COLOR_PRIMARY: (board[i]==="O"?COLOR_ACCENT:COLOR_SECONDARY),
          border: '1px solid var(--border-color, #e9ecef)'
        }}
        onClick={() => handleSquareClick(i)}
        aria-label={`Square ${i}, ${board[i]||"empty"}`}
      >{board[i]}</button>
    );
  }

  // PUBLIC_INTERFACE
  return (
    <div className="App" style={{ background: 'var(--bg-primary)',  minHeight: '100vh'}}>
      {/* Top bar and controls */}
      <header className="App-header" style={{
        minHeight:"auto",padding:"1rem 0 .6rem 0",
        backgroundColor: 'var(--bg-secondary)',
        borderBottom: `2px solid ${COLOR_SECONDARY}22`
      }}>
        <div style={{
          display:"flex",justifyContent:"space-between",alignItems:"center",maxWidth:700,margin:"0 auto"
        }}>
          <button className="theme-toggle"
            style={{
              background: COLOR_ACCENT,
              color: '#212121',
              border: 0
            }}
            onClick={toggleTheme}>
            {theme === 'light' ? '🌙 Dark' : '☀️ Light'}
          </button>
          <h2 style={{
            margin:"0 auto",color:COLOR_PRIMARY,fontWeight:700,fontSize:"1.8rem",letterSpacing:1
          }}>Tic Tac Toe</h2>
          <div style={{width:"62px"}}></div>
        </div>
      </header>

      {/* Controls below top bar */}
      <section style={{
        display:"flex",justifyContent:"center",alignItems:"center",gap:"1rem",margin:".7rem 0"
      }}>
        <button style={{
            background:COLOR_PRIMARY,color:"#fff",
            border:"none",borderRadius:"5px",padding:"8px 16px",marginRight:8,
            fontWeight: "bold",fontSize:"1rem"
          }}
          onClick={handleNewGame}
          disabled={board.every(cell => cell===null) && !gameOver}
        >New Game</button>
        <select aria-label="Game Mode" value={mode} onChange={handleModeChange} style={{
          background: "white", color: COLOR_SECONDARY,
          fontWeight:"bold",border:`1.5px solid ${COLOR_PRIMARY}`,
          borderRadius:"5px",padding:"7px 12px"}}
        >
          <option value="human">2 Player</option>
          <option value="computer">Vs Computer</option>
        </select>
        <span style={{
          color: COLOR_SECONDARY, fontWeight:500, fontSize:"1rem",marginLeft:"12px"
        }}>Mode: {mode==="human"? "Two Player" : "Vs Computer"}</span>
      </section>

      {/* Main Content */}
      <main className="ttt-main" style={{
        display:"flex",flexDirection:"row",justifyContent:"center",alignItems:"flex-start",
        gap:"2.5vw",maxWidth:960,margin:"0 auto",padding:'1rem 0'
      }}>
        {/* History/Score pane (LEFT on desktop, TOP in mobile) */}
        <aside className="ttt-aside" style={{
          minWidth:170,maxWidth:250,
          flex: '0 0 180px',
          fontSize:"1rem"
        }}>
          <div style={{
            background:"#f5f6fa",borderRadius:9,boxShadow:"0 1px 3px rgba(22,22,22,0.03)",
            padding:"1.2em .8em",marginBottom:14,border:`1.5px solid ${COLOR_PRIMARY}11`
          }}>
            <h4 style={{marginTop:0,marginBottom:10,color:COLOR_SECONDARY,fontWeight:700}}>
              Scores
            </h4>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:2}}>
              <span style={{color:COLOR_PRIMARY}}>X</span>
              <span>{scores.X}</span>
            </div>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:2}}>
              <span style={{color:COLOR_ACCENT}}>O</span>
              <span>{scores.O}</span>
            </div>
            <div style={{display:"flex",justifyContent:"space-between"}}>
              <span style={{color:COLOR_SECONDARY}}>Draws</span>
              <span>{scores.ties}</span>
            </div>
          </div>
          <div style={{
            background:"#fafafa",borderRadius:9,boxShadow:"0 1px 2px rgba(50,50,50,0.03)",
            padding:"1.1em .8em",marginBottom:6,border:`1.5px solid ${COLOR_SECONDARY}13`
          }}>
            <h4 style={{marginTop:0,marginBottom:7,color:COLOR_SECONDARY, fontWeight:700}}>History</h4>
            {history.length === 0
              ? <div style={{color:"#aaa"}}>No games yet.</div>
              : <ul className="ttt-hist" style={{listStyle:"none",paddingLeft:0,margin:0,maxHeight:180,overflow:"auto"}}>
                  {history.map((item,i) =>
                    <li style={{marginBottom:6,whiteSpace:"nowrap"}} key={i}>
                      <button 
                        onClick={()=>handleHistoryItemClick(item)}
                        style={{
                          border:"none",outline:"none",background:"none",cursor:"pointer",
                          color: item.result==="X" ? COLOR_PRIMARY : (item.result==="O"?COLOR_ACCENT:COLOR_SECONDARY),
                          fontWeight: item.result==="tie"?400:600,
                          fontFamily:"inherit"
                        }}>
                        [{item.result === "tie"? 'Draw': `${item.result} won`}]
                        {" "}
                        {String(new Date(item.date).toLocaleString())}
                      </button>
                    </li>
                  )}
                </ul>
            }
          </div>
        </aside>

        {/* Main board */}
        <div className="ttt-center" style={{
          background: "#fff",margin:0,padding:"2rem 1.3rem 2rem 1.3rem",borderRadius:"20px",
          minWidth:265,maxWidth:335,boxShadow:"0 1.5px 8px rgba(80,80,80,.07)",display:"flex",flexDirection:"column",alignItems:"center"
        }}>
          <div className="ttt-status" style={{
              marginBottom:20,minHeight:38,color:COLOR_SECONDARY,fontWeight:600,letterSpacing:.3,fontSize:"1.13rem"
            }}>
            {status}
          </div>
          <div className="ttt-board" style={{
            display:"grid",gridTemplateColumns:"repeat(3,64px)",gridTemplateRows:"repeat(3,64px)",
            gap:"6px",marginBottom:14
          }}>
            {Array(9).fill(null).map((_,i)=>renderSquare(i))}
          </div>
        </div>
      </main>

      {/* Responsive: show aside below on mobile */}
      <style>
      {`
      @media (max-width: 700px) {
        .ttt-main {
          flex-direction: column;
          align-items: stretch;
        }
        .ttt-aside {
          order: 2;
          flex: 0 0 auto;
          margin-bottom: 0.8rem;
          min-width:unset;max-width:unset;
        }
        .ttt-center {
          margin-left:auto;
          margin-right:auto;
        }
      }
      .ttt-square {
        background: #fafbfc;
        font-size: 2rem;
        width: 62px;
        height: 62px;
        margin: 0; padding: 0;
        border-radius: 8px;
        font-weight: 700;
        outline: none;
        transition: background 0.13s, color 0.13s;
        cursor: pointer;
        box-shadow: 0 0.4px 1px #1976d222;
      }
      .ttt-square:disabled, .ttt-square[aria-disabled="true"] {
        color: #aaa; cursor: default;
        background: #f5f5f9;
      }
      .ttt-square:active {
        background: #e3eaf7;
      }
      `}
      </style>

      <footer style={{margin:'1.5rem 0',color:'#bbb',fontSize:".9rem"}}>
        <span>Minimalistic Tic Tac Toe &copy; Kavia 2024</span>
      </footer>
    </div>
  );
}

export default App;
