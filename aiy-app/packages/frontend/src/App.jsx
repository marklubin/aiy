import Chat from './components/Chat';

function App() {
  return (
    <div style={styles.appContainer}>
      <Chat />
    </div>
  );
}

const styles = {
  appContainer: {
    display: 'flex',
    justifyContent: 'center', // Centers Chat horizontally
    alignItems: 'center', // Centers vertically if needed
    width: '100vw',
    height: '100vh',
    backgroundColor: '#000', // Keep the cyberpunk theme
  },
};

export default App;