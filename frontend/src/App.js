import './App.css';
import { api } from './api';
import Login from './Login'; 

import React, { useState, useEffect } from 'react';


function App() {

  const [ping, setPing] = useState(false);
  const [idToken, setIdToken] = useState(null);
  const [loginCount, setLoginCount] = useState(0);

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
        <div style={{ position: 'absolute', top: '10px', right: '10px' }}>
          <span>
            {idToken ? `Logged In ${loginCount > 0 ? loginCount : ""}` : 'Logged Out'}
          </span>
        </div>
        <div>
          <h2>Login</h2>
          <Login onLoginSuccess={setIdToken} />
        </div>
      </header>
    </div>
  );
}

export default App;
