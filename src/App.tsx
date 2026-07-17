import { useEffect } from "react";
import { Route, Routes, useLocation } from "react-router-dom";
import TopNav from "./components/TopNav";
import Contact from "./pages/Contact";
import Home from "./pages/Home";
import Project from "./pages/Project";

// Numa SPA a navegação não recarrega a página, logo o browser mantém o
// scroll onde estava. Este componente repõe o topo sempre que a rota muda.
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function App() {
  return (
    <>
      <ScrollToTop />
      <TopNav />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/projeto/:slug" element={<Project />} />
        <Route path="/contacto" element={<Contact />} />
      </Routes>
    </>
  );
}

export default App;
