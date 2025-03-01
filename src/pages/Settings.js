import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebase";
import { updateProfile } from "firebase/auth";
import { doc, updateDoc } from "firebase/firestore";

export default function Settings() {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [displayName, setDisplayName] = useState("");
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (!auth.currentUser) {
            navigate("/login"); // Redirect unauthorized users
            return;
        }
        setUser(auth.currentUser);
        setDisplayName(auth.currentUser.displayName || "");
    }, [navigate]);

    const updateDisplayName = async () => {
        if (!user || !displayName.trim()) return;
        setSaving(true);
        try {
            await updateProfile(user, { displayName });
            await updateDoc(doc(db, "users", user.uid), { displayName });
            alert("Display name updated successfully!");
        } catch (error) {
            console.error("Error updating display name:", error);
            alert("Failed to update display name.");
        }
        setSaving(false);
    };

    return (
        <div className="p-6 max-w-lg mx-auto bg-white shadow-lg rounded-lg">
            <h1 className="text-3xl font-bold mb-4">Settings</h1>

            {/* Display Name Section */}
            <div className="mb-6">
                <label className="block text-lg font-semibold">Display Name</label>
                <input 
                    type="text" 
                    className="w-full p-2 border rounded mt-1" 
                    value={displayName} 
                    onChange={(e) => setDisplayName(e.target.value)} 
                />
                <button 
                    className="bg-green-500 text-white px-4 py-2 rounded mt-3"
                    onClick={updateDisplayName}
                    disabled={saving}
                >
                    {saving ? "Saving..." : "Save Name"}
                </button>
            </div>
        </div>
    );
}
