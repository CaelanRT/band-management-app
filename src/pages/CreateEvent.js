import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { auth, db } from "../firebase";
import { collection, addDoc, query, where, getDocs } from "firebase/firestore";

export default function CreateEvent() {
    const [title, setTitle] = useState("");
    const [bands, setBands] = useState([]);
    const [selectedBand, setSelectedBand] = useState("");
    const [date, setDate] = useState("");
    const [location, setLocation] = useState("");
    const { bandId } = useParams();
    const navigate = useNavigate();

    useEffect(() => {
        const fetchBands = async () => {
            if (!auth.currentUser) return navigate("/login");

            const bandsRef = collection(db, "bands");
            const q = query(bandsRef, where("members", "array-contains", auth.currentUser.uid));
            const querySnapshot = await getDocs(q);

            const userBands = querySnapshot.docs.map(doc => ({
                id:doc.id,
                name: doc.data().name,
            }));

            setBands(userBands);
            if(userBands.length > 0) {
                setSelectedBand(userBands[0].id);
            }
        };

        fetchBands();
    }, [navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedBand) return alert("Please select a band.");
        if (!title.trim() || !date.trim() || !location.trim()) return alert("All fields are required.");

        try {
            await addDoc(collection(db, "events"), {
                title,
                date,
                location,
                bandId: selectedBand,
                createdBy: auth.currentUser.uid,
            });

            alert("Event created!");
            navigate("/dashboard");
        } catch (error) {
            console.error("Error creating event:", error);
            alert("Failed to create event.");
        }
    };

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-4">Create Event</h1>

            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Select Band Dropdown */}
                <div>
                    <label className="block text-gray-700">Select Band:</label>
                    <select
                        value={selectedBand}
                        onChange={(e) => setSelectedBand(e.target.value)}
                        className="w-full p-2 border rounded"
                    >
                        {bands.map((band) => (
                            <option key={band.id} value={band.id}>{band.name}</option>
                        ))}
                    </select>
                </div>

                {/* Event Title */}
                <div>
                    <label className="block text-gray-700">Event Title:</label>
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full p-2 border rounded"
                        placeholder="Enter event title"
                    />
                </div>

                {/* Event Date */}
                <div>
                    <label className="block text-gray-700">Date & Time:</label>
                    <input
                        type="datetime-local"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="w-full p-2 border rounded"
                    />
                </div>

                {/* Location */}
                <div>
                    <label className="block text-gray-700">Location:</label>
                    <input
                        type="text"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        className="w-full p-2 border rounded"
                        placeholder="Enter event location"
                    />
                </div>

                {/* Submit Button */}
                <button type="submit" className="w-full bg-purple-600 text-white p-3 rounded hover:bg-purple-700 transition">
                    Create Event
                </button>
            </form>
        </div>
    );
}