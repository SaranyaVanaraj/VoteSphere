
import { useState } from "react";
import {
  Link,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import { Lock } from "lucide-react";
import { resetPassword } from "../services/api";

function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    if (!token) {
      setMessage("Reset link is missing or invalid.");
      return;
    }

    if (password.length < 8) {
      setMessage("Password must contain at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setMessage("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const data = await resetPassword(token, password);
      setMessage(data.message);
      setSuccess(true);
    } catch (error) {
      setMessage(error.message || "Password reset failed.");
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

        <h1>Reset Password</h1>

        <p className="auth-subtitle">
          Create a new password for your VoteSphere account.
        </p>

        {message && (
          <p className="form-message" role="status">
            {message}
          </p>
        )}

        {!success && (
          <form onSubmit={handleSubmit} className="auth-form">
            <label htmlFor="new-password">New Password</label>
            <div className="input-wrapper">
              <Lock size={19} />
              <input
                id="new-password"
                type="password"
                placeholder="Minimum 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={8}
                maxLength={72}
                autoComplete="new-password"
                required
              />
            </div>

            <label htmlFor="confirm-password">
              Confirm Password
            </label>
            <div className="input-wrapper">
              <Lock size={19} />
              <input
                id="confirm-password"
                type="password"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) =>
                  setConfirmPassword(e.target.value)
                }
                autoComplete="new-password"
                required
              />
            </div>

            <button
              type="submit"
              className="auth-submit"
              disabled={loading || !token}
            >
              {loading ? "Updating..." : "Reset Password"}
            </button>
          </form>
        )}

        {success && (
          <button
            className="auth-submit"
            onClick={() => navigate("/login")}
          >
            Go to Login
          </button>
        )}

        <p className="auth-switch">
          <Link to="/login">Back to Sign In</Link>
        </p>
      </div>
    </main>
  );
}

export default ResetPassword;
