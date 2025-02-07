import { useState } from "react";
import { auth, db } from "../firebase";
import { collection, addDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

export default function CreateBand() {
    const [bandName, setBandName] = useState("");
    const navigate = useNavigate();

    const handleCreateBand = async (e) => {
        e.preventDefault();
        if (!bandName.trim()) return alert("Band name is required!");

        try {
            const user = auth.currentUser;
            if (!user) return alert("You must be logged in to create a band.");

            //create a new band in firestore
            const docRef = await addDoc(collection(db, "bands"), {
                name: bandName,
                leaderId: user.uid,
                members: [user.uid],
            });

            console.log("Band created with ID:", docRef.id);
            alert("Band created successfully!");

            //redirect
            navigate("/dashboard");
        } catch (error) {
            console.error("Error creating band:", error);
            alert("Failed to create band. Check the console.");
        }
    };


    return (
        <div>
            <h1>Create a band</h1>
            <form onSubmit={handleCreateBand}>
                <input
                type="text"
                value={bandName}
                onChange={(e) => setBandName(e.target.value)}
                placeholder="Enter Band Name"
                />
                <button type="submit">Create Band</button>
            </form>
        </div>
    );
}