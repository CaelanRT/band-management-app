import { auth, db } from "../firebase";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { collection, query, where, getDocs, doc, getDoc, updateDoc, arrayUnion, deleteDoc, arrayRemove } from "firebase/firestore";
import { FaTimes } from "react-icons/fa";

export default function Dashboard() {
    const navigate = useNavigate();
    const [events, setEvents] = useState([]);
    const [user, setUser] = useState(null);
    const [bands, setBands] = useState([]);
    const [invitations, setInvitations] = useState([]);
    const [expandedBands, setExpandedBands] = useState({});
    const [eventCreators, setEventCreators] = useState({});
    const [forceRender, setForceRender] = useState(false);

    useEffect(() => {
        const fetchUserData = async () => {


            if (!auth.currentUser) return navigate("/login");

            setUser(auth.currentUser);
            console.log("Current User UID:", auth.currentUser.uid);

            //query firestore for bands
            const bandsRef = collection(db, "bands");
            const q = query(bandsRef, where("members", "array-contains", auth.currentUser.uid));
            const querySnapshot = await getDocs(q);

            //store bands in state
            const userBands = await Promise.all(querySnapshot.docs.map(async (bandDoc) => {
                const bandData = bandDoc.data();

                const memberNames = await Promise.all(
                    bandData.members.map(async (uid) => await getUserName(uid))
                );

                return {
                    id: bandDoc.id,
                    ...bandData,
                    members: memberNames,
                    leaderName: await getUserName(bandData.leaderId)
                }
            }))

            setBands(userBands);

            if (userBands.length === 0) {
                setEvents([]);
                
            } else {
                const eventsRef = collection(db, "events");
                const eventQuery = query(eventsRef, where("bandId", "in", userBands.map(band => band.id)));
                const eventSnapshot = await getDocs(eventQuery);

                

                const userEvents = await Promise.all(
                    eventSnapshot.docs.map(async (eventDoc) => {
                        const eventData = eventDoc.data();

                        const bandRef = doc(db, "bands", eventData.bandId);
                        const bandSnap = await getDoc(bandRef);
                        const bandName = bandSnap.exists() ? bandSnap.data().name : "Unknown Band";

                        return {
                            id: eventDoc.id,
                            ...eventData,
                            bandName,
                        };
                    })
                );
                setEvents(userEvents);

                const creatorNames = [];
                await Promise.all(userEvents.map(async (event) => {
                    creatorNames[event.createdBy] = await getUserName(event.createdBy);
                }));
                setEventCreators(creatorNames);
            }


            

            //fetching pending invites
            const userEmail = auth.currentUser.email;
            const inviteQuery = query(collection(db, "invitations"), where("invitedEmail", "==", userEmail));
            const inviteSnapshot = await getDocs(inviteQuery);

            const pendingInvites = await Promise.all(
                inviteSnapshot.docs.map(async (inviteDoc) => {  
                    const inviteData = inviteDoc.data();
            
                    // Fetch Band Name
                    const bandRef = doc(db, "bands", inviteData.bandId);
                    const bandSnap = await getDoc(bandRef);
                    const bandName = bandSnap.exists() ? bandSnap.data().name : "Unknown Band";
                    
        
                    // Fetch Inviter Name
                    let inviterName = "Unknown User";
                    if (inviteData.invitedBy) {
                        try {
                            const inviterRef = doc(db, "users", inviteData.invitedBy);
                            const inviterSnap = await getDoc(inviterRef);
                            if (inviterSnap.exists()) {
                                inviterName = inviterSnap.data().displayName || "Unknown User";
                            }
                        } catch (error) {
                            console.error("Error fetching inviter name:", error);
                        }
                    }
        
                    
                    setEventCreators((prevCreators) => ({
                        ...prevCreators,
                        [inviteData.invitedBy]: inviterName,
                    }));
        
                    return {
                        id: inviteDoc.id,  
                        bandName,
                        invitedBy: inviteData.invitedBy,
                        ...inviteData
                    };
                })
            );
            

            setInvitations([...pendingInvites]);
            

        } 
    
        fetchUserData();
    }, [navigate]);

    //accept invite
    const acceptInvite = async (inviteId, bandId) => {
        try {
            const user = auth.currentUser;
            if (!user) return alert("You must be logged in.");
    
            const bandRef = doc(db, "bands", bandId);
    
            
            await updateDoc(bandRef, {
                members: arrayUnion(user.uid),
            });
            
    
            
            await deleteDoc(doc(db, "invitations", inviteId));
            
    
            alert("You have joined the band!");
        } catch (error) {
            console.error("Error accepting invite:", error);
            alert(`Failed to accept invite: ${error.message}`);
        }
    };
    
    
      //reject invite
      const rejectInvite = async (inviteId) => {
        try {
          await deleteDoc(doc(db, "invitations", inviteId));
          alert("Invitation rejected.");
          setInvitations(invitations.filter(invite => invite.id !== inviteId));
        } catch (error) {
          console.error("Error rejecting invite:", error);
          alert("Failed to reject invite.");
        }
      };

      //toggle band expansion
      const toggleBandExpansion = (bandId) => {
        setExpandedBands((prev) => ({
            ...prev,
            [bandId]: !prev[bandId],
        }));
      };

      //remove member
      const removeMember = async (bandId, memberName) => {
        try {
            if (!auth.currentUser) return alert("You must be logged in.");
            
            const user = auth.currentUser;
            const bandRef = doc(db, "bands", bandId);
    
            
            const bandSnap = await getDoc(bandRef);
            if (!bandSnap.exists()) {
                alert("Band not found.");
                return;
            }
            const bandData = bandSnap.data();
    
            
            const usersRef = collection(db, "users");
            const userQuery = query(usersRef, where("displayName", "==", memberName));
            const userSnapshot = await getDocs(userQuery);
    
            if (userSnapshot.empty) {
                alert("User not found in Firestore.");
                return;
            }
    
            const memberUID = userSnapshot.docs[0].id; // 
    
            
            if (!bandData.members.includes(memberUID)) {
                alert("User is not a member of this band.");
                return;
            }
    
            if (memberUID === user.uid) {
                alert("You cannot remove yourself as the leader!");
                return;
            }
    
           
    
            
            await updateDoc(bandRef, {
                members: arrayRemove(memberUID) 
            });
    
            
            
            setBands(prevBands =>
                prevBands.map(band =>
                    band.id === bandId
                        ? {...band, members: band.members.filter(m => m !== memberName) }
                        : band
                )
            );
    
            alert(`Removed ${memberName} from the band.`);
        } catch (error) {
            console.error("Error removing member:", error);
            alert("Failed to remove member.");
        }
    };
    
    
    //get username
    const getUserName = async (uid) => {
        if (!uid) return "Unknown User";

        try {
            const userRef = doc(db, "users", uid);
            const userSnap = await getDoc(userRef);

            if (userSnap.exists()) {
                return userSnap.data().displayName;
            } else {
                return "Unknown User";
            }
        } catch (error) {
            console.error("Error fetching user name:", error);
            return "Unknown User";
        }
    }

    //delete event
    const deleteEvent = async (eventId) => {
        try {
            await deleteDoc(doc(db, "events", eventId));
            setEvents(events.filter(event => event.id !== eventId));
            alert("Event deleted successfully!")
        } catch (error) {
            console.error("Error deleting event:", error);
            alert("Failed to delete event.");
        }
    }

    return (
        <div className="p-6">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <hr className="my-4 border-gray-300" />
      
          <h2 className="text-2xl font-semibold mb-4">Upcoming Events</h2>
            {events.length > 0 ? (
            <ul className="space-y-4">
                {events.map(event => (
                <li key={event.id} className="p-4 bg-white shadow-md rounded-lg relative">
                    <strong>{event.title}</strong> - {new Date(event.date).toLocaleString()}
                    <p><b>Location:</b> {event.location}</p>
                    <p><b>Band:</b> {event.bandName || "Unknown Band"}</p>
                    <p><b>Created By:</b> {event.createdBy === user.uid ? "You" : eventCreators[event.createdBy] || "Loading..."}</p>
                    {(event.createdBy === user.uid || bands.some(band => band.id === event.bandId && band.leaderId === user.uid)) && (
                    <button
                        onClick={() => deleteEvent(event.id)}
                        className="absolute top-2 right-2 text-red-500 hover:text-red-700 transition"
                        title="Delete Event"
                    >
                        <FaTimes size={18} />
                    </button>
                    )}
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
                <li key={band.id} className="p-4 bg-white shadow-md rounded-lg">
                    <div className="flex justify-between items-center">
                    <div>
                        <h3 className="text-lg font-bold">{band.name}</h3>
                        <p className="text-sm text-gray-600">
                        {band.leaderId === user.uid ? "Leader" : "Member"}
                        </p>
                    </div>

                    <button
                        onClick={() => toggleBandExpansion(band.id)}
                        className="bg-purple-600 text-white px-3 py-1 rounded hover:bg-purple-700 transition"
                    >
                        {expandedBands[band.id] ? "Collapse" : "View Band"}
                    </button>
                    </div>

                    {/* Show members if expanded */}
                    {expandedBands[band.id] && (
                    <div className="mt-4 p-3 border rounded-lg bg-gray-100">
                        <p className="font-semibold">Members:</p>
                        <ul className="mt-2 space-y-2">
                            {band.members.map((member, index) => (
                                <li key={index} className="flex justify-between items-center">
                                {member} {member === user.displayName ? "(You)" : ""}

                                {/* Show remove button only for leaders, except for themselves */}
                                {band.leaderName === user.displayName && member !== user.displayName && (
                                    <button
                                    className="ml-2 bg-red-500 text-white px-2 py-1 rounded hover:bg-red-700 transition"
                                    onClick={() => removeMember(band.id, member)}
                                    >
                                    Remove
                                    </button>
                                )}
                                </li>
                            ))}
                        </ul>
                    </div>
                    )}
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
                        <p><b>Invited by:</b> {eventCreators[invite.invitedBy] || "Fetching..."}</p>



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