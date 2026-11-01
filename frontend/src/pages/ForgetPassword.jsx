
import { useState } from "react";
import { Link } from "react-router-dom";
import { Mail, LockKeyhole } from "lucide-react";
import { forgotPassword } from "../services/api";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    try {
      const data = await forgotPassword(email.trim());
      setMessage(data.message);
    } catch (error) {
      setMessage(error.message || "Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page">
      <div className="auth-card">
        <div className="auth-icon">
          <LockKeyhole size={25} />
        </div>

        <h1>Forgot Password?</h1>

        <p className="auth-subtitle">
          Enter your registered email address to receive
          a password reset link.
        </p>

        <form onSubmit={handleSubmit} className="auth-form">
          <label htmlFor="reset-email">Email Address</label>

          <div className="input-wrapper">
            <Mail size={19} />
            <input
              id="reset-email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          {message && (
            <p className="form-message" role="status">
              {message}
            </p>
          )}

          <button
            type="submit"
            className="auth-submit"
            disabled={loading}
          >
            {loading ? "Sending..." : "Send Reset Link"}
          </button>
        </form>

        <p className="auth-switch">
          Remember your password?{" "}
          <Link to="/login">Sign in</Link>
        </p>
      </div>
    </main>
  );
}

export default ForgotPassword;
