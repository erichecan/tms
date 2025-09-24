import React from 'react';
import ReactDOM from 'react-dom/client';

console.log('Main test starting...');

function App() {
  console.log('App rendering...');
  return React.createElement('div', {
    style: {
      padding: '20px',
      backgroundColor: 'lightblue',
      border: '2px solid blue',
      fontSize: '24px',
      fontWeight: 'bold'
    }
  }, 'VITE + REACT TEST - If you see this, everything works!');
}

console.log('Creating root...');
const root = ReactDOM.createRoot(document.getElementById('root')!);

console.log('Rendering app...');
root.render(React.createElement(App));

console.log('Main test completed');
