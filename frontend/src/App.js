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
  const [worldData, setWorldData] = useState(null);

  const onLoginSuccess = (idToken, user) => {
    localStorage.setItem('idToken', idToken)
    setIdToken(idToken);
    setUser(user);
  };

  useEffect(() => {
    api.connectWebSocket(setConnected);
    api.getWorldData(
      (data) => {
        console.log("World data received:", data);
        setWorldData(data);
      },
      (error) => {
        console.error("Failed to fetch world data:", error);
      }
    );
  }, []);

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
    console.log("gameRef.current:", gameRef.current, "worldData:", worldData);
    if (!gameRef.current && worldData) {
      const gameScene = new GameScene(worldData.mapName, worldData.players);
      const config = {
        type: Phaser.AUTO,
        backgroundColor: '#202030',
        parent: 'phaser-game',
        scene: [gameScene],
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
        render: {
          pixelArt: true,
          antialias: false
        }
      };
      gameRef.current = new Phaser.Game(config);
    }
    return () => {
      if (gameRef.current) {
        gameRef.current.destroy(true);
        gameRef.current = null;
      }
    }
  }, [worldData]);

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
      <div className="phaser-container" id="phaser-game" />
    </div>
  );
}

export default App;
