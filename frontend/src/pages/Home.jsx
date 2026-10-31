
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleDot,
  Globe2,
  Link2,
  LockKeyhole,
  Radio,
  ShieldCheck,
  Sparkles,
  Users,
  Zap,
} from "lucide-react";

import "./Home.css";

const demoOptions = [
  { id: "react", label: "React.js", votes: 68 },
  { id: "vue", label: "Vue.js", votes: 24 },
  { id: "angular", label: "Angular", votes: 8 },
];

const features = [
  {
    icon: Zap,
    title: "Real-time updates",
    description:
      "See voting activity and results update live, without refreshing the page.",
    className: "purple",
  },
  {
    icon: Link2,
    title: "Effortless sharing",
    description:
      "Create a poll and share its unique link with your audience in seconds.",
    className: "blue",
  },
  {
    icon: BarChart3,
    title: "Clear analytics",
    description:
      "Explore participation counts, percentages, and visual voting results.",
    className: "pink",
  },
  {
    icon: ShieldCheck,
    title: "Poll controls",
    description:
      "Manage poll status, multiple-choice voting, and result visibility.",
    className: "green",
  },
];

export default function Home() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState("react");
  const [demoVoted, setDemoVoted] = useState(false);
  const [joinLink, setJoinLink] = useState("");
  const [joinError, setJoinError] = useState("");

  const isLoggedIn = Boolean(
    sessionStorage.getItem("token")
  );

  const createPath = isLoggedIn ? "/create" : "/signup";

  function handleDemoVote() {
    if (demoVoted) return;
    setDemoVoted(true);
  }

  function handleJoin(event) {
    event.preventDefault();

    const input = joinLink.trim();
    let pollId = "";

    try {
      const url = new URL(input, window.location.origin);
      const match = url.pathname.match(
        /^\/poll\/([a-fA-F0-9]{24})\/?$/
      );

      if (match) pollId = match[1];
    } catch {
      // Invalid input will be handled below.
    }

    if (!pollId && /^[a-fA-F0-9]{24}$/.test(input)) {
      pollId = input;
    }

    if (!pollId) {
      setJoinError("Enter a valid VoteSphere poll link or poll ID.");
      return;
    }

    setJoinError("");
    navigate(`/poll/${pollId}`);
  }

  return (
    <main className="vs-home">
      <section className="vs-hero">
        <div className="vs-hero-glow vs-glow-one" />
        <div className="vs-hero-glow vs-glow-two" />

        <div className="vs-hero-inner">
          <div className="vs-hero-copy">
            <div className="vs-eyebrow">
              <span className="vs-eyebrow-dot" />
              <Sparkles size={15} />
              The smarter way to engage
            </div>

            <h1>
              Make every
              <br />
              voice <span>count.</span>
            </h1>

            <p className="vs-hero-description">
              Turn questions into conversations.
              Create beautiful polls, share instantly,
              and watch your audience respond in real time.
            </p>

            <div className="vs-hero-cta">
              <Link to={createPath} className="vs-hero-primary">
                Create your first poll
                <ArrowRight size={19} />
              </Link>
            </div>

            <div className="vs-hero-trust">
              <span><CheckCircle2 size={16} /> Easy to create</span>
              <span><CheckCircle2 size={16} /> Live updates</span>
              <span><CheckCircle2 size={16} /> Shareable links</span>
            </div>
          </div>

          <div className="vs-preview-wrap" id="vs-demo">
            <div className="vs-floating-pill vs-floating-top">
              <span className="vs-pulse-dot" />
              Live poll preview
            </div>

            <div className="vs-preview-card">
              <div className="vs-preview-header">
                <div className="vs-preview-brand">
                  <span className="vs-preview-icon">
                    <BarChart3 size={19} />
                  </span>
                  <div>
                    <strong>VoteSphere</strong>
                    <small>Interactive poll</small>
                  </div>
                </div>

                <span className="vs-preview-live">
                  <Radio size={13} />
                  LIVE
                </span>
              </div>

              <div className="vs-preview-body">
                <div className="vs-preview-label">
                  <CircleDot size={14} />
                  COMMUNITY POLL
                </div>

                <h2>
                  What's your favorite frontend framework?
                </h2>

                <p>Choose one option below.</p>

                <div className="vs-demo-options">
                  {demoOptions.map((option) => {
                    const active = selected === option.id;
                    const votes =
                      option.votes +
                      (demoVoted && active ? 1 : 0);
                    const total = demoVoted ? 101 : 100;
                    const percentage = Math.round(
                      (votes / total) * 100
                    );

                    return (
                      <button
                        key={option.id}
                        type="button"
                        className={`vs-demo-option ${
                          active ? "selected" : ""
                        }`}
                        onClick={() => {
                          if (!demoVoted) setSelected(option.id);
                        }}
                        disabled={demoVoted}
                      >
                        <span className="vs-demo-option-top">
                          <span className="vs-demo-option-name">
                            <span className="vs-demo-radio">
                              {active && <span />}
                            </span>
                            {option.label}
                          </span>

                          {demoVoted && (
                            <strong>{percentage}%</strong>
                          )}
                        </span>

                        {demoVoted && (
                          <span className="vs-demo-track">
                            <span
                              style={{
                                width: `${percentage}%`,
                              }}
                            />
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                <button
                  type="button"
                  className="vs-demo-submit"
                  onClick={handleDemoVote}
                  disabled={demoVoted}
                >
                  {demoVoted ? (
                    <>
                      <Check size={18} />
                      Vote recorded in preview
                    </>
                  ) : (
                    <>
                      Submit demo vote
                      <ArrowRight size={18} />
                    </>
                  )}
                </button>

                <div className="vs-preview-footer">
                  <span>
                    <Users size={15} />
                    {demoVoted ? 101 : 100} sample votes
                  </span>
                  <span>
                    <LockKeyhole size={14} />
                    Demo only
                  </span>
                </div>
              </div>
            </div>

            <div className="vs-floating-pill vs-floating-bottom">
              <span className="vs-floating-check">
                <Check size={14} />
              </span>
              Beautiful polls. Better engagement.
            </div>
          </div>
        </div>
      </section>

      <section className="vs-benefits">
        <div className="vs-benefit">
          <Zap size={19} />
          <span>Real-time voting</span>
        </div>
        <div className="vs-benefit">
          <Globe2 size={19} />
          <span>Share from anywhere</span>
        </div>
        <div className="vs-benefit">
          <ShieldCheck size={19} />
          <span>Flexible poll controls</span>
        </div>
        <div className="vs-benefit">
          <BarChart3 size={19} />
          <span>Instant visual insights</span>
        </div>
      </section>

      <section className="vs-features-section">
        <div className="vs-section-heading">
          <span className="vs-section-tag">WHY VOTESPHERE</span>
          <h2>
            Everything you need.
            <br />
            <span>Nothing you don't.</span>
          </h2>
          <p>
            From quick decisions to audience engagement,
            VoteSphere makes polling simple and interactive.
          </p>
        </div>

        <div className="vs-features-grid">
          {features.map((feature) => {
            const Icon = feature.icon;

            return (
              <article
                className="vs-feature-card"
                key={feature.title}
              >
                <div
                  className={`vs-feature-icon ${feature.className}`}
                >
                  <Icon size={23} />
                </div>

                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
                <span className="vs-feature-decoration">
                  <ArrowUpRight size={19} />
                </span>
              </article>
            );
          })}
        </div>
      </section>

      <section className="vs-join-section">
        <div className="vs-join-copy">
          <span className="vs-section-tag">JOIN THE CONVERSATION</span>
          <h2>Have a poll invitation?</h2>
          <p>
            Paste your VoteSphere poll link or poll ID to
            participate. No account required.
          </p>
        </div>

        <form className="vs-join-form" onSubmit={handleJoin}>
          <div className="vs-join-input-wrap">
            <Link2 size={19} />
            <input
              type="text"
              value={joinLink}
              onChange={(event) => {
                setJoinLink(event.target.value);
                setJoinError("");
              }}
              placeholder="Paste poll link or ID..."
              aria-label="Poll link or ID"
            />
          </div>

          <button type="submit">
            Join Poll
            <ArrowRight size={18} />
          </button>

          {joinError && (
            <p className="vs-join-error" role="alert">
              {joinError}
            </p>
          )}
        </form>
      </section>

      <section className="vs-bottom-cta">
        <div className="vs-bottom-glow" />
        <div className="vs-bottom-content">
          <span><Sparkles size={17} /> READY TO GET STARTED?</span>
          <h2>Great decisions start with a question.</h2>
          <p>
            Create your poll, invite your audience,
            and see what everyone thinks.
          </p>
          <Link to={createPath}>
            Start creating
            <ArrowRight size={19} />
          </Link>
        </div>
      </section>

      <footer className="vs-home-footer">
        <div className="vs-footer-brand">
          <BarChart3 size={20} />
          <strong>VoteSphere</strong>
        </div>
        <span>
          © {new Date().getFullYear()} VoteSphere.
          Every voice matters.
        </span>
      </footer>
    </main>
  );
}
