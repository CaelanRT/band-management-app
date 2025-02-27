import { auth, db } from "../firebase";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { doc, setDoc, getDoc } from "firebase/firestore";

export default function Login() {
    const navigate = useNavigate();

    const loginWithGoogle = async () => {
        try {
            //when the button gets clicked, it calls this function with creates a new object and passes that object and auth into the signin popup and then we get a response
            const provider = new GoogleAuthProvider();
            const result = await signInWithPopup(auth, provider);
            const user = result.user;

            console.log("User logged in:", user);

            const userRef = doc(db, "users", user.uid);
            const userSnap = await getDoc(userRef);

            if (!userSnap.exists()) {
                await setDoc (userRef, {
                    uid: user.uid,
                    displayName: user.displayName,
                    email: user.email,
                    photoURL: user.photoURL,
                    createdAt: new Date(),
                });
                console.log("New user added to Firestore!");
            } else {
                console.log("User already exists in Firestore.")
            }


            navigate("/dashboard"); //this redirects the user to the /dashboard page by passing /dashboard into the navigate object I instantiate above
        } catch (error) {
            console.error("Login error:", error);
            alert("Login failed! Check console for details");
        }
    };

    return (
        <div className="flex flex-col items-center justify-center h-screen bg-purple-800 text-white">
            <h1 className="text-4xl font-bold mb-6">Welcome to BandOS</h1>
            <p className="mb-6 text-lg text-gray-300">Please log in to continue</p>
            <button
                onClick={loginWithGoogle}
                className="bg-white text-purple-800 font-semibold px-6 py-3 rounded-lg shadow-md hover:bg-gray-200 transition flex items-center"
            >
                <img
                    src="https://upload.wikimedia.org/wikipedia/commons/thumb/5/53/Google_%22G%22_Logo.svg/512px-Google_%22G%22_Logo.svg.png"
                    alt="Google Logo"
                    className="w-6 h-6 mr-3"
                />
                Login with Google
            </button>
        </div>
    );
    
}