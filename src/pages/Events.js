import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebase";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { FaCalendarAlt, FaClock, FaMapMarkerAlt, FaArrowLeft } from "react-icons/fa";

export default function Events() {
    const navigate = useNavigate();
    const [events, setEvents] = useState([]);
    const [bandNames, setBandNames] = useState({});

    useEffect(() => {
        const fetchEvents = async () => {
            if (!auth.currentUser) return navigate("/login");

            // Get the bands the user is in
            const bandsRef = collection(db, "bands");
            const bandsQuery = query(bandsRef, where("members", "array-contains", auth.currentUser.uid));
            const bandsSnapshot = await getDocs(bandsQuery);

            const bandMap = {};
            const bandIds = bandsSnapshot.docs.map((doc) => {
                bandMap[doc.id] = doc.data().name;
                return doc.id;
            });

            setBandNames(bandMap);

            if (bandIds.length === 0) return;

            // Fetch events for the user's bands
            const eventsRef = collection(db, "events");
            const eventsQuery = query(eventsRef, where("bandId", "in", bandIds));
            const eventsSnapshot = await getDocs(eventsQuery);

            const eventList = eventsSnapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            }));

            setEvents(eventList);
        };

        fetchEvents();
    }, [navigate]);

    // Split events into upcoming and past
    const now = new Date();
    const upcomingEvents = events.filter(event => new Date(event.date) > now);
    const pastEvents = events.filter(event => new Date(event.date) <= now);

    return (
        <div className="p-6 flex flex-col items-center">
            {/* Back Button */}
            <button 
                onClick={() => navigate("/dashboard")} 
                className="flex items-center text-gray-600 hover:text-gray-800 self-start mb-4"
            >
                <FaArrowLeft className="mr-2" />
                Back to Dashboard
            </button>

            <h1 className="text-3xl font-bold text-purple-700">Events</h1>

            {/* Upcoming Events */}
            <div className="bg-white shadow-lg rounded-lg p-6 w-full max-w-2xl mt-6">
                <h2 className="text-2xl font-semibold mb-4">Upcoming Events</h2>
                {upcomingEvents.length > 0 ? (
                    <ul className="space-y-4">
                        {upcomingEvents.map((event) => (
                            <li 
                                key={event.id} 
                                className="p-4 bg-gray-100 shadow-md rounded-lg cursor-pointer hover:bg-gray-200 transition"
                                onClick={() => navigate(`/events/${event.id}`)}
                            >
                                <h3 className="text-lg font-bold">{event.title}</h3>
                                <p className="text-sm text-gray-600">{bandNames[event.bandId] || "Unknown Band"}</p>
                                <div className="flex items-center space-x-2 text-gray-600 text-sm mt-2">
                                    <FaClock />
                                    <span>{new Date(event.date).toLocaleString()}</span>
                                </div>
                                <div className="flex items-center space-x-2 text-gray-600 text-sm mt-1">
                                    <FaMapMarkerAlt />
                                    <span>{event.location}</span>
                                </div>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-gray-500">No upcoming events.</p>
                )}
            </div>

            {/* Past Events */}
            <div className="bg-white shadow-lg rounded-lg p-6 w-full max-w-2xl mt-6">
                <h2 className="text-2xl font-semibold mb-4">Past Events</h2>
                {pastEvents.length > 0 ? (
                    <ul className="space-y-4">
                        {pastEvents.map((event) => (
                            <li 
                                key={event.id} 
                                className="p-4 bg-gray-100 shadow-md rounded-lg cursor-pointer hover:bg-gray-200 transition"
                                onClick={() => navigate(`/events/${event.id}`)}
                            >
                                <h3 className="text-lg font-bold">{event.title}</h3>
                                <p className="text-sm text-gray-600">{bandNames[event.bandId] || "Unknown Band"}</p>
                                <div className="flex items-center space-x-2 text-gray-600 text-sm mt-2">
                                    <FaClock />
                                    <span>{new Date(event.date).toLocaleString()}</span>
                                </div>
                                <div className="flex items-center space-x-2 text-gray-600 text-sm mt-1">
                                    <FaMapMarkerAlt />
                                    <span>{event.location}</span>
                                </div>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-gray-500">No past events.</p>
                )}
            </div>
        </div>
    );
}
