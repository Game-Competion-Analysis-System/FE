import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Authen/Login";
import Register from "./pages/Authen/Register";
import GameSelection from "./pages/GameSelection";
import ServerSelection from "./pages/ServerSelection";
import Analyze from "./pages/Analyze";
import History from "./pages/History/History";
import AdminUsers from "./pages/AdminUsers";
import AdminLayout from "./pages/admin/AdminLayout";
import AdminSection from "./pages/admin/AdminSection";
import AdminDashboard from "./pages/admin/AdminDashboard";
import Profile from "./pages/Profile";
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
        <Route path="/dashboard" element={<AdminDashboard />} />
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminUsers />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="history" element={<History />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="ui" element={<AdminSection title="UI Elements" />} />
          <Route path="charts" element={<AdminSection title="Charts" />} />
          <Route path="tabs" element={<AdminSection title="Tabs & Panels" />} />
          <Route path="tables" element={<AdminSection title="Responsive Tables" />} />
          <Route path="forms" element={<AdminSection title="Forms" />} />
          <Route path="dropdown" element={<AdminSection title="Multi-Level Dropdown" />} />
          <Route path="empty" element={<AdminSection title="Empty Page" />} />
          <Route path="boxes" element={<AdminSection title="Components" />} />
        </Route>
        <Route path="/profile" element={<Profile />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
