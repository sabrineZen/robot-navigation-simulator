import './App.css'
import EasyLevel from "./pages/EasyLevel"
import HardLevel from "./pages/HardLevel"
import MediumLevel from './pages/MediumLevel';
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";



function App() {

  return (
    <>
       <BrowserRouter>
      <Routes>
        <Route path="/home" element={<Home />} />
        <Route path="/medium-level" element={<MediumLevel />} />
        <Route path="/hard-level" element={<HardLevel />} />
        <Route path="/easy-level" element={<EasyLevel />} />

      </Routes>
           </BrowserRouter>

    </>
  )
}

export default App
