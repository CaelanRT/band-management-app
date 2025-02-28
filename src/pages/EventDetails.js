import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { auth, db } from "../firebase";
import { doc, getDoc, deleteDoc } from "firebase/firestore";
import { FaArrowLeft, FaClock, FaMapMarkerAlt, FaTrash } from "react-icons/fa";

export default function EventDetails() {
    const { eventId } = useParams();
    const navigate = useNavigate();
    const [event, setEvent] = useState(null);
    const [bandName, setBandName] = useState("Loading...");
    const [creatorName, setCreatorName] = useState("Loading...");
    const [user, setUser] = useState(null);

    useEffect(() => {
        const fetchEvent = async () => {
            if (!auth.currentUser) return navigate("/login");

            setUser(auth.currentUser);
            const eventRef = doc(db, "events", eventId);
            const eventSnap = await getDoc(eventRef);

            if (!eventSnap.exists()) {
                alert("Event not found.");
                return navigate("/events");
            }

            const eventData = eventSnap.data();
            setEvent({ id: eventSnap.id, ...eventData });

            // Fetch band name
            const bandRef = doc(db, "bands", eventData.bandId);
            const bandSnap = await getDoc(bandRef);
            if (bandSnap.exists()) setBandName(bandSnap.data().name);

            // Fetch creator name
            const creatorRef = doc(db, "users", eventData.createdBy);
            const creatorSnap = await getDoc(creatorRef);
            if (creatorSnap.exists()) setCreatorName(creatorSnap.data().displayName);
        };

        fetchEvent();
    }, [eventId, navigate]);

    const deleteEvent = async () => {
        if (!event || (user.uid !== event.createdBy && user.uid !== event.bandLeaderId)) return;
        if (!window.confirm("Are you sure you want to delete this event? This action cannot be undone.")) return;

        await deleteDoc(doc(db, "events", eventId));
        alert("Event deleted.");
        navigate("/events");
    };

    if (!event) return <div className="text-center p-6">Loading...</div>;

    return (
        <div className="p-6 flex flex-col items-center">
            {/* Back Button */}
            <button 
                onClick={() => navigate("/events")} 
                className="flex items-center text-gray-600 hover:text-gray-800 self-start mb-4"
            >
                <FaArrowLeft className="mr-2" />
                Back to Events
            </button>

            <div className="bg-white shadow-lg rounded-lg p-6 w-full max-w-2xl">
                <h1 className="text-3xl font-bold text-purple-700">{event.title}</h1>
                <p className="text-gray-600 text-sm">Created by: {creatorName}</p>
                <p className="text-gray-600 text-sm">Band: {bandName}</p>

                <hr className="my-4" />

                <div className="flex items-center space-x-2 text-gray-600 text-sm">
                    <FaClock />
                    <span>{new Date(event.date).toLocaleString()}</span>
                </div>
                <div className="flex items-center space-x-2 text-gray-600 text-sm mt-1">
                    <FaMapMarkerAlt />
                    <span>{event.location}</span>
                </div>

                {user.uid === event.createdBy || user.uid === event.bandLeaderId ? (
                    <button
                        className="mt-4 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition flex items-center"
                        onClick={deleteEvent}
                    >
                        <FaTrash className="mr-2" /> Delete Event
                    </button>
                ) : null}
            </div>
        </div>
    );
}
