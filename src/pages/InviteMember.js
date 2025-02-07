import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { auth, db } from "../firebase";
import { collection, addDoc } from "firebase/firestore";

export default function InviteMember() {
    const [email, setEmail] = useState("");
    const { bandId } = useParams();
    const navigate = useNavigate();

    const handleInvite = async (e) => {
        e.preventDefault();
        if (!email.trim()) return alert("Please enter a valid email.");

        try {
            const user = auth.currentUser;
            if (!user) return alert("You must be logged in.");

            //create invitation in Firestore
            await addDoc(collection(db, "invitations"), {
                bandId,
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
        <div>
            <h1>Invite Member</h1>
            <form onSubmit={handleInvite}>
                <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter member's email"
                />
                <button type="submit">Send Invite</button>
            </form>
        </div>
    );

    //end of Invite Member
}