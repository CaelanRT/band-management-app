import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebase";
import { collection, addDoc, query, where, getDocs } from "firebase/firestore";

export default function InviteMember() {
    const [email, setEmail] = useState("");
    const [bands, setBands] = useState([]);
    const [selectedBand, setSelectedBand] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const navigate = useNavigate();

    useEffect(() => {
        const fetchBands = async () => {
            if (!auth.currentUser) return;
        
            const bandsRef = collection(db, "bands");
            const q = query(bandsRef, where("leaderId", "==", auth.currentUser.uid));
            const querySnapshot = await getDocs(q);
        
            const userBands = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        
            setBands(userBands);
            if (userBands.length > 0) {
                setSelectedBand(userBands[0].id);
            }
        };
        
        fetchBands();
    }, []);

    const handleInvite = async (e) => {
        e.preventDefault();
        setError("");

        if (!email.trim()) {
            setError("Please enter a valid email.");
            return;
        }

        if (!selectedBand) {
            setError("Please select a band to invite to.");
            return;
        }

        try {
            setLoading(true);
            const user = auth.currentUser;
            if (!user) return setError("You must be logged in.");

            await addDoc(collection(db, "invitations"), {
                bandId: selectedBand,
                invitedEmail: email,
                invitedBy: user.uid,
                status: "pending",
            });

            alert("Invitation sent successfully!");
            navigate("/dashboard");
        } catch (error) {
            console.error("Error sending invite:", error);
            setError("Failed to send invite.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex justify-center items-center min-h-screen">
            <div className="bg-white shadow-lg rounded-lg p-6 w-full max-w-md">
                <h1 className="text-2xl font-bold text-center mb-4">Invite Member</h1>

                {error && <p className="text-red-600 text-sm text-center">{error}</p>}

                <form onSubmit={handleInvite} className="space-y-4">
                    {/* Member Email Input */}
                    <div>
                        <label className="block text-gray-700 font-medium">Member's Email:</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Enter member's email"
                            className="w-full p-2 border rounded focus:ring focus:ring-purple-300"
                        />
                    </div>

                    {/* Select Band Dropdown */}
                    <div>
                        <label className="block text-gray-700 font-medium">Select Band:</label>
                        <select
                            value={selectedBand}
                            onChange={(e) => setSelectedBand(e.target.value)}
                            className="w-full p-2 border rounded focus:ring focus:ring-purple-300"
                        >
                            <option value="">Select a Band</option>
                            {bands.map((band) => (
                                <option key={band.id} value={band.id}>
                                    {band.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-purple-600 text-white p-3 rounded hover:bg-purple-700 transition disabled:bg-gray-400"
                    >
                        {loading ? "Sending..." : "Send Invite"}
                    </button>
                </form>
            </div>
        </div>
    );
}
