import { auth, db } from "../firebase";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { collection, query, where, getDocs, doc, getDoc, updateDoc, arrayUnion, deleteDoc, arrayRemove } from "firebase/firestore";

export default function Dashboard() {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [bands, setBands] = useState([]);
    const [invitations, setInvitations] = useState([]);

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
            const userBands = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            console.log("Fetched Bands:", userBands);
            setBands(userBands);

            //fetching pending invites
            const userEmail = auth.currentUser.email;
            const inviteQuery = query(collection(db, "invitations"), where("invitedEmail", "==", userEmail));
            const inviteSnapshot = await getDocs(inviteQuery);

            const pendingInvites = inviteSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
            }));
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

      const removeMember = async (bandId, memberEmail) => {
        try {
            if (!auth.currentUser) return alert ("You must be logged in.");
            

            const user = auth.currentUser;
            if (user.email === memberEmail) {
                alert("You cannot remove yourself as the leader!");
                return;
            }

            console.log(`Removing ${memberEmail} from band ${bandId}`);

            const bandRef = doc(db, "bands", bandId);

            await updateDoc(bandRef, {
                members: arrayRemove(memberEmail)
            });

            console.log("Member removed from Firestore!");
            
            setBands(prevBands =>
                prevBands.map(band =>
                    band.id === bandId
                        ? {...band,members: band.members.filter(m => m!== memberEmail) }
                        : band
                )
            );

            alert(`Removed ${memberEmail} from the band.`);
        } catch (error) {
            console.error("Error removing member:", error);
            alert("Failed to remove member.");
        }
      }


    //logout function
    const logout = async () => {
        await auth.signOut();
        navigate("/login");
    };

    return (
        <div>
            <h1>Dashboard</h1>
            {user && (
                <div>
                    <h2>Welcome, {user.displayName}</h2>
                    <p>Email: {user.email}</p>
                    <button onClick={logout}>Logout</button>
                    <button onClick={() => navigate("/create-band")}>Create a Band</button>
                </div>    
            )}

            <h2>Your Bands</h2>
            {bands.length > 0 ? (
                <ul>
                    {bands.map(band =>(
                        <li key={band.id} className="border p-3 rounded-md shadow-md mb-4">
                            <strong>{band.name}</strong>
                            <p><b>Leader:</b> {band.leaderId === user.uid ? "You" : "Someone else"}</p>

                            <p><b>Members:</b></p>
                            <ul className="list-disc ml-4">
                                {band.members.map(member => (
                                    <li key={member} className="flex justify-between items-center">
                                        {member === user.email ? `${member} (You)` : member}

                                        {band.leaderId === user.uid && member !== user.email && member !== band.leaderId && (
                                            <button
                                                className="ml-2 bg-red-500 text-white px-2 py-1 rounded"
                                                onClick={() => removeMember(band.id, member)}
                                            >
                                                Remove
                                            </button>
                                        )}
                                    </li>
                                ))}
                            </ul>

                            {band.leaderId === user.uid && (
                                <button onClick={() => navigate(`/invite/${band.id}`)}>Invite Members</button>
                            )}
                        </li>
                    ))}
                </ul>
            ) : (
                <p>You are not a member of any bands yet.</p>
            )}

            <h2>Pending Invitations</h2>
            {invitations.length > 0 ? (
            <ul>
                {invitations.map(invite => (
                <li key={invite.id}>
                     <strong>{invite.bandName}</strong> (Invited by: {invite.invitedBy})
                    <button onClick={() => acceptInvite(invite.id, invite.bandId)}>Accept</button>
                    <button onClick={() => rejectInvite(invite.id)}>Reject</button>
                </li>
                ))}
            </ul>
            ) : (
            <p>No pending invitations.</p>
            )}

        </div>
    );
}