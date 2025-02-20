import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import CreateBand from "./pages/CreateBand";
import InviteMember from "./pages/InviteMember";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />}/>
        <Route path="/login" element={<Login />}/>
        <Route path="/dashboard" element={<Dashboard />}/>
        <Route path="/create-band" element={<CreateBand />}/>
        <Route path="/invite/:bandId" element={<InviteMember />}/>
      </Routes>
    </Router>
  );
}

export default App;
