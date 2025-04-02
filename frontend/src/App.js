import './App.css';
import { api } from './api';
import Login from './Login'; 

import React, { useState, useEffect } from 'react';


function App() {

  const [data, setData] = useState(null);
  const [idToken, setIdToken] = useState(null);

  useEffect(() => {
    const fetchTestData = async () => {
      try {
        const result = await api.get('/test');
        setData(result);
      } catch (error) {
        console.error('Failed to fetch data:', error);
      }
    };
    
    fetchTestData();
  }, []);

  const handleLoginSuccess = (token) => {
    setIdToken(token);
    console.log("Token received:", token);
  }

  const fetchSecureData = async () => {
    if (!idToken) {
      console.error('No ID token available. Please log in first.');
      return;
    }
    try {
      const result = await api.get('/secure-data', {
        headers: {
            Authorization: `Bearer ${idToken}`
        }
      });
      setData(result);
    } catch (error) {
        console.error('Failed to fetch secure data:', error);
    }
  }


  return (
    <div className="App">
      <header className="App-header">
        
        <p>
        data: {JSON.stringify(data)}
        </p>

        <button onClick={() => fetchSecureData()}>Make firebase secure call</button>

        <div>
          <h2>Login</h2>
          <Login onLoginSuccess={handleLoginSuccess}/>
        </div>
      </header>
    </div>
  );
}

export default App;
