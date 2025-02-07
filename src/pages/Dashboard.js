import { auth, db } from "../firebase";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { collection, query, where, getDocs, doc, updateDoc, deleteDoc } from "firebase/firestore";

export default function Dashboard() {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [bands, setBands] = useState([]);
    const [invitations, setInvitations] = useState([]);

    useEffect(() => {
        const fetchUserData = async () => {
            if (!auth.currentUser) return navigate("/login");

            setUser(auth.currentUser);

            //query firestore for bands
            const bandsRef = collection(db, "bands");
            const q = query(bandsRef, where("members", "array-contains", auth.currentUser.uid));
            const querySnapshot = await getDocs(q);

            //store bands in state
            const userBands = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setBands(userBands);

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
          const bandSnap = await getDocs(bandRef);
      
          if (bandSnap.exists()) {
            const bandData = bandSnap.data();
            const updatedMembers = [...bandData.members, user.uid];
      
            await updateDoc(bandRef, { members: updatedMembers });
      
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
                        <li key={band.id}>
                            <strong>{band.name}</strong> (Leader: {band.leaderId === user.uid ? "You" : "Someone else"})
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
                    🎸 <strong>{invite.bandName}</strong> (Invited by: {invite.invitedBy})
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