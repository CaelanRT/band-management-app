import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebase";
import { collection, addDoc, query, where, getDocs, doc } from "firebase/firestore";

export default function InviteMember() {
    const [email, setEmail] = useState("");
    const [bands, setBands] = useState([]);
    const [selectedBand, setSelectedBand] = useState("");
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
        };
        

        fetchBands();
    }, []);

    const handleInvite = async (e) => {
        e.preventDefault();
        if (!email.trim()) return alert("Please enter a valid email.");
        if(!selectedBand) return alert("Please select a band to invite to.");

        try {
            const user = auth.currentUser;
            if (!user) return alert("You must be logged in.");

            //create invitation in Firestore
            await addDoc(collection(db, "invitations"), {
                bandId: selectedBand,
                invitedEmail: email,
                invitedBy: user.uid,
                status: "pending",
            });

            alert("Invitation sent!");
            navigate("/dashboard");
        } catch (error) {
            console.error("Error sending invite:", error);
            alert("Failed to send invite.");
        }
    };

    return (
        <div className="p-6">
            <h1 className="text-xl font-bold">Invite Member</h1>
            <form onSubmit={handleInvite} className="mt-4 space-y-4">
                <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter member's email"
                    className="w-full p-2 border rounded"
                />

                
                <select
                    value={selectedBand}
                    onChange={(e) => setSelectedBand(e.target.value)}
                    className="w-full p-2 border rounded"
                >
                    <option value="">Select a Band</option>
                    {bands.map((band) => (
                        <option key={band.id} value={band.id}>
                            {band.name}
                        </option>
                    ))}
                </select>

                <button type="submit" className="w-full bg-purple-600 text-white py-2 rounded hover:bg-purple-700 transition">
                    Send Invite
                </button>
            </form>
        </div>
    );

    //end of Invite Member
}