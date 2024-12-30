import './App.css';
import { api } from './api';

import React, { useState, useEffect } from 'react';


function App() {

  const [data, setData] = useState(null);

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


  return (
    <div className="App">
      <header className="App-header">
        
        <p>
        {data?.message}
        </p>
      </header>
    </div>
  );
}

export default App;
