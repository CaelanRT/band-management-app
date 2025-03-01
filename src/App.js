import { BrowserRouter as Router, Routes, Route, Navigate, Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { auth, db } from "./firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { FaPlus, FaBars, FaUserCircle, FaHome, FaMusic, FaCalendarAlt, FaEnvelope, FaCog, FaUsers } from "react-icons/fa";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import CreateBand from "./pages/CreateBand";
import InviteMember from "./pages/InviteMember";
import CreateEvent from "./pages/CreateEvent";
import Bands from "./pages/Bands";
import BandDetails from "./pages/BandDetails";
import Events from "./pages/Events.js";
import EventDetails from "./pages/EventDetails.js";
import Invitations from "./pages/Invitations";
import Settings from "./pages/Settings"



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
  const [bands, setBands] = useState([]);

  useEffect(() => {
    const fetchBands = async () => {
      if (!auth.currentUser) return;
      const bandsRef = collection(db, "bands");
      const q = query(bandsRef, where("members", "array-contains", auth.currentUser.uid));
      const querySnapshot = await getDocs(q);

      const userBands = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));

      setBands(userBands);
    };

    fetchBands();
  }, []);


  return (
    <div className="flex min-h-screen h-screen overflow-hidden bg-gray-100">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header />
        <div className="p-6 flex-1 min-h-0 overflow-auto">
          <Routes>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/create-band" element={<CreateBand />} />
            <Route path="/invite/:bandId" element={<InviteMember />} />
            <Route path="/create-event/:bandId" element={<CreateEvent />} />
            <Route path="/bands" element={<Bands />} />
            <Route path="/bands/:bandId" element={<BandDetails />} />
            <Route path="/events" element={<Events />} />
            <Route path="/events/:eventId" element={<EventDetails />} />
            <Route path="/invitations" element={<Invitations />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/dashboard" />} />
          </Routes>
        </div>
        <FloatingActionButton bands={bands}/>
      </div>
    </div>
  );
}


function Sidebar() {
  const [collapsed, setCollapsed] = useState(true);

  return (
    <div className={`bg-purple-800 text-white min-h-screen h-full p-4 transition-all duration-300 relative ${collapsed ? "w-16" : "w-64"}`}>
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


function FloatingActionButton({ bands }) {
  const [expanded, setExpanded] = useState(false);
  const handleNavigate = (path) => {
    setExpanded(false);
    window.location.href = path;
  }

  const bandId = bands.length > 0 ? bands[0].id : null;

  const toggleMenu = () => setExpanded(!expanded);

  return (
    <div className="fixed bottom-6 right-6 flex flex-col items-center space-y-2">
      {/* 🔹 Background Overlay - Only visible when expanded */}
      {expanded && (
        <div
          className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm z-10"
          onClick={toggleMenu} // Clicking outside closes the menu
        ></div>
      )}
  
      {/* 🔹 Buttons - Show when expanded */}
      <div
        className={`flex flex-col items-center space-y-3 transition-all duration-300 z-20 ${
          expanded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6 pointer-events-none"
        }`}
      >
        {/* Create Band */}
        <div className="relative flex items-center group">
          <button
            onClick={() => handleNavigate("/create-band")}
            className="bg-purple-600 text-white p-3 rounded-full shadow-lg hover:bg-purple-700 transition"
          >
            <FaMusic size={20} />
          </button>
          <span
            className={`absolute right-14 bg-purple-600 text-white text-xs px-2 py-1 rounded transition-opacity duration-200
              ${expanded ? "block" : "hidden"} md:hidden md:group-hover:block`}
          >
            Create Band
          </span>
        </div>
  
        {/* Create Event */}
        <div className="relative flex items-center group">
          <button
            onClick={() => handleNavigate("/create-event/:bandId")}
            className="bg-purple-600 text-white p-3 rounded-full shadow-lg hover:bg-purple-700 transition"
          >
            <FaCalendarAlt size={20} />
          </button>
          <span
            className={`absolute right-14 bg-purple-600 text-white text-xs px-2 py-1 rounded transition-opacity duration-200
              ${expanded ? "block" : "hidden"} md:hidden md:group-hover:block`}
          >
            Create Event
          </span>
        </div>
  
        {/* Invite Member */}
        <div className="relative flex items-center group">
          <button
            onClick={() => handleNavigate("/invite/:bandId")}
            className="bg-purple-600 text-white p-3 rounded-full shadow-lg hover:bg-purple-700 transition"
          >
            <FaUsers size={20} />
          </button>
          <span
            className={`absolute right-14 bg-purple-600 text-white text-xs px-2 py-1 rounded transition-opacity duration-200
              ${expanded ? "block" : "hidden"} md:hidden md:group-hover:block`}
          >
            Invite Member
          </span>
        </div>
      </div>
  
      {/* 🔹 Main Floating Button */}
      <button
        onClick={toggleMenu}
        className="bg-purple-800 text-white p-5 rounded-full shadow-lg hover:bg-purple-700 transition z-30"
      >
        <FaPlus
          size={24}
          className={`transform transition-transform duration-300 ${expanded ? "rotate-45" : "rotate-0"}`}
        />
      </button>
    </div>
  );
  
  
  
  
}

