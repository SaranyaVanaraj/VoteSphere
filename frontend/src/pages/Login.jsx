
import { useState } from "react";
import {
  Link,
  useNavigate,
  useSearchParams,
} from "react-router-dom";

import {
  Mail,
  Lock,
  Eye,
  EyeOff,
} from "lucide-react";

import { loginUser } from "../services/api";

function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // Get the original page URL if the user came from a poll
  const next = searchParams.get("next");

  // Allow only internal application paths
  const safeNext =
    next &&
    next.startsWith("/") &&
    !next.startsWith("//") &&
    !next.startsWith("/\\")
      ? next
      : "/dashboard";

  // Preserve the original poll URL for signup
  const signupLink =
    `/signup?next=${encodeURIComponent(safeNext)}`;

  // Preserve the original poll URL for password reset
  const forgotPasswordLink =
    `/forgot-password?next=${encodeURIComponent(safeNext)}`;

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
        email: form.email.trim(),
        password: form.password,
      });

      if (!data.token) {
        throw new Error(
          "Login failed. No authentication token received."
        );
      }

      // Store authentication details
      sessionStorage.setItem("token", data.token);
      sessionStorage.setItem(
        "user",
        JSON.stringify(data.user)
      );

      // Redirect to original poll or dashboard
      navigate(safeNext, { replace: true });
    } catch (error) {
      setMessage(
        error.message ||
          "Unable to sign in. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page">
      <div className="auth-card">
        <div className="auth-icon">
          <Lock size={25} />
        </div>

        <h1>Welcome back</h1>

        <p className="auth-subtitle">
          Sign in to create polls, cast your vote,
          and view live results.
        </p>

        <form
          onSubmit={handleSubmit}
          className="auth-form"
        >
          {/* Email Address */}
          <label htmlFor="login-email">
            Email Address
          </label>

          <div className="input-wrapper">
            <Mail size={19} />

            <input
              id="login-email"
              type="email"
              placeholder="Enter your email"
              value={form.email}
              onChange={(e) =>
                setForm({
                  ...form,
                  email: e.target.value,
                })
              }
              autoComplete="email"
              required
            />
          </div>

          {/* Password */}
          <label htmlFor="login-password">
            Password
          </label>

          <div className="input-wrapper">
            <Lock size={19} />

            <input
              id="login-password"
              type={
                showPassword
                  ? "text"
                  : "password"
              }
              placeholder="Enter your password"
              value={form.password}
              onChange={(e) =>
                setForm({
                  ...form,
                  password: e.target.value,
                })
              }
              autoComplete="current-password"
              required
            />

            <button
              type="button"
              className="password-toggle"
              onClick={() =>
                setShowPassword(!showPassword)
              }
              aria-label={
                showPassword
                  ? "Hide password"
                  : "Show password"
              }
            >
              {showPassword ? (
                <EyeOff size={19} />
              ) : (
                <Eye size={19} />
              )}
            </button>
          </div>

          {/* Forgot Password */}
          <div
            style={{
              textAlign: "right",
              marginTop: "4px",
              marginBottom: "12px",
            }}
          >
            <Link
              to={forgotPasswordLink}
              style={{
                fontSize: "14px",
                fontWeight: "500",
                color: "var(--accent, #6366f1)",
                textDecoration: "none",
              }}
            >
              Forgot Password?
            </Link>
          </div>

          {/* Error Message */}
          {message && (
            <p
              className="form-message"
              role="alert"
            >
              {message}
            </p>
          )}

          {/* Sign In Button */}
          <button
            type="submit"
            className="auth-submit"
            disabled={loading}
          >
            {loading
              ? "Signing In..."
              : "Sign In"}
          </button>
        </form>

        {/* Signup Link */}
        <p className="auth-switch">
          Don't have an account?{" "}
          <Link to={signupLink}>
            Sign up
          </Link>
        </p>
      </div>
    </main>
  );
}

export default Login;
