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
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const { bandId } = useParams();
    const navigate = useNavigate();

    useEffect(() => {
        const fetchBands = async () => {
            if (!auth.currentUser) return navigate("/login");

            const bandsRef = collection(db, "bands");
            const q = query(bandsRef, where("members", "array-contains", auth.currentUser.uid));
            const querySnapshot = await getDocs(q);

            const userBands = querySnapshot.docs.map(doc => ({
                id: doc.id,
                name: doc.data().name,
            }));

            setBands(userBands);
            if (userBands.length > 0) {
                setSelectedBand(userBands[0].id);
            }
        };

        fetchBands();
    }, [navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        if (!selectedBand || !title.trim() || !date.trim() || !location.trim()) {
            setError("All fields are required.");
            return;
        }

        try {
            setLoading(true);
            await addDoc(collection(db, "events"), {
                title,
                date,
                location,
                bandId: selectedBand,
                createdBy: auth.currentUser.uid,
            });

            alert("Event created successfully!");
            navigate("/dashboard");
        } catch (error) {
            console.error("Error creating event:", error);
            setError("Failed to create event.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex justify-center items-center min-h-screen">
            <div className="bg-white shadow-lg rounded-lg p-6 w-full max-w-md">
                <h1 className="text-2xl font-bold text-center mb-4">Create Event</h1>

                {error && <p className="text-red-600 text-sm text-center">{error}</p>}

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Select Band Dropdown */}
                    <div>
                        <label className="block text-gray-700 font-medium">Select Band:</label>
                        <select
                            value={selectedBand}
                            onChange={(e) => setSelectedBand(e.target.value)}
                            className="w-full p-2 border rounded focus:ring focus:ring-purple-300"
                        >
                            {bands.map((band) => (
                                <option key={band.id} value={band.id}>{band.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Event Title */}
                    <div>
                        <label className="block text-gray-700 font-medium">Event Title:</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full p-2 border rounded focus:ring focus:ring-purple-300"
                            placeholder="Enter event title"
                        />
                    </div>

                    {/* Event Date */}
                    <div>
                        <label className="block text-gray-700 font-medium">Date & Time:</label>
                        <input
                            type="datetime-local"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="w-full p-2 border rounded focus:ring focus:ring-purple-300"
                        />
                    </div>

                    {/* Location */}
                    <div>
                        <label className="block text-gray-700 font-medium">Location:</label>
                        <input
                            type="text"
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                            className="w-full p-2 border rounded focus:ring focus:ring-purple-300"
                            placeholder="Enter event location"
                        />
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-purple-600 text-white p-3 rounded hover:bg-purple-700 transition disabled:bg-gray-400"
                    >
                        {loading ? "Creating..." : "Create Event"}
                    </button>
                </form>
            </div>
        </div>
    );
}
