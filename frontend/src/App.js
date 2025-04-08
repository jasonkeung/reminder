import './App.css';
import { api } from './api';
import Phaser from 'phaser'
import GameScene from './GameScene';
import Login from './Login';

import React, { useState, useEffect } from 'react';


function App() {

  const [game, setGame] = useState(null);
  const [connected, setConnected] = useState(false);
  const [loginCount, setLoginCount] = useState(0);
  const [idToken, setIdToken] = useState(() => localStorage.getItem('idToken'))
  const [user, setUser] = useState(null);

  const onLoginSuccess = (idToken, user) => {
    localStorage.setItem('idToken', idToken)
    setIdToken(idToken);
    setUser(user);
    api.connectWebSocket(idToken, setConnected);
  }

  const onTokenExpired = () => {
    localStorage.removeItem('idToken')
    setIdToken(null);
    setUser(null);
  }

  useEffect(() => {
    const interval = setInterval(() => api.pingWs(setConnected), 10000);
    return () => clearInterval(interval);
  }, []);


  useEffect(() => {
    if (connected && user && !game) {
      const config = {
        type: Phaser.AUTO,
        backgroundColor: '#202030',
        parent: 'phaser-game',
        scene: [new GameScene({ user: user })], // Pass your variable here
        scale: {
          mode: Phaser.Scale.RESIZE, // Auto-resizes the game when window size changes
          autoCenter: Phaser.Scale.CENTER_BOTH, // Center canvas in both directions
          width: '100%',
          height: '100%',
        },
        physics: {
          default: 'arcade',
          arcade: {
            gravity: { y: 0 }, // No gravity if it's top-down
            debug: true // Optional, shows collision boxes
          }
        },
      };
      setGame(new Phaser.Game(config));
    } else if (!connected && game) {
      game.destroy(true);
      setGame(null);
    }
    return () => {
      if (game) {
        game.destroy(true)
      }
    }
  }, [connected, game, user]);

  useEffect(() => {
    if (idToken != null) {
      api.getLoginCount(idToken, setLoginCount, onTokenExpired);
    }

  }, [idToken]);

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
          <div
            style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              backgroundColor: connected ? 'green' : 'red'
            }} />
          <span>{connected ? 'Online' : 'Offline'}</span>
        </div>
        <Login user={user} onLoginSuccess={onLoginSuccess} loginCount={loginCount} />
      </header>

      <div className="phaser-container" id="phaser-game" />
    </div>
  );
}

export default App;
