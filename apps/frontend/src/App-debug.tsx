

console.log('App component is loading...');

function App() {
  console.log('App component is rendering...');
  
  return (
    <div style={{ padding: '20px', backgroundColor: 'red', color: 'white' }}>
      <h1>DEBUG: React App is Working!</h1>
      <p>If you can see this red box, React is working correctly.</p>
    </div>
  );
}

export default App;
