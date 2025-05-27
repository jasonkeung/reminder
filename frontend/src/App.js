import './App.css';
import { api } from './api';
import Phaser from 'phaser'
import GameScene from './GameScene';
import Login from './Login';

import React, { useRef, useState, useEffect } from 'react';


function App() {

  const gameRef = useRef(null);
  const [idToken, setIdToken] = useState(() => localStorage.getItem('idToken'))
  const [user, setUser] = useState(null);

  const onLoginSuccess = (idToken, user) => {
    localStorage.setItem('idToken', idToken)
    setIdToken(idToken);
  }


  useEffect(() => {
    if (!gameRef.current) {
      const config = {
        type: Phaser.AUTO,
        backgroundColor: '#202030',
        parent: 'phaser-game',
        scene: [new GameScene()],
        scale: {
          mode: Phaser.Scale.RESIZE,
          autoCenter: Phaser.Scale.CENTER_BOTH,
          width: '100%',
          height: '100%',
        },
        physics: {
          default: 'arcade',
          arcade: {
            gravity: { y: 0 },
            debug: false
          }
        },
      };
      gameRef.current = new Phaser.Game(config);
    }
    return () => {
      if (gameRef.current) {
        gameRef.current.destroy(true);
        gameRef.current = null;
      }
    }
  }, []);

  return (
    <div className="App">
      <header className="App-header">
        <div style={{
          position: 'absolute',
          top: '10px',
          left: '10px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-start',
          gap: '10px',
        }}>
        </div>
        <Login user={user} onLoginSuccess={onLoginSuccess} />
      </header>

      <div className="phaser-container" id="phaser-game" />
    </div>
  );
}

export default App;
