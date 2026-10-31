
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Activity,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  Check,
  ChevronDown,
  Clock3,
  Copy,
  Filter,
  LayoutDashboard,
  Lock,
  Plus,
  QrCode,
  Radio,
  RotateCcw,
  Search,
  Sparkles,
  Users,
  Vote,
} from "lucide-react";

import {
  getMyPolls,
  updatePollStatus,
} from "../services/api";
import PollQRCode from "../components/PollQRCode";
import "./Dashboard.css";

function Dashboard() {
  const [polls, setPolls] = useState([]);
  const [totalVotes, setTotalVotes] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [copied, setCopied] = useState(null);
  const [updatingPoll, setUpdatingPoll] = useState(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [qrPollId, setQrPollId] = useState(null);
  useEffect(() => {
    let active = true;

    async function loadPolls() {
      try {
        const data = await getMyPolls();

        if (active) {
          setPolls(data.polls || []);
          setTotalVotes(data.totalVotes ?? 0);
          setError("");
        }
      } catch (err) {
        if (active) {
          setError(err.message || "Failed to load polls.");
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadPolls();

    return () => {
      active = false;
    };
  }, []);

  const activePolls = polls.filter(
    (poll) => poll.status === "Active"
  ).length;

  const closedPolls = polls.length - activePolls;

  const filteredPolls = useMemo(() => {
    return polls.filter((poll) => {
      const matchesSearch = poll.question
        .toLowerCase()
        .includes(search.trim().toLowerCase());

      const matchesFilter =
        filter === "all" ||
        (filter === "active" && poll.status === "Active") ||
        (filter === "closed" && poll.status !== "Active");

      return matchesSearch && matchesFilter;
    });
  }, [polls, search, filter]);

  const copyLink = async (id) => {
    const url = `${window.location.origin}/poll/${id}`;

    try {
      await navigator.clipboard.writeText(url);
      setCopied(id);
    } catch {
      setActionError("Unable to copy the poll link.");
    }
  };

  const handleStatusChange = async (poll) => {
    const newStatus =
      poll.status === "Active" ? "Closed" : "Active";

    const action =
      newStatus === "Closed" ? "close" : "reopen";

    const confirmed = window.confirm(
      `Are you sure you want to ${action} this poll?`
    );

    if (!confirmed) return;

    setUpdatingPoll(poll.id);
    setActionError("");

    try {
      await updatePollStatus(poll.id, newStatus);

      setPolls((current) =>
        current.map((item) =>
          item.id === poll.id
            ? { ...item, status: newStatus }
            : item
        )
      );
    } catch (err) {
      setActionError(
        err.message || "Unable to update poll status."
      );
    } finally {
      setUpdatingPoll(null);
    }
  };

  const stats = [
    {
      label: "Total Polls",
      value: polls.length,
      icon: Vote,
      className: "purple",
      description: "Polls you've created",
    },
    {
      label: "Total Votes",
      value: totalVotes,
      icon: Users,
      className: "blue",
      description: "Audience responses",
    },
    {
      label: "Active Polls",
      value: activePolls,
      icon: Activity,
      className: "green",
      description: "Currently accepting votes",
    },
  ];

  return (
    <main className="vs-dashboard">
      <div className="vs-dashboard-container">
        <div className="vs-dashboard-topline">
          <span>
            <LayoutDashboard size={15} />
            WORKSPACE / OVERVIEW
          </span>
          <span className="vs-dashboard-date">
            <Radio size={14} />
            Poll management
          </span>
        </div>

        <header className="vs-dashboard-heading">
          <div>
            <div className="vs-dashboard-eyebrow">
              <Sparkles size={15} />
              YOUR POLLING WORKSPACE
            </div>

            <h1>
              Dashboard<span className="vs-heading-dot">.</span>
            </h1>

            <p>
              Your polls, participation, and results —
              all in one place.
            </p>
          </div>

          <Link to="/create" className="vs-dashboard-create">
            <Plus size={19} />
            Create New Poll
            <ArrowUpRight size={17} />
          </Link>
        </header>

        <section className="vs-dashboard-stats">
          {stats.map((stat) => {
            const Icon = stat.icon;

            return (
              <article
                className="vs-dashboard-stat"
                key={stat.label}
              >
                <div className="vs-stat-top">
                  <span className={`vs-stat-symbol ${stat.className}`}>
                    <Icon size={22} />
                  </span>
                  <span className="vs-stat-corner">
                    <ArrowUpRight size={17} />
                  </span>
                </div>

                <p className="vs-stat-label">{stat.label}</p>
                <strong className="vs-stat-number">
                  {loading ? "—" : stat.value.toLocaleString()}
                </strong>
                <span className="vs-stat-description">
                  {stat.description}
                </span>
              </article>
            );
          })}
        </section>

        <section className="vs-dashboard-polls">
          <div className="vs-polls-heading">
            <div>
              <div className="vs-polls-title-row">
                <h2>Your Polls</h2>
                <span className="vs-polls-count">
                  {polls.length}
                </span>
              </div>
              <p>Manage and monitor all your polls.</p>
            </div>

            <div className="vs-polls-toolbar">
              <label className="vs-polls-search">
                <Search size={18} />
                <input
                  type="search"
                  placeholder="Search polls..."
                  value={search}
                  onChange={(event) =>
                    setSearch(event.target.value)
                  }
                  aria-label="Search polls"
                />
              </label>

              <label className="vs-polls-filter">
                <Filter size={16} />
                <select
                  value={filter}
                  onChange={(event) =>
                    setFilter(event.target.value)
                  }
                  aria-label="Filter polls"
                >
                  <option value="all">All Polls</option>
                  <option value="active">Active</option>
                  <option value="closed">Closed</option>
                </select>
                <ChevronDown size={15} />
              </label>
            </div>
          </div>

          {error && (
            <p className="vs-dashboard-error" role="alert">
              {error}
            </p>
          )}

          {actionError && (
            <p className="vs-dashboard-error" role="alert">
              {actionError}
            </p>
          )}

          {loading && (
            <div className="vs-dashboard-state">
              <div className="vs-loading-spinner" />
              <p>Loading your workspace...</p>
            </div>
          )}

          {!loading && !error && polls.length === 0 && (
            <div className="vs-dashboard-empty">
              <span className="vs-empty-icon">
                <BarChart3 size={29} />
              </span>
              <h3>Your first poll starts here</h3>
              <p>
                Create a poll, share the link, and start
                collecting responses.
              </p>
              <Link to="/create">
                Create a Poll
                <ArrowRight size={17} />
              </Link>
            </div>
          )}

          {!loading &&
            !error &&
            polls.length > 0 &&
            filteredPolls.length === 0 && (
              <div className="vs-dashboard-empty">
                <Search size={27} />
                <h3>No matching polls</h3>
                <p>
                  Try another search term or change your filter.
                </p>
              </div>
            )}

          {!loading && !error && filteredPolls.length > 0 && (
            <div className="vs-dashboard-poll-list">
              {filteredPolls.map((poll) => {
                const isActive = poll.status === "Active";
                const isUpdating = updatingPoll === poll.id;

                return (
                  <article
                    className="vs-dashboard-poll-card"
                    key={poll.id}
                  >
                    <div className="vs-poll-card-main">
                      <div className="vs-poll-card-topline">
                        <span
                          className={`vs-poll-status ${
                            isActive ? "active" : "closed"
                          }`}
                        >
                          <span />
                          {isActive ? "Active" : "Closed"}
                        </span>

                        <span className="vs-poll-card-meta">
                          <Users size={14} />
                          {poll.totalVotes ?? 0} votes
                        </span>

                        <span className="vs-poll-card-meta">
                          <Clock3 size={14} />
                          {poll.options?.length ?? 0} options
                        </span>
                      </div>

                      <h3>{poll.question}</h3>

                      <p>
                        {isActive
                          ? "This poll is accepting responses."
                          : "Voting is currently closed."}
                      </p>
                    </div>

                    <div className="vs-poll-card-actions">
                      <button
                        type="button"
                        className="vs-poll-copy"
                        onClick={() => copyLink(poll.id)}
                        title={
                          copied === poll.id
                            ? "Link copied"
                            : "Copy voting link"
                        }
                        aria-label="Copy voting link"
                      >
                        {copied === poll.id ? (
                          <Check size={17} />
                        ) : (
                          <Copy size={17} />
                        )}
                      </button>

                      <button
                        type="button"
                        className="vs-poll-copy"
                        onClick={() => setQrPollId(poll.id)}
                        title="Show poll QR code"
                        aria-label={`Show QR code for ${poll.question}`}
                      >
                        <QrCode size={18} />
                      </button>

                      <button
                        type="button"
                        className="vs-poll-status-button"
                        disabled={isUpdating}
                        onClick={() =>
                          handleStatusChange(poll)
                        }
                      >
                        {isActive ? (
                          <Lock size={16} />
                        ) : (
                          <RotateCcw size={16} />
                        )}

                        {isUpdating
                          ? "Updating..."
                          : isActive
                          ? "Close Poll"
                          : "Reopen Poll"}
                      </button>

                      <Link
                        to={`/results/${poll.id}?owner=true`}
                        className="vs-poll-results-link"
                      >
                        View Results
                        <ArrowUpRight size={17} />
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          {!loading && !error && polls.length > 0 && (
            <div className="vs-polls-footer">
              <span>
                Showing {filteredPolls.length} of {polls.length} polls
              </span>
              <span>
                {activePolls} active · {closedPolls} closed
              </span>
            </div>
          )}
        </section>

        <div className="vs-dashboard-bottom-note">
          <ShieldCheckIcon />
          <span>
            Polls and vote totals are loaded from your
            VoteSphere backend.
          </span>
        </div>
      </div>
      {qrPollId && (
        <PollQRCode
          pollId={qrPollId}
          onClose={() => setQrPollId(null)}
        />
      )}
    </main>
  );
}

function ShieldCheckIcon() {
  return <Check size={15} />;
}

export default Dashboard;