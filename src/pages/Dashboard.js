import { auth, db } from "../firebase";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";

export default function Dashboard() {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);

    useEffect(() => {
        const fetchUserData = async () => {
            if (!auth.currentUser) return navigate("/login");

            const userRef = doc(db, "users", auth.currentUser.uid);
            const userSnap = await getDoc(userRef);

            if (userSnap.exists()) {
                setUser(userSnap.data());
            } else {
                console.log("No user data found in Firestore.");
            }
        };
    
        fetchUserData();
    }, [navigate]);

    //logout function
    const logout = async () => {
        await auth.signOut();
        navigate("/login");
    };

    return (
        <div>
            {user ? (
                <div>
                    <img src={user.photoURL} alt="User" width="100" style={{ borderRadius: "50%"}} />
                    <h2>{user.displayName}</h2>
                    <p>Email: {user.email}</p>
                    <button onClick={() => navigate("/create-band")}>Create a Band</button>
                    <button onClick={logout}>Logout</button>
                </div>
            ) : (
                <p>Loading user data...</p>
            )
            
        }
        </div>
    );
}