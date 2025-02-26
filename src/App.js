import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import CreateBand from "./pages/CreateBand";
import InviteMember from "./pages/InviteMember";
import CreateEvent from "./pages/CreateEvent";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />}/>
        <Route path="/login" element={<Login />}/>
        <Route path="/dashboard" element={<Dashboard />}/>
        <Route path="/create-band" element={<CreateBand />}/>
        <Route path="/invite/:bandId" element={<InviteMember />}/>
        <Route path="/create-event/:bandId" element={<CreateEvent />}/>
      </Routes>
    </Router>
  );
}

export default App;
