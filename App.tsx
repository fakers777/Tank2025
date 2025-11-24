import React, { useState } from 'react';
import Game from './components/Game';
import { CONFIG } from './constants';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<'MENU' | 'PLAYING' | 'GAMEOVER'>('MENU');
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [highScore, setHighScore] = useState(0);
  const [gameId, setGameId] = useState(0);

  // Safe defaults in case CONFIG is undefined or empty
  const GAME_WIDTH = (CONFIG && CONFIG.width) ? CONFIG.width : 832;
  const GAME_HEIGHT = (CONFIG && CONFIG.height) ? CONFIG.height : 832;

  const startGame = () => {
    setScore(0);
    setLives(3);
    setGameState('PLAYING');
    setGameId(prev => prev + 1);
  };

  const handleGameOver = (finalScore: number, win: boolean) => {
    setGameState('GAMEOVER');
    if (finalScore > highScore) {
      setHighScore(finalScore);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-900 text-white flex flex-col items-center justify-center p-4">
      <div className="flex gap-8 items-start">
        {/* Main Game Container */}
        <div className="relative">
          {/* Header UI */}
          <div className="bg-gray-800 border-t-4 border-l-4 border-r-4 border-gray-600 p-4 flex justify-between items-center w-full" style={{ width: GAME_WIDTH + 8 }}>
            <div className="flex items-center gap-2 text-yellow-400">
               <span>🏆</span>
               <span className="text-sm">最高分: {highScore}</span>
            </div>
            <h1 className="text-xl font-bold tracking-widest text-red-500 drop-shadow-md">TANK 1990</h1>
            <div className="flex items-center gap-4">
               <div className="flex items-center gap-2 text-green-400">
                  <span>🎯</span>
                  <span>{score}</span>
               </div>
               <div className="flex items-center gap-2 text-red-400">
                  <span>❤️</span>
                  <span>{lives}</span>
               </div>
            </div>
          </div>

          {/* Game Area */}
          {gameState === 'PLAYING' && (
            <Game 
              key={gameId}
              onGameOver={handleGameOver} 
              setScore={setScore} 
              setLives={setLives}
            />
          )}

          {/* Menus */}
          {gameState === 'MENU' && (
             <div className="absolute top-0 bottom-0 left-0 right-0 bg-black border-4 border-gray-600 flex flex-col items-center justify-center z-10" style={{ width: GAME_WIDTH + 8, marginTop: 0 }}>
                <h1 className="text-6xl text-red-600 font-bold mb-8 drop-shadow-lg" style={{ fontFamily: 'Press Start 2P' }}>BATTLE CITY</h1>
                <div className="text-yellow-400 text-center space-y-4 mb-12">
                   <p>I - 1 PLAYER</p>
                   <p className="text-gray-500">II - 2 PLAYERS (N/A)</p>
                   <p className="text-gray-500">CONSTRUCTION</p>
                </div>
                
                <button 
                  onClick={startGame}
                  className="px-8 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded shadow-lg transform transition active:scale-95 text-lg"
                >
                  START GAME
                </button>
                
                <div className="mt-8 text-xs text-gray-400 text-center">
                  <p>WASD / ARROWS to Move</p>
                  <p>SPACE / ENTER to Fire</p>
                </div>
             </div>
          )}

          {gameState === 'GAMEOVER' && (
             <div className="absolute top-0 bottom-0 left-0 right-0 bg-black/90 border-4 border-gray-600 flex flex-col items-center justify-center z-10" style={{ width: GAME_WIDTH + 8 }}>
                <h2 className="text-5xl text-red-600 font-bold mb-4">GAME OVER</h2>
                <div className="text-2xl text-white mb-8">
                   SCORE: <span className="text-green-400">{score}</span>
                </div>
                
                <button 
                  onClick={() => setGameState('MENU')}
                  className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded shadow-lg transition"
                >
                  <span>🔄</span>
                  Main Menu
                </button>
             </div>
          )}
        </div>

        {/* Legend / Sidebar */}
        <div className="hidden lg:block w-64 bg-gray-800 border-4 border-gray-600 p-4 h-[600px]">
          <h3 className="text-center text-gray-400 mb-6 border-b border-gray-600 pb-2">图例</h3>
          <div className="space-y-4">
             <div className="flex items-center gap-3">
               <div className="w-8 h-8 bg-yellow-400 border-2 border-white"></div>
               <span className="text-sm">玩家 (Player)</span>
             </div>
             <div className="flex items-center gap-3">
               <div className="w-8 h-8 bg-gray-400"></div>
               <span className="text-sm">普通坦克 (100)</span>
             </div>
             <div className="flex items-center gap-3">
               <div className="w-8 h-8 bg-pink-400"></div>
               <span className="text-sm">快速坦克 (200)</span>
             </div>
             <div className="flex items-center gap-3">
               <div className="w-8 h-8 bg-teal-600 border-t-4 border-red-500"></div>
               <span className="text-sm">重型坦克 (400)</span>
             </div>
             <div className="h-4"></div>
             <div className="flex items-center gap-3">
               <div className="w-8 h-8 bg-[#A52A2A]"></div>
               <span className="text-sm">砖墙 (可毁)</span>
             </div>
             <div className="flex items-center gap-3">
               <div className="w-8 h-8 bg-[#C0C0C0] border-2 border-white"></div>
               <span className="text-sm">钢板 (不可毁)</span>
             </div>
             <div className="flex items-center gap-3">
               <div className="w-8 h-8 flex items-center justify-center bg-black">
                 <div className="text-yellow-500 font-bold text-xs">🦅</div>
               </div>
               <span className="text-sm">基地 (保护它!)</span>
             </div>
          </div>
        </div>
      </div>
      
      <div className="mt-8 text-gray-500 text-xs">
         Classic Battle City Remake Concept
      </div>
    </div>
  );
};

export default App;