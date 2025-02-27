import { auth, db } from "../firebase";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { collection, query, where, getDocs, doc, getDoc, updateDoc, arrayUnion, deleteDoc, arrayRemove } from "firebase/firestore";

export default function Dashboard() {
    const navigate = useNavigate();
    const [events, setEvents] = useState([]);
    const [user, setUser] = useState(null);
    const [bands, setBands] = useState([]);
    const [invitations, setInvitations] = useState([]);
    const [expandedBands, setExpandedBands] = useState({});
    const [eventCreators, setEventCreators] = useState({});

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
            const userBands = await Promise.all(querySnapshot.docs.map(async (doc) => {
                const bandData = doc.data();

                const memberNames = await Promise.all(
                    bandData.members.map(async (uid) => await getUserName(uid))
                );

                return {
                    id: doc.id,
                    ...bandData,
                    members: memberNames,
                    leaderName: await getUserName(bandData.leaderId)
                }
            }))

            console.log("Fetched Bands:", userBands);
            setBands(userBands);

            if (userBands.length === 0) {
                setEvents([]);
                
            } else {
                const eventsRef = collection(db, "events");
                const eventQuery = query(eventsRef, where("bandId", "in", userBands.map(band => band.id)));
                const eventSnapshot = await getDocs(eventQuery);

                const userEvents = eventSnapshot.docs.map(doc => ({
                 id: doc.id,
                    ...doc.data()
                }));
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

            const pendingInvites = inviteSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
            }));

            console.log("Fetched Invitations", pendingInvites);
            
            setInvitations(pendingInvites);
        } 
    
        fetchUserData();
    }, [navigate]);

    const acceptInvite = async (inviteId, bandId) => {
        try {
          const user = auth.currentUser;
          if (!user) return alert("You must be logged in.");

          
      
          //Update the band document to add the user as a member
          const bandRef = doc(db, "bands", bandId);
          const bandSnap = await getDoc(bandRef);

          if(!bandSnap.exists()) {
            alert("Band not found.");
            return;
          }

      
          if (bandSnap.exists()) {
            const bandData = bandSnap.data();
            const updatedMembers = [...(bandData.members || []), user.uid];
            
            await updateDoc(bandRef, {
                members: arrayUnion(user.uid)
            });

      
            //  Delete the invitation after accepting
            await deleteDoc(doc(db, "invitations", inviteId));

      
            alert("You have joined the band!");
            setInvitations(invitations.filter(invite => invite.id !== inviteId));
      
            //  Refresh the bands list to include the new band
            setBands([...bands, { id: bandId, ...bandData, members: updatedMembers }]);
          }
        } catch (error) {
          console.error("Error accepting invite:", error);
          alert("Failed to accept invite.");
        }
      };
      
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

      const toggleBandExpansion = (bandId) => {
        setExpandedBands((prev) => ({
            ...prev,
            [bandId]: !prev[bandId],
        }));
      };

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
    
            console.log(`Removing ${memberName} (UID: ${memberUID}) from band ${bandId}`);
    
            
            await updateDoc(bandRef, {
                members: arrayRemove(memberUID) 
            });
    
            console.log("Member removed from Firestore!");
            
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


    //logout function
    const logout = async () => {
        await auth.signOut();
        navigate("/login");
    };

    return (
        <div className="p-6">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <hr className="my-4 border-gray-300" />
      
          <h2 className="text-2xl font-semibold mb-4">Upcoming Events</h2>
          {events.length > 0 ? (
            <ul className="space-y-4">
              {events.map(event => (
                <li key={event.id} className="p-4 bg-white shadow-md rounded-lg">
                  <strong>{event.title}</strong> - {new Date(event.date).toLocaleString()}
                  <p><b>Location:</b> {event.location}</p>
                  <p><b>Created By:</b> {event.createdBy === user.uid ? "You" : eventCreators[event.createdBy] || "Loading..."}</p>
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
                <li key={invite.id} className="p-4 bg-white shadow-md rounded-lg">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-lg font-bold">{invite.bandName || "Unknown Band"}</h3>
                      <p className="text-sm text-gray-600">Invited by: {invite.invitedBy || "Unknown User"}</p>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => acceptInvite(invite.id, invite.bandId)}
                        className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 transition"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => rejectInvite(invite.id)}
                        className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-700 transition"
                      >
                        Reject
                      </button>
                    </div>
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