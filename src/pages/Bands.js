import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { FaArrowLeft } from "react-icons/fa"; 

export default function Bands() {
    const [bands, setBands] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        if (!auth.currentUser) return navigate("/login");

        const bandsRef = collection(db, "bands");
        const q = query(bandsRef, where("members", "array-contains", auth.currentUser.uid));

        // Listen for real-time changes
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const userBands = snapshot.docs.map(doc => ({
                id: doc.id,
                name: doc.data().name,
                leaderId: doc.data().leaderId,
            }));
            setBands(userBands);
        });

        return () => unsubscribe(); // Cleanup listener on unmount
    }, [navigate]);

    return (
        <div className="p-6">
            {/* Back Button */}
            <button onClick={() => navigate("/dashboard")} className="flex items-center text-gray-600 hover:text-gray-800 mb-4">
                <FaArrowLeft className="mr-2" />
                Back to Dashboard
            </button>
            <h1 className="text-3xl font-bold mb-4">Your Bands</h1>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {bands.map((band) => (
                    <div
                        key={band.id}
                        className="p-4 bg-white shadow-md rounded-lg cursor-pointer hover:bg-gray-100 transition"
                        onClick={() => navigate(`/bands/${band.id}`)}
                    >
                        <h3 className="text-lg font-bold">{band.name}</h3>
                        <p className="text-sm text-gray-600">
                            {band.leaderId === auth.currentUser.uid ? "Leader" : "Member"}
                        </p>
                    </div>
                ))}
            </div>
        </div>
    );
}
