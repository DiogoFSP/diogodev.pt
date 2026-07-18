import { useEffect, useState } from "react";
import { Route, Routes, useLocation } from "react-router-dom";
import CmdPalette from "./components/CmdPalette";
import Spotlight from "./components/Spotlight";
import TopNav from "./components/TopNav";
import Admin from "./pages/Admin";
import Contact from "./pages/Contact";
import Home from "./pages/Home";
import Project from "./pages/Project";

// repõe o scroll no topo quando a rota muda
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function App() {
  const [paletteOpen, setPaletteOpen] = useState(false);
  const { pathname } = useLocation();
  const isAdmin = pathname.startsWith("/admin");

  return (
    <>
      <ScrollToTop />
      {!isAdmin && <Spotlight />}
      <div style={{ position: "relative", zIndex: 2 }}>
        {!isAdmin && <TopNav onPalette={() => setPaletteOpen(true)} />}
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/projeto/:slug" element={<Project />} />
          <Route path="/contacto" element={<Contact />} />
          <Route path="/admin" element={<Admin />} />
        </Routes>
      </div>
      <CmdPalette open={paletteOpen} setOpen={setPaletteOpen} />
    </>
  );
}

export default App;
