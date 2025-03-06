import { auth, db } from "../firebase";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { collection, query, where, onSnapshot, doc, getDoc, updateDoc, arrayUnion, deleteDoc } from "firebase/firestore";
import { FaTimes } from "react-icons/fa";

export default function Dashboard() {
    const navigate = useNavigate();
    const [events, setEvents] = useState([]);
    const [user, setUser] = useState(null);
    const [bands, setBands] = useState([]);
    const [invitations, setInvitations] = useState([]);
    const [inviterNames, setInviterNames] = useState({});
    const [bandNames, setBandNames] = useState({});

    useEffect(() => {
        if (!auth.currentUser) return navigate("/login");

        setUser(auth.currentUser);
        console.log("Current User UID:", auth.currentUser.uid);

        const userEmail = auth.currentUser.email;
        const bandsRef = collection(db, "bands");
        const eventsRef = collection(db, "events");
        const invitesRef = collection(db, "invitations");

        // Real-time listener for user's bands
        const bandsQuery = query(bandsRef, where("members", "array-contains", auth.currentUser.uid));
        const unsubscribeBands = onSnapshot(bandsQuery, async (snapshot) => {
            const userBands = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setBands(userBands);

            // Store band names in a dictionary for quick lookup
            const bandMap = {};
            userBands.forEach(band => {
                bandMap[band.id] = band.name;
            });
            setBandNames(bandMap);

            if (userBands.length > 0) {
                const eventQuery = query(eventsRef, where("bandId", "in", userBands.map(band => band.id)));
                const unsubscribeEvents = onSnapshot(eventQuery, async (eventSnapshot) => {
                    const now = new Date();
                    const upcomingEvents = eventSnapshot.docs
                        .map(doc => {
                            const eventData = doc.data();
                            return {
                                id: doc.id,
                                bandName: bandMap[eventData.bandId] || "Unknown Band",
                                ...eventData
                            };
                        })
                        .filter(event => new Date(event.date) > now); // Only keep upcoming events

                    setEvents(upcomingEvents);
                });
                return () => unsubscribeEvents(); // Cleanup event listener
            } else {
                setEvents([]);
            }
        });

        // Real-time listener for invitations (Fetching Band Name + Inviter Display Name)
        const inviteQuery = query(invitesRef, where("invitedEmail", "==", userEmail));
        const unsubscribeInvites = onSnapshot(inviteQuery, async (inviteSnapshot) => {
            const invitesWithDetails = await Promise.all(inviteSnapshot.docs.map(async (inviteDoc) => {
                const inviteData = inviteDoc.data();

                // Fetch Band Name
                let bandName = "Unknown Band";
                if (inviteData.bandId) {
                    const bandRef = doc(db, "bands", inviteData.bandId);
                    const bandSnap = await getDoc(bandRef);
                    if (bandSnap.exists()) {
                        bandName = bandSnap.data().name;
                    }
                }

                // Fetch Inviter's Display Name
                let inviterName = "Unknown User";
                if (inviteData.invitedBy && !inviterNames[inviteData.invitedBy]) {
                    const inviterRef = doc(db, "users", inviteData.invitedBy);
                    const inviterSnap = await getDoc(inviterRef);
                    if (inviterSnap.exists()) {
                        inviterName = inviterSnap.data().displayName || "Unknown User";
                    }

                    setInviterNames(prev => ({ ...prev, [inviteData.invitedBy]: inviterName }));
                }

                return {
                    id: inviteDoc.id,
                    bandName,
                    invitedBy: inviteData.invitedBy,
                    ...inviteData
                };
            }));

            setInvitations(invitesWithDetails);
        });

        return () => {
            unsubscribeBands();
            unsubscribeInvites();
        };
    }, [navigate]);

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
        <div className="p-6">
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <hr className="my-4 border-gray-300" />

            <h2 className="text-2xl font-semibold mb-4">Upcoming Events</h2>
            {events.length > 0 ? (
                <ul className="space-y-4">
                    {events.map(event => (
                        <li 
                            key={event.id} 
                            className="p-4 bg-white shadow-md rounded-lg cursor-pointer hover:bg-gray-100 transition"
                            onClick={() => navigate(`/events/${event.id}`)}
                        >
                            <strong>{event.title}</strong> - {new Date(event.date).toLocaleString()}
                            <p><b>Location:</b> {event.location}</p>
                            <p><b>Band:</b> {event.bandName}</p>
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="text-gray-500">No upcoming events.</p>
            )}

            <hr className="my-6 border-gray-300" />

            <h2 className="text-2xl font-semibold mb-4">Your Bands</h2>
            {bands.length > 0 ? (
                <ul className="space-y-4">
                    {bands.map((band) => (
                        <li 
                            key={band.id} 
                            className="p-4 bg-white shadow-md rounded-lg cursor-pointer hover:bg-gray-100 transition"
                            onClick={() => navigate(`/bands/${band.id}`)}
                        >
                            <h3 className="text-lg font-bold">{band.name}</h3>
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="text-gray-500">You are not part of any bands yet.</p>
            )}

            <hr className="my-6 border-gray-300" />

            <h2 className="text-2xl font-semibold mb-4">Pending Invitations</h2>
            {invitations.length > 0 ? (
                <ul className="space-y-4">
                    {invitations.map(invite => (
                        <li key={invite.id} className="border p-3 rounded-md shadow-md mb-4">
                            <strong>{invite.bandName}</strong>
                            <p><b>Invited by:</b> {inviterNames[invite.invitedBy] || "Fetching..."}</p>
                            <div className="flex space-x-2 mt-2">
                                <button
                                    className="bg-green-500 text-white px-2 py-1 rounded hover:bg-green-700 transition"
                                    onClick={() => acceptInvite(invite.id, invite.bandId)}
                                >
                                    Accept
                                </button>
                                <button
                                    className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-700 transition"
                                    onClick={() => rejectInvite(invite.id)}
                                >
                                    Reject
                                </button>
                            </div>
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="text-gray-500">No pending invitations.</p>
            )}
        </div>
    );
}
