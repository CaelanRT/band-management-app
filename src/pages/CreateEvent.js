import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { auth, db } from "../firebase";
import { collection, addDoc } from "firebase/firestore";

export default function CreateEvent() {
    const [title, setTitle] = useState("");
    const [date, setDate] = useState("");
    const [location, setLocation] = useState("");
    const { bandId } = useParams();
    const navigate = useNavigate();

    const handleCreateEvent = async (e) => {
        e.preventDefault();
        if (!title || !date || !location) return alert("All fields are required!");

        try {
            const user = auth.currentUser;
            if (!user) return alert("You must be logged in.");

            await addDoc(collection(db, "events"), {
                bandId,
                title,
                date,
                location,
                createdBy: user.uid
            });

            alert("event created successfully!");
            navigate(`/dashboard`);
        } catch (error) {
            console.error("Error creating event:", error);
            alert("Failed to create event.");
        }
    };

    return (
        <div>
            <h1>Create Event</h1>
            <form onSubmit={handleCreateEvent}>
                <input
                    type="text"
                    placeholder="Event Title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                />
                <input
                    type="datetime-local"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                />
                <input
                    type="text"
                    placeholder="Location"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                />
                <button type="submit">Create Event</button>
            </form>
        </div>
    )
}