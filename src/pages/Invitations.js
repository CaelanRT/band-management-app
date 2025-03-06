import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebase";
import { collection, query, where, onSnapshot, doc, deleteDoc, updateDoc, arrayUnion, getDoc } from "firebase/firestore";
import { FaArrowLeft, FaCheck, FaTimes } from "react-icons/fa";

export default function Invitations() {
    const navigate = useNavigate();
    const [invitations, setInvitations] = useState([]);
    const [inviterNames, setInviterNames] = useState({});
    const [user, setUser] = useState(null);

    useEffect(() => {
        if (!auth.currentUser) return navigate("/login");

        setUser(auth.currentUser);
        console.log("Current User UID:", auth.currentUser.uid);

        const userEmail = auth.currentUser.email;
        const inviteQuery = query(collection(db, "invitations"), where("invitedEmail", "==", userEmail));

        // Real-time listener for invitations
        const unsubscribe = onSnapshot(inviteQuery, async (snapshot) => {
            const pendingInvites = await Promise.all(
                snapshot.docs.map(async (inviteDoc) => {
                    const inviteData = inviteDoc.data();

                    // Fetch Band Name
                    const bandRef = doc(db, "bands", inviteData.bandId);
                    const bandSnap = await getDoc(bandRef);
                    const bandName = bandSnap.exists() ? bandSnap.data().name : "Unknown Band";

                    return {
                        id: inviteDoc.id,
                        bandName,
                        invitedBy: inviteData.invitedBy,
                        ...inviteData
                    };
                })
            );

            setInvitations(pendingInvites);
            fetchInviterNames(pendingInvites);
        });

        return () => unsubscribe(); // Cleanup listener on unmount
    }, [navigate]);

    const fetchInviterNames = async (invites) => {
        const updatedNames = {};

        await Promise.all(
            invites.map(async (invite) => {
                if (invite.invitedBy && !inviterNames[invite.invitedBy]) {
                    try {
                        const inviterRef = doc(db, "users", invite.invitedBy);
                        const inviterSnap = await getDoc(inviterRef);
                        updatedNames[invite.invitedBy] = inviterSnap.exists() ? inviterSnap.data().displayName : "Unknown User";
                    } catch (error) {
                        console.error("Error fetching inviter name:", error);
                        updatedNames[invite.invitedBy] = "Unknown User";
                    }
                }
            })
        );

        setInviterNames((prev) => ({ ...prev, ...updatedNames }));
    };

    const acceptInvite = async (inviteId, bandId) => {
        try {
            if (!auth.currentUser) return alert("You must be logged in.");

            const bandRef = doc(db, "bands", bandId);
            await updateDoc(bandRef, {
                members: arrayUnion(auth.currentUser.uid),
            });

            await deleteDoc(doc(db, "invitations", inviteId));
            alert("You have joined the band!");
        } catch (error) {
            console.error("Error accepting invite:", error);
            alert("Failed to accept invite.");
        }
    };

    const rejectInvite = async (inviteId) => {
        try {
            await deleteDoc(doc(db, "invitations", inviteId));
            alert("Invitation rejected.");
        } catch (error) {
            console.error("Error rejecting invite:", error);
            alert("Failed to reject invite.");
        }
    };

    return (
        <div className="p-6 flex flex-col items-center">
            <button 
                onClick={() => navigate("/dashboard")} 
                className="flex items-center text-gray-600 hover:text-gray-800 self-start mb-4"
            >
                <FaArrowLeft className="mr-2" />
                Back to Dashboard
            </button>

            <h1 className="text-3xl font-bold text-purple-700">Invitations</h1>

            <div className="bg-white shadow-lg rounded-lg p-6 w-full max-w-2xl mt-6">
                {invitations.length > 0 ? (
                    <ul className="space-y-4">
                        {invitations.map((invite) => (
                            <li 
                                key={invite.id} 
                                className="p-4 bg-gray-100 shadow-md rounded-lg flex justify-between items-center"
                            >
                                <div>
                                    <h3 className="text-lg font-bold">{invite.bandName}</h3>
                                    <p className="text-sm text-gray-600">
                                        Invited by: {inviterNames[invite.invitedBy] || "Fetching..."}
                                    </p>
                                </div>
                                <div className="flex space-x-2">
                                    <button
                                        onClick={() => acceptInvite(invite.id, invite.bandId)}
                                        className="bg-green-600 text-white p-2 rounded hover:bg-green-700 transition"
                                    >
                                        <FaCheck />
                                    </button>
                                    <button
                                        onClick={() => rejectInvite(invite.id)}
                                        className="bg-red-500 text-white p-2 rounded hover:bg-red-700 transition"
                                    >
                                        <FaTimes />
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-gray-500">No pending invitations.</p>
                )}
            </div>
        </div>
    );
}
