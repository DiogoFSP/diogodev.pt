import { lazy, Suspense, useEffect, useState } from "react";
import { Route, Routes, useLocation } from "react-router-dom";
import CmdPalette from "./components/CmdPalette";
import Spotlight from "./components/Spotlight";
import TopNav from "./components/TopNav";
import Contact from "./pages/Contact";
import Home from "./pages/Home";
import NotFound from "./pages/NotFound";
import Project from "./pages/Project";
import ProjectDemo from "./pages/ProjectDemo";
import { recordPageView } from "./projectsStore";

// o admin é a maior página do site e só interessa a uma pessoa; fica num
// ficheiro à parte para os visitantes não o descarregarem sem precisar
const Admin = lazy(() => import("./pages/Admin"));

// repõe o scroll no topo quando a rota muda
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

// regista a visita na base de dados quando a rota muda (o admin não conta)
function TrackViews() {
  const { pathname } = useLocation();
  useEffect(() => {
    if (pathname.startsWith("/admin")) return;
    recordPageView(pathname).catch(() => {});
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
      <TrackViews />
      {!isAdmin && <Spotlight />}
      <div style={{ position: "relative", zIndex: 2 }}>
        {!isAdmin && <TopNav onPalette={() => setPaletteOpen(true)} />}
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/projeto/:slug" element={<Project />} />
          <Route path="/projeto/:slug/demo" element={<ProjectDemo />} />
          <Route path="/contacto" element={<Contact />} />
          <Route
            path="/admin"
            element={
              <Suspense fallback={<main style={{ minHeight: "60vh" }} />}>
                <Admin />
              </Suspense>
            }
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
      <CmdPalette open={paletteOpen} setOpen={setPaletteOpen} />
    </>
  );
}

export default App;
