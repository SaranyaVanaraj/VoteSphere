import { useNavigate } from "react-router-dom";
import { loginUser } from "../services/api";
import { useState } from "react";
import { Link } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff, ArrowRight } from "lucide-react";

function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false); 
  
const handleSubmit = async (e) => {
  e.preventDefault();
  setMessage("");

  if (!form.email.trim() || !form.password) {
    setMessage("Please fill in all fields.");
    return;
  }

  setLoading(true);

  try {
    const data = await loginUser({
      email: form.email,
      password: form.password,
    });

    sessionStorage.setItem("token", data.token);
    sessionStorage.setItem("user", JSON.stringify(data.user));

    navigate("/dashboard");
  } catch (error) {
    setMessage(error.message);
  } finally {
    setLoading(false);
  }
};


  return (
    <main className="auth-page">
      <div className="auth-card">
        <div className="auth-icon"><Lock size={25} /></div>

        <h1>Welcome back</h1>
        <p className="auth-subtitle">
          Sign in to manage your polls and see live results.
        </p>

        <form onSubmit={handleSubmit} className="auth-form">
          <label htmlFor="login-email">Email Address</label>
          <div className="input-wrapper">
            <Mail size={19} />
            <input
              id="login-email"
              type="email"
              placeholder="Enter your email"
              value={form.email}
              onChange={(e) =>
                setForm({ ...form, email: e.target.value })
              }
              required
            />
          </div>

          <label htmlFor="login-password">Password</label>
          <div className="input-wrapper">
            <Lock size={19} />
            <input
              id="login-password"
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              value={form.password}
              onChange={(e) =>
                setForm({ ...form, password: e.target.value })
              }
              required
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
            </button>
          </div>

          {message && <p className="form-message">{message}</p>}

          <button type="submit" className="auth-submit" disabled={loading}>
          {loading ? "Signing In..." : "Sign In"}
          </button>
        </form>

        <p className="auth-switch">
          Don't have an account? <Link to="/signup">Sign up</Link>
        </p>
      </div>
    </main>
  );
}

export default Login;

