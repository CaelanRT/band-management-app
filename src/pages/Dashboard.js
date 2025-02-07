import { auth } from "../firebase";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
    const navigate = useNavigate();

    const logout = async () => {
        await auth.signOut();
        navigate("/login");
    };

    return (
        <div>
            <h1>Dashboard</h1>
            <p>Welcome! You are logged in.</p>
            <button onClcik = {logout}>Logout</button>
        </div>
    );
}