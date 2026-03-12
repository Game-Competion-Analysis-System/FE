import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Authen/Login";
import Register from "./pages/Authen/Register";
import GameSelection from "./pages/GameSelection";
import ServerSelection from "./pages/ServerSelection";
import Analyze from "./pages/Analyze";
import History from "./pages/History/History";
import Dashboard from "./pages/Dashboard";
import AdminUsers from "./pages/AdminUsers";
import Toaster from "./components/Toaster";

function App() {
  return (
    <BrowserRouter>
      <Toaster />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/game-selection" element={<GameSelection />} />
        <Route path="/server-selection" element={<ServerSelection />} />
        <Route path="/analyze" element={<Analyze />} />
        <Route path="/history" element={<History />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/admin/users" element={<AdminUsers />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
