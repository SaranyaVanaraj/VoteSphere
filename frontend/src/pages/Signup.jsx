
import { useState } from "react";
import {
  Link,
  useNavigate,
  useSearchParams,
} from "react-router-dom";

import {
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  UserPlus,
} from "lucide-react";

import { signupUser } from "../services/api";

function Signup() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");

  // Get the original poll URL from the QR code or shared link
  const next = searchParams.get("next");

  // Only allow internal application paths
  const safeNext =
    next &&
    next.startsWith("/") &&
    !next.startsWith("//") &&
    !next.startsWith("/\\")
      ? next
      : "/dashboard";

  // Preserve the poll URL when moving between signup and login
  const loginLink =
    `/login?next=${encodeURIComponent(safeNext)}`;

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    // Validate required fields
    if (Object.values(form).some((value) => !value.trim())) {
      setMessage("Please fill in all fields.");
      return;
    }

    // Validate password length
    if (form.password.length < 8) {
      setMessage("Password must contain at least 8 characters.");
      return;
    }

    // Validate matching passwords
    if (form.password !== form.confirmPassword) {
      setMessage("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      // Register the new user
      await signupUser({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
      });

      alert("Account created successfully! Please log in.");

      // Redirect to login while preserving the original poll
      navigate(loginLink, { replace: true });
    } catch (error) {
      setMessage(
        error.message || "Unable to create account. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page">
      <div className="auth-card">
        <div className="auth-icon">
          <UserPlus size={25} />
        </div>

        <h1>Create your account</h1>

        <p className="auth-subtitle">
          Join VoteSphere to create interactive polls,
          cast your votes, and view live results.
        </p>

        <form onSubmit={handleSubmit} className="auth-form">
          <label htmlFor="signup-name">
            Full Name
          </label>

          <div className="input-wrapper">
            <User size={19} />

            <input
              id="signup-name"
              name="name"
              type="text"
              placeholder="Enter your full name"
              value={form.name}
              onChange={handleChange}
              autoComplete="name"
              required
            />
          </div>

          <label htmlFor="signup-email">
            Email Address
          </label>

          <div className="input-wrapper">
            <Mail size={19} />

            <input
              id="signup-email"
              name="email"
              type="email"
              placeholder="Enter your email"
              value={form.email}
              onChange={handleChange}
              autoComplete="email"
              required
            />
          </div>

          <label htmlFor="signup-password">
            Password
          </label>

          <div className="input-wrapper">
            <Lock size={19} />

            <input
              id="signup-password"
              name="password"
              type={showPassword ? "text" : "password"}
              placeholder="Minimum 8 characters"
              value={form.password}
              onChange={handleChange}
              autoComplete="new-password"
              minLength={8}
              required
            />

            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={
                showPassword ? "Hide password" : "Show password"
              }
            >
              {showPassword ? (
                <EyeOff size={19} />
              ) : (
                <Eye size={19} />
              )}
            </button>
          </div>

          <label htmlFor="signup-confirm">
            Confirm Password
          </label>

          <div className="input-wrapper">
            <Lock size={19} />

            <input
              id="signup-confirm"
              name="confirmPassword"
              type={showPassword ? "text" : "password"}
              placeholder="Re-enter your password"
              value={form.confirmPassword}
              onChange={handleChange}
              autoComplete="new-password"
              required
            />
          </div>

          {message && (
            <p className="form-message" role="alert">
              {message}
            </p>
          )}

          <button
            type="submit"
            className="auth-submit"
            disabled={loading}
          >
            {loading ? "Creating Account..." : "Create Account"}
          </button>
        </form>

        <p className="auth-switch">
          Already have an account?{" "}
          <Link to={loginLink}>
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}

export default Signup;
