import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { auth, db } from "../firebase";
import { doc, getDoc, updateDoc, arrayRemove, deleteDoc } from "firebase/firestore";
import { FaArrowLeft, FaTrash, FaUserCircle } from "react-icons/fa";

export default function BandDetails() {
    const { bandId } = useParams();
    const [band, setBand] = useState(null);
    const [members, setMembers] = useState([]);
    const [memberUids, setMemberUids] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchBand = async () => {
            if (!auth.currentUser) return navigate("/login");

            const bandRef = doc(db, "bands", bandId);
            const bandSnap = await getDoc(bandRef);

            if (bandSnap.exists()) {
                const bandData = bandSnap.data();

                // Fetch user names for all members
                const memberNames = await Promise.all(
                    bandData.members.map(async (uid) => {
                        const userRef = doc(db, "users", uid);
                        const userSnap = await getDoc(userRef);
                        return userSnap.exists() ? userSnap.data().displayName : "Unknown User";
                    })
                );

                setBand({ id: bandId, ...bandData });
                setMembers(memberNames);
                setMemberUids(bandData.members);
            } else {
                alert("Band not found.");
                navigate("/bands");
            }
        };

        fetchBand();
    }, [bandId, navigate]);

    const removeMember = async (memberIndex) => {
        if (!band || band.leaderId !== auth.currentUser.uid) return;
        const memberUid = memberUids[memberIndex];

        if (memberUid === auth.currentUser.uid) return alert("You cannot remove yourself as leader!");

        const bandRef = doc(db, "bands", bandId);
        await updateDoc(bandRef, {
            members: arrayRemove(memberUid)
        });

        // Update local state
        setMembers(members.filter((_, index) => index !== memberIndex));
        setMemberUids(memberUids.filter((_, index) => index !== memberIndex));
    };

    const deleteBand = async () => {
        if (!band || band.leaderId !== auth.currentUser.uid) return;

        if (!window.confirm("Are you sure you want to delete this band? This action cannot be undone.")) return;

        const bandRef = doc(db, "bands", bandId);
        await deleteDoc(bandRef);
        alert("Band deleted.");
        navigate("/bands");
    };

    if (!band) return <div className="text-center p-6">Loading...</div>;

    return (
        <div className="p-6 flex flex-col items-center">
            {/* Back Button */}
            <button 
                onClick={() => navigate("/bands")} 
                className="flex items-center text-gray-600 hover:text-gray-800 self-start mb-4"
            >
                <FaArrowLeft className="mr-2" />
                Back to Bands
            </button>

            {/* Band Info Card */}
            <div className="bg-white shadow-lg rounded-lg p-6 w-full max-w-2xl text-center">
                <h1 className="text-3xl font-bold text-purple-700">{band.name}</h1>
                <p className="text-gray-600 mt-2">
                    {band.leaderId === auth.currentUser.uid ? (
                        <span className="bg-purple-200 text-purple-800 px-2 py-1 rounded-full text-sm">
                            You are the Leader
                        </span>
                    ) : "Member"}
                </p>
            </div>

            <hr className="my-6 border-gray-300 w-full max-w-2xl" />

            {/* Members List */}
            <div className="bg-white shadow-lg rounded-lg p-6 w-full max-w-2xl">
                <h2 className="text-2xl font-semibold mb-4">Members</h2>
                <ul className="space-y-3">
                    {members.map((name, index) => (
                        <li key={index} className="flex justify-between items-center bg-gray-100 p-3 rounded-lg shadow-sm">
                            <div className="flex items-center space-x-3">
                                <FaUserCircle size={24} className="text-gray-500" />
                                <span>{name} {name === auth.currentUser.displayName ? "(You)" : ""}</span>
                            </div>
                            
                            {band.leaderId === auth.currentUser.uid && name !== auth.currentUser.displayName && (
                                <button
                                    className="bg-red-500 text-white px-3 py-1 rounded-full hover:bg-red-700 transition"
                                    onClick={() => removeMember(index)}
                                >
                                    Remove
                                </button>
                            )}
                        </li>
                    ))}
                </ul>
            </div>

            {/* Delete Band Button */}
            {band.leaderId === auth.currentUser.uid && (
                <button
                    className="mt-6 bg-red-600 text-white px-6 py-3 rounded-full shadow-lg hover:bg-red-700 transition flex items-center space-x-2"
                    onClick={deleteBand}
                >
                    <FaTrash />
                    <span>Delete Band</span>
                </button>
            )}
        </div>
    );
}
