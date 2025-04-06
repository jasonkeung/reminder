import './App.css';
import { api } from './api';
import Login from './Login';

import React, { useState, useEffect } from 'react';


function App() {

  const [ping, setPing] = useState(false);
  const [idToken, setIdToken] = useState(null);
  const [loginCount, setLoginCount] = useState(0);
  const [user, setUser] = useState(null);

  const onLoginSuccess = (idToken, user) => {
    setIdToken(idToken);
    setUser(user);
  }

  useEffect(() => {
    api.ping(() => setPing(true));
    if (idToken != null) {
      api.getLoginCount(idToken, setLoginCount);
    }
  }, [idToken]);

  return (
    <div className="App">
      <header className="App-header">
        <div style={{ position: 'absolute', top: '10px', left: '10px', display: 'flex', alignItems: 'center' }}>
          <div
            style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              backgroundColor: ping ? 'green' : 'red',
              marginRight: '10px',
            }}
          ></div>
          <span>{ping ? 'Online' : 'Offline'}</span>
        </div>
        <Login user={user} onLoginSuccess={onLoginSuccess} loginCount={loginCount} />
      </header>
    </div>
  );
}

export default App;
