import { useTheme } from "./theme";

function App() {
  const { theme, toggle } = useTheme();
  return (
    <main>
      <button className="btn" onClick={toggle}>
        {theme === "dark" ? "modo claro" : "modo escuro"}
      </button>
      <h1>Diogo Pinto</h1>
      <p>Estudante de Engenharia Informática · ISEC</p>
    
      <div>
        <span className="tag">Java</span>
        <span className="tag">JavaFX</span>
        <span className="tag accent">AI</span>
      </div>
    </main>
  )
}

export default App
