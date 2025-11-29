import { useState } from "react";
import {
    AiOutlineEye,
    AiOutlineEyeInvisible,
    AiOutlineUser,
    AiOutlineLock,
} from "react-icons/ai";
import { useAuth } from "../hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { useAuthContext } from "../context/AuthContext";
import ThemeSwitcheFloating from "../components/ThemeSwitcherFloating";

const Login = () => {
    const { login: authLogin, loading, error } = useAuth();
    const { login: setUser } = useAuthContext();
    const navigate = useNavigate();

    const [passwordVisible, setPasswordVisible] = useState(false);
    const [formData, setFormData] = useState({ username: "", password: "" });

    const handleChange = (e) =>
        setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        const loggedInUser = await authLogin(formData.username, formData.password);

        const userData = {
            user_id: loggedInUser.user_id,
            username: loggedInUser.username,
            full_name: loggedInUser.full_name,
            role: loggedInUser.role,
        };
        setUser(userData);

        if (loggedInUser.role === "admin") navigate("/home");
        else if (loggedInUser.role === "cashier") navigate("/pos");
        else navigate("/login");
    };

    return (
        <div className="d-flex justify-content-center align-items-center min-vh-100">
            <div className="login-card">

                <h2 className="text-center mb-4">POS Login</h2>
                <ThemeSwitcheFloating />
                {error && (
                    <div className="alert alert-danger text-center py-2">{error}</div>
                )}

                <form onSubmit={handleSubmit}>
                    {/* Username */}
                    <div className="mb-3 position-relative">
                        <AiOutlineUser
                            className="position-absolute icon-muted"
                            style={{ top: "10px", left: "10px" }}
                        />
                        <input
                            type="text"
                            name="username"
                            placeholder="Username"
                            value={formData.username}
                            onChange={handleChange}
                            required
                            className="form-control ps-5 login-input"
                            autoComplete="username"
                        />
                    </div>

                    {/* Password */}
                    <div className="mb-3 position-relative">
                        <AiOutlineLock
                            className="position-absolute icon-muted"
                            style={{ top: "10px", left: "10px" }}
                        />
                        <input
                            type={passwordVisible ? "text" : "password"}
                            name="password"
                            placeholder="Password"
                            value={formData.password}
                            onChange={handleChange}
                            required
                            className="form-control ps-5 pe-5 login-input"
                            autoComplete="current-password"
                        />

                        <button
                            type="button"
                            className="btn btn-link position-absolute p-0 icon-muted"
                            style={{ top: "6px", right: "10px" }}
                            onClick={() => setPasswordVisible(!passwordVisible)}
                        >
                            {passwordVisible ? (
                                <AiOutlineEyeInvisible size={20} />
                            ) : (
                                <AiOutlineEye size={20} />
                            )}
                        </button>
                    </div>

                    <button
                        type="submit"
                        className="btn btn-success w-100"
                        disabled={loading}
                    >
                        {loading ? "Logging in..." : "Login"}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Login;
