import React, { useState, useEffect } from 'react';

function App() {
  const [currentData, setCurrentData] = useState(0);

  function StartWorker() {
    const worker = new Worker('demo_workers.js');
    worker.postMessage('Hello Worker');
    worker.onmessage = e => {
      setCurrentData(e.data);
    }
  }

  return (
    <div className="App">
      <button onClick={StartWorker}>Start</button>
      <p>Worker data: {currentData}</p>
    </div>
  );
}

export default App;
