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
        <div>
            <h1>Login</h1>
            {/*this is the html that creates an H1 for login and creates a button with an onClick function that creates a login with Google button*/}
            <button onClick={loginWithGoogle}>Login with Google</button>
        </div>
    );
}