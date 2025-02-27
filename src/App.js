import { BrowserRouter as Router, Routes, Route, Navigate, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { auth } from "./firebase";
import { FaPlus, FaBars, FaUserCircle, FaHome, FaMusic, FaCalendarAlt, FaEnvelope, FaCog } from "react-icons/fa";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import CreateBand from "./pages/CreateBand";
import InviteMember from "./pages/InviteMember";
import CreateEvent from "./pages/CreateEvent";

export default function App() {
  const [user, setUser] = useState(undefined);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((authUser) => {
      setUser(authUser);
    });

    return () => unsubscribe();
  }, []);

  if (user === undefined) {
    return <div className="flex items-center justify-center h-screen text-xl">Loading...</div>
  }

  return (
    <Router>
      <Routes>
        {!user ? (
          <>
            <Route path="/" element={<Login />} />
            <Route path="login" element={<Login />} />
            <Route path="*" element={<Navigate to="/login" />} />
          </>
        ) : (
          <>
            <Route path="/*" element={<DashboardLayout />} />
          </>
        )}
      </Routes>
    </Router>
  )
}

function DashboardLayout() {
  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header />
        <div className="p-6 flex-1">
          <Routes>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/create-band" element={<CreateBand />} />
            <Route path="/invite/:bandId" element={<InviteMember />} />
            <Route path="/create-event/:bandId" element={<CreateEvent />} />
            <Route path="*" element={<Navigate to="/dashboard" />} />
          </Routes>
        </div>
        <FloatingActionButton />
      </div>
    </div>
  );
}


function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className={`bg-purple-800 text-white h-screen p-4 transition-all duration-300 relative ${collapsed ? "w-16" : "w-64"}`}>
      {/* Hamburger Menu Button - Always Stays in the Same Place */}
      <button 
        onClick={() => setCollapsed(!collapsed)} 
        className="absolute top-4 left-6"
      >
        <FaBars size={20} />
      </button>

      {/* Navigation Links */}
      <nav className="mt-12 flex flex-col space-y-2">
        <Link to="/dashboard" className="flex items-center p-2 rounded hover:bg-purple-700 transition">
          <FaHome size={20} className="min-w-[20px]" />
          <span className={`ml-4 whitespace-nowrap transition-opacity duration-300 ${collapsed ? "opacity-0 w-0" : "opacity-100 w-auto"}`}>Dashboard</span>
        </Link>
        <Link to="/bands" className="flex items-center p-2 rounded hover:bg-purple-700 transition">
          <FaMusic size={20} className="min-w-[20px]" />
          <span className={`ml-4 whitespace-nowrap transition-opacity duration-300 ${collapsed ? "opacity-0 w-0" : "opacity-100 w-auto"}`}>Bands</span>
        </Link>
        <Link to="/events" className="flex items-center p-2 rounded hover:bg-purple-700 transition">
          <FaCalendarAlt size={20} className="min-w-[20px]" />
          <span className={`ml-4 whitespace-nowrap transition-opacity duration-300 ${collapsed ? "opacity-0 w-0" : "opacity-100 w-auto"}`}>Events</span>
        </Link>
        <Link to="/invitations" className="flex items-center p-2 rounded hover:bg-purple-700 transition">
          <FaEnvelope size={20} className="min-w-[20px]" />
          <span className={`ml-4 whitespace-nowrap transition-opacity duration-300 ${collapsed ? "opacity-0 w-0" : "opacity-100 w-auto"}`}>Invitations</span>
        </Link>
        <Link to="/settings" className="flex items-center p-2 rounded hover:bg-purple-700 transition">
          <FaCog size={20} className="min-w-[20px]" />
          <span className={`ml-4 whitespace-nowrap transition-opacity duration-300 ${collapsed ? "opacity-0 w-0" : "opacity-100 w-auto"}`}>Settings</span>
        </Link>
      </nav>
    </div>
  );
}


function Header() {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const toggleDropdown = () => {
    setDropdownOpen(!dropdownOpen);
  };

  const logout = async () => {
    await auth.signOut();
    window.location.reload();
  };

  return (
    <div className="bg-white shadow-md p-4 flex justify-between items-center relative">
      <h1 className="text-purple-800 text-xl font-bold">BandOS</h1>

      <div className="relative">
        <button onClick={toggleDropdown} className="text-gray-600 flex items-center space-x-2">
          <FaUserCircle size={28} />
        </button>

        {dropdownOpen && (
          <div className="absolute right-0 mt-2 w-48 bg-white shadow-lg rounded-lg overflow-hidden">
            <div className="p-4 border-b">
              <p className="text-sm font-semibold">{auth.currentUser?.displayName}</p>
              <p className="text-xs text-gray-500">{auth.currentUser?.email}</p>
          </div>
          <button
            onClick={logout}
            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
            >
              Logout
            </button>
            </div>
        )}
      </div>
    </div>
  )
}


function FloatingActionButton() {
  return (
    <button className="fixed bottom-6 right-6 bg-purple-800 text-white p-4 rounded-full shadow-lf hover:bg-purple-700 transition">
      <FaPlus size={24} />
    </button>
  )
}

