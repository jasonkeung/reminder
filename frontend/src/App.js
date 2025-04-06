import './App.css';
import { api } from './api';
import Phaser from 'phaser'
import GameScene from './GameScene';
import Login from './Login';

import React, { useState, useEffect } from 'react';


function App() {

  const [ping, setPing] = useState(false);
  const [loginCount, setLoginCount] = useState(0);
  const [idToken, setIdToken] = useState(() => localStorage.getItem('idToken'))
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('user')
    return stored ? JSON.parse(stored) : null
  })

  const onLoginSuccess = (idToken, user) => {
    localStorage.setItem('idToken', idToken)
    localStorage.setItem('user', JSON.stringify(user))
    setIdToken(idToken);
    setUser(user);
  }

  useEffect(() => {
    api.ping(() => setPing(true));
    if (idToken != null) {
      api.getLoginCount(idToken, setLoginCount);
    }

    const config = {
      type: Phaser.AUTO,
      backgroundColor: '#202030',
      parent: 'phaser-game',
      scene: [GameScene],
      scale: {
        mode: Phaser.Scale.RESIZE, // Auto-resizes the game when window size changes
        autoCenter: Phaser.Scale.CENTER_BOTH, // Center canvas in both directions
        width: '100%',
        height: '100%',
      }
    };

    const game = new Phaser.Game(config)

    return () => {
      game.destroy(true)
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
              backgroundColor: ping ? 'green' : 'red'
            }} />
          <span>{ping ? 'Online' : 'Offline'}</span>
        </div>
        <Login user={user} onLoginSuccess={onLoginSuccess} loginCount={loginCount} />
      </header>

      <div className="phaser-container" id="phaser-game" />
    </div>
  );
}

export default App;
