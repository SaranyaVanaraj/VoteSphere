
import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Check,
  CheckCircle2,
  CircleAlert,
  Clock3,
  Eye,
  EyeOff,
  LockKeyhole,
  Radio,
  ShieldCheck,
  Sparkles,
  Users,
  Vote as VoteIcon,
} from "lucide-react";

import { getPublicPoll, submitVote } from "../services/api";
import "./Vote.css";

function Vote() {
  const { id } = useParams();

  const [poll, setPoll] = useState(null);
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadPoll() {
      setLoading(true);
      setError("");
      setPoll(null);
      setSelected([]);
      setSuccess(false);

      try {
        const data = await getPublicPoll(id);

        if (active) {
          setPoll(data.poll);
        }
      } catch (err) {
        if (active) {
          setError(err.message || "Unable to load poll.");
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadPoll();

    return () => {
      active = false;
    };
  }, [id]);

  const selectOption = (optionId) => {
    if (
      !poll ||
      poll.status !== "Active" ||
      submitting ||
      success
    ) {
      return;
    }

    if (poll.allowMultiple) {
      setSelected((previous) =>
        previous.includes(optionId)
          ? previous.filter((item) => item !== optionId)
          : [...previous, optionId]
      );
    } else {
      setSelected([optionId]);
    }
  };

  const handleVote = async () => {
    if (
      !poll ||
      poll.status !== "Active" ||
      selected.length === 0 ||
      submitting ||
      success
    ) {
      return;
    }

    setError("");
    setSubmitting(true);

    try {
      let voterId = localStorage.getItem(
        "votesphere_voter_id"
      );

      if (!voterId) {
        voterId = crypto.randomUUID();
        localStorage.setItem(
          "votesphere_voter_id",
          voterId
        );
      }

      await submitVote(id, selected, voterId);
      setSuccess(true);
    } catch (err) {
      setError(err.message || "Unable to submit vote.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <main className="vs-vote-page">
        <div className="vs-vote-state">
          <div className="vs-vote-spinner" />
          <h2>Loading your poll</h2>
          <p>Getting everything ready for you...</p>
        </div>
      </main>
    );
  }

  if (!poll) {
    return (
      <main className="vs-vote-page">
        <div className="vs-vote-state">
          <span className="vs-vote-state-icon error">
            <CircleAlert size={30} />
          </span>

          <h2>Poll unavailable</h2>
          <p>{error || "This poll could not be found."}</p>

          <Link to="/" className="vs-vote-home-link">
            <ArrowLeft size={17} />
            Back to Home
          </Link>
        </div>
      </main>
    );
  }

  const isActive = poll.status === "Active";
  const canSubmit =
    isActive &&
    selected.length > 0 &&
    !submitting &&
    !success;

  return (
    <main className="vs-vote-page">
      <div className="vs-vote-container">
        <Link to="/" className="vs-vote-back">
          <ArrowLeft size={17} />
          Back to Home
        </Link>

        <header className="vs-vote-heading">
          <div className="vs-vote-eyebrow">
            <Sparkles size={15} />
            YOUR VOICE MATTERS
          </div>

          <h1>
            Cast your <span>vote.</span>
          </h1>

          <p>
            Share your opinion and be part of the decision.
          </p>
        </header>

        <div className="vs-vote-layout">
          <section className="vs-vote-card">
            <div className="vs-vote-card-header">
              <div className="vs-vote-card-brand">
                <span className="vs-vote-brand-icon">
                  <BarChart3 size={20} />
                </span>

                <div>
                  <strong>VoteSphere</strong>
                  <small>Community Poll</small>
                </div>
              </div>

              <span
                className={`vs-vote-status ${
                  isActive ? "active" : "closed"
                }`}
              >
                <span />
                {isActive ? "Active Poll" : "Closed Poll"}
              </span>
            </div>

            <div className="vs-vote-card-body">
              <span className="vs-vote-label">
                <VoteIcon size={15} />
                QUESTION
              </span>

              <h2>{poll.question}</h2>

              <div className="vs-vote-instruction">
                <span className="vs-vote-instruction-icon">
                  {poll.allowMultiple ? (
                    <CheckCircle2 size={18} />
                  ) : (
                    <Radio size={18} />
                  )}
                </span>

                <span>
                  {poll.allowMultiple
                    ? "Select one or more answers below."
                    : "Choose your preferred answer below."}
                </span>
              </div>

              <div className="vs-vote-options">
                {poll.options.map((option, index) => {
                  const isSelected = selected.includes(
                    option.id
                  );

                  return (
                    <label
                      key={option.id}
                      className={`vs-vote-option ${
                        isSelected ? "selected" : ""
                      } ${
                        !isActive || success
                          ? "disabled"
                          : ""
                      }`}
                    >
                      <input
                        type={
                          poll.allowMultiple
                            ? "checkbox"
                            : "radio"
                        }
                        name="poll-option"
                        checked={isSelected}
                        onChange={() =>
                          selectOption(option.id)
                        }
                        disabled={
                          !isActive ||
                          submitting ||
                          success
                        }
                      />

                      <span className="vs-vote-option-number">
                        {String(index + 1).padStart(2, "0")}
                      </span>

                      <span className="vs-vote-option-text">
                        {option.text}
                      </span>

                      <span
                        className={`vs-vote-custom-control ${
                          poll.allowMultiple
                            ? "multiple"
                            : "single"
                        }`}
                        aria-hidden="true"
                      >
                        {isSelected && <Check size={14} />}
                      </span>
                    </label>
                  );
                })}
              </div>

              {!isActive && (
                <div className="vs-vote-notice warning">
                  <LockKeyhole size={19} />
                  <div>
                    <strong>Voting is closed</strong>
                    <p>
                      This poll is no longer accepting responses.
                    </p>
                  </div>
                </div>
              )}

              {success && (
                <div className="vs-vote-success">
                  <span className="vs-vote-success-icon">
                    <CheckCircle2 size={26} />
                  </span>

                  <div>
                    <strong>Vote submitted successfully!</strong>
                    <p>
                      Thanks for sharing your opinion.
                      Your response has been recorded.
                    </p>
                  </div>
                </div>
              )}

              {success && !poll.showResults && (
                <div className="vs-vote-notice">
                  <EyeOff size={18} />
                  <span>
                    The poll creator has kept results private.
                  </span>
                </div>
              )}

              {error && (
                <div
                  className="vs-vote-notice error"
                  role="alert"
                >
                  <CircleAlert size={19} />
                  <span>{error}</span>
                </div>
              )}

              {!success && (
                <button
                  type="button"
                  className="vs-vote-submit"
                  disabled={!canSubmit}
                  onClick={handleVote}
                >
                  {submitting ? (
                    "Submitting your vote..."
                  ) : !isActive ? (
                    <>
                      <LockKeyhole size={18} />
                      Voting Closed
                    </>
                  ) : (
                    <>
                      Submit My Vote
                      <ArrowRight size={19} />
                    </>
                  )}
                </button>
              )}

              {success && poll.showResults && (
                <Link
                  to={`/results/${id}`}
                  className="vs-vote-results-button"
                >
                  <BarChart3 size={19} />
                  View Live Results
                  <ArrowRight size={18} />
                </Link>
              )}

              <div className="vs-vote-card-footer">
                <span>
                  <ShieldCheck size={15} />
                  Anonymous participation
                </span>

                <span>
                  <LockKeyhole size={14} />
                  One submission per voter ID
                </span>
              </div>
            </div>
          </section>

          <aside className="vs-vote-sidebar">
            <div className="vs-vote-side-card">
              <span className="vs-vote-side-icon">
                <Users size={23} />
              </span>

              <h3>Your opinion counts</h3>

              <p>
                Every response contributes to a clearer
                picture of what the community thinks.
              </p>

              <div className="vs-vote-side-divider" />

              <div className="vs-vote-side-row">
                <span>
                  <CheckCircle2 size={16} />
                  Voting type
                </span>
                <strong>
                  {poll.allowMultiple
                    ? "Multiple choice"
                    : "Single choice"}
                </strong>
              </div>

              <div className="vs-vote-side-row">
                <span>
                  {poll.showResults ? (
                    <Eye size={16} />
                  ) : (
                    <EyeOff size={16} />
                  )}
                  Results
                </span>
                <strong>
                  {poll.showResults ? "Public" : "Private"}
                </strong>
              </div>

              <div className="vs-vote-side-row">
                <span>
                  <Clock3 size={16} />
                  Poll status
                </span>
                <strong>
                  {isActive ? "Active" : "Closed"}
                </strong>
              </div>
            </div>

            <div className="vs-vote-side-note">
              <ShieldCheck size={18} />
              <span>
                No account is required to vote.
                VoteSphere uses a browser-generated voter ID
                to help prevent duplicate submissions.
              </span>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}

export default Vote;
