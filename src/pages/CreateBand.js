import { useState } from "react";
import { auth, db } from "../firebase";
import { collection, addDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

export default function CreateBand() {
    const [bandName, setBandName] = useState("");
    const [error, setError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleCreateBand = async (e) => {
        e.preventDefault();
        setError("");
        setSuccessMessage("");

        if (!bandName.trim()) {
            setError("Band name cannot be empty.");
            return;
        }

        try {
            setLoading(true);
            const user = auth.currentUser;
            if (!user) {
                setError("You must be logged in to create a band.");
                setLoading(false);
                return;
            }

            //create a new band in firestore
            const docRef = await addDoc(collection(db, "bands"), {
                name: bandName.trim(),
                leaderId: user.uid,
                members: [user.uid],
            });

            setSuccessMessage(`Band "${bandName}" created successfully!`);
            setBandName("");

            setTimeout(() => {
                navigate("/dashboard");
            }, 2000);
        } catch (error) {
            console.error("Error creating band:", error);
            alert("Failed to create band. Check the console.");
        } finally {
            setLoading(false);
        }
    };


    return (
        <div className="flex justify-center items-center min-h-screen bg-gray-100 px-4">
          <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
            <h2 className="text-2xl font-bold text-purple-800 text-center mb-6">
              Create a New Band
            </h2>
    
            {error && <p className="text-red-600 text-center mb-4">{error}</p>}
            {successMessage && <p className="text-green-600 text-center mb-4">{successMessage}</p>}
    
            <form onSubmit={handleCreateBand} className="space-y-4">
              <input
                type="text"
                placeholder="Enter band name"
                value={bandName}
                onChange={(e) => setBandName(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-600 focus:outline-none"
              />
    
              <button
                type="submit"
                className="w-full bg-purple-800 text-white py-2 rounded-lg hover:bg-purple-700 transition disabled:opacity-50"
                disabled={loading}
              >
                {loading ? "Creating..." : "Create Band"}
              </button>
            </form>
          </div>
        </div>
      );
}