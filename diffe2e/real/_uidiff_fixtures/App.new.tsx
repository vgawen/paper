import React from 'react';
import logo from './logo.svg';
import './App.css';

const App = () => {
  const [backgroundColor, setBackgroundColor] = React.useState("#1abc9c")
  const handleMakeTurquoise = () => {
    setBackgroundColor("#1abc9c")
  }
  const handlePaintCrimson = () => {
    setBackgroundColor("#c0392b")
  }
  const handleMakeYellow = () => {
    setBackgroundColor("#f1c40f")
  }
  const handleMakeGreen = () => {
    setBackgroundColor("#2ecc71")
  }
  return (
    <div className="App">
      <header className="App-header" style={{ backgroundColor }}>
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.js</code> and save to reload.
        </p>
        <a
          className="App-link"
          href="https://react.dev"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
        <span>Current color: {backgroundColor}</span>
        <div className="btn-group-colors">
          <button data-testid="turquoise-btn" onClick={handleMakeTurquoise}>Turquoise</button>
          <button onClick={handlePaintCrimson}>Crimson</button>
          <button onClick={handleMakeYellow}>Yellow</button>
          <button onClick={handleMakeGreen}>Green</button>
        </div>
      </header>
    </div>
  );
}

export default App;
