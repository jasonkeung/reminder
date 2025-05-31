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
  const [connected, setConnected] = useState(false);
  const [world, setWorld] = useState(null);

  const onLoginSuccess = (idToken, user) => {
    localStorage.setItem('idToken', idToken)
    setIdToken(idToken);
    setUser(user);
    api.connectWebSocket(idToken, setConnected);

  };

  useEffect(() => {
    if (connected) {
      api.getWorld(
        idToken,
        (response) => {
          setWorld(response);
          console.log('World data received from get:', response);
        },
        () => { throw new Error('Token expired, please login again.'); }
      );
    }
  }, [connected]);

  useEffect(() => {
    if (idToken && !user) {
      api.postLogin(
        idToken,
        (response) => {
          if (response) {
            onLoginSuccess(idToken, response);
          }
        },
        () => {
          console.error('Token expired, please login again.');
          setIdToken(null);
          setUser(null);
          localStorage.removeItem('idToken');
        }
      );
    }
  }, []);

  useEffect(() => {
    console.log("gameRef.current:", gameRef.current, "world:", world);
    if (!gameRef.current && world) {
      const config = {
        type: Phaser.AUTO,
        backgroundColor: '#202030',
        parent: 'phaser-game',
        scene: [new GameScene(world.mapName, world.objects, world.players)],
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
  }, [world]);

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
        <Login user={user} onLoginSuccess={onLoginSuccess} />
      </header>
      <button
        onClick={() => api.startMove(idToken)}
        disabled={!connected}
        style={{
          padding: '8px 16px',
          fontSize: '16px',
          marginRight: '10px',
          cursor: connected ? 'pointer' : 'not-allowed'
        }}
      >
        Start
      </button>
      <div className="phaser-container" id="phaser-game" />
    </div>
  );
}

export default App;
