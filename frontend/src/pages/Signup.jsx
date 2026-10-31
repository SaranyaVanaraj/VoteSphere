import { useNavigate } from "react-router-dom";
import { signupUser } from "../services/api";
import { useState } from "react";
import { Link } from "react-router-dom";
import {
  User, Mail, Lock, Eye, EyeOff,
  ArrowRight, UserPlus
} from "lucide-react";

function Signup() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: ""
  });
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  
const handleSubmit = async (e) => {
  e.preventDefault();
  setMessage("");

  if (Object.values(form).some((value) => !value.trim())) {
    setMessage("Please fill in all fields.");
    return;
  }

  if (form.password.length < 8) {
    setMessage("Password must contain at least 8 characters.");
    return;
  }

  if (form.password !== form.confirmPassword) {
    setMessage("Passwords do not match.");
    return;
  }

  setLoading(true);

  try {
    await signupUser({
      name: form.name,
      email: form.email,
      password: form.password,
    });

    alert("Account created successfully! Please log in.");
    navigate("/login");
  } catch (error) {
    setMessage(error.message);
  } finally {
    setLoading(false);
  }
};


  return (
    <main className="auth-page">
      <div className="auth-card">
        <div className="auth-icon"><UserPlus size={25} /></div>

        <h1>Create your account</h1>
        <p className="auth-subtitle">
          Join VoteSphere and start creating interactive polls.
        </p>

        <form onSubmit={handleSubmit} className="auth-form">
          <label htmlFor="signup-name">Full Name</label>
          <div className="input-wrapper">
            <User size={19} />
            <input
              id="signup-name"
              name="name"
              type="text"
              placeholder="Enter your full name"
              value={form.name}
              onChange={handleChange}
              required
            />
          </div>

          <label htmlFor="signup-email">Email Address</label>
          <div className="input-wrapper">
            <Mail size={19} />
            <input
              id="signup-email"
              name="email"
              type="email"
              placeholder="Enter your email"
              value={form.email}
              onChange={handleChange}
              required
            />
          </div>

          <label htmlFor="signup-password">Password</label>
          <div className="input-wrapper">
            <Lock size={19} />
            <input
              id="signup-password"
              name="password"
              type={showPassword ? "text" : "password"}
              placeholder="Minimum 8 characters"
              value={form.password}
              onChange={handleChange}
              minLength={8}
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

          <label htmlFor="signup-confirm">Confirm Password</label>
          <div className="input-wrapper">
            <Lock size={19} />
            <input
              id="signup-confirm"
              name="confirmPassword"
              type={showPassword ? "text" : "password"}
              placeholder="Re-enter your password"
              value={form.confirmPassword}
              onChange={handleChange}
              required
            />
          </div>

          {message && <p className="form-message">{message}</p>}

          <button type="submit" className="auth-submit" disabled={loading}>
          {loading ? "Creating Account..." : "Create Account"}
          </button>
        </form>

        <p className="auth-switch">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </main>
  );
}

export default Signup;
