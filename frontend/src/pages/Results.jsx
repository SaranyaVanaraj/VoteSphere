import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Clock3,
  Crown,
  Eye,
  Radio,
  RefreshCw,
  Download,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Trophy,
  Users,
  Vote,
  Wifi,
  WifiOff,
} from "lucide-react";
import {
  getPollResults,
  getOwnerPollResults,
} from "../services/api";
import "./Results.css";
function Results() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const isOwnerView = searchParams.get("owner") === "true";
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [liveConnected, setLiveConnected] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const requestRef = useRef(0);
  const apiBase = (
    import.meta.env.VITE_API_URL || "http://localhost:8080"
  ).replace(/\/$/, "");
  const wsBase = apiBase
    .replace(/^http:/, "ws:")
    .replace(/^https:/, "wss:");
  useEffect(() => {
    let active = true;
    let socket = null;
    let reconnectTimer = null;
    let attempt = 0;
    let requestNumber = 0;
    setLoading(true);
    setResults(null);
    setError("");
    setLiveConnected(false);
    setLastUpdated(null);
    async function fetchResults(initial = false) {
      const currentRequest = ++requestNumber;
      try {
        const data = isOwnerView
          ? await getOwnerPollResults(id)
          : await getPollResults(id);
        if (!active || currentRequest !== requestNumber) return;
        setResults(data);
        setLastUpdated(new Date());
        setError("");
      } catch (err) {
        if (active && currentRequest === requestNumber) {
          setError(err.message || "Unable to load results.");
        }
      } finally {
        if (initial && active) {
          setLoading(false);
        }
      }
    }
    async function connect() {
      if (!active) return;
      const currentAttempt = ++attempt;
      try {
        let wsUrl =
          `${wsBase}/api/polls/${encodeURIComponent(id)}/ws`;
        if (isOwnerView) {
          const token = sessionStorage.getItem("token");
          if (!token) {
            throw new Error("Please log in to view creator results.");
          }
          const response = await fetch(
            `${apiBase}/api/my-polls/${encodeURIComponent(id)}/ws-ticket`,
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );
          if (!response.ok) {
            throw new Error(
              "Unable to authenticate live results connection."
            );
          }
          const data = await response.json();
          if (!data.ticket) {
            throw new Error("WebSocket ticket is missing.");
          }
          wsUrl =
            `${wsBase}/api/polls/${encodeURIComponent(id)}` +
            `/owner-ws?ticket=${encodeURIComponent(data.ticket)}`;
        }
        if (!active || currentAttempt !== attempt) return;
        socket = new WebSocket(wsUrl);
        socket.onopen = () => {
          if (!active) return;
          setLiveConnected(true);
          // Recover votes received while disconnected.
          fetchResults();
        };
        socket.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            if (message.type === "vote_update") {
              fetchResults();
            }
          } catch (err) {
            console.error("WebSocket message error:", err);
          }
        };
        socket.onclose = () => {
          if (!active) return;
          setLiveConnected(false);
          reconnectTimer = setTimeout(() => {
            connect();
          }, 3000);
        };
        socket.onerror = () => {
          socket.close();
        };
      } catch (err) {
        if (!active) return;
        setLiveConnected(false);
        setError(err.message || "Live connection failed.");
        reconnectTimer = setTimeout(() => {
          connect();
        }, 3000);
      }
    }
    fetchResults(true);
    connect();
    return () => {
      active = false;
      attempt++;
      requestNumber++;
      clearTimeout(reconnectTimer);
      if (socket) socket.close();
    };
  }, [id, isOwnerView, apiBase, wsBase]);
  const handleManualRefresh = async () => {
    const currentRequest = ++requestRef.current;
    setRefreshing(true);
    try {
      const data = isOwnerView
        ? await getOwnerPollResults(id)
        : await getPollResults(id);
      if (currentRequest !== requestRef.current) return;
      setResults(data);
      setLastUpdated(new Date());
      setError("");
    } catch (err) {
      setError(err.message || "Unable to refresh results.");
    } finally {
      setRefreshing(false);
    }
  };
  const downloadCSV = () => {
    if (!isOwnerView || !results) return;
    const csvCell = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`;
    const rows = [
      ["Poll Question", results.question],
      ["Total Participants", Number(results.totalVoters) || 0],
      ["Total Selections", analytics.totalSelections],
      [],
      ["Option", "Votes", "Percentage"],
      ...analytics.options.map((option) => {
        const votes = Number(option.votes) || 0;
        const percentage = analytics.totalSelections
          ? ((votes / analytics.totalSelections) * 100).toFixed(1) + "%"
          : "0.0%";
        return [option.text, votes, percentage];
      }),
    ];
    const csv = "\uFEFF" + rows.map((row) => row.map(csvCell).join(",")).join("\r\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `votesphere-results-${id}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  const backPath = isOwnerView
    ? "/dashboard"
    : `/poll/${id}`;
  const backText = isOwnerView
    ? "Back to Dashboard"
    : "Back to Poll";
  const analytics = useMemo(() => {
    const options = results?.options || [];
    const totalSelections = options.reduce(
      (sum, option) => sum + (Number(option.votes) || 0),
      0
    );
    const sorted = [...options].sort(
      (a, b) =>
        (Number(b.votes) || 0) -
        (Number(a.votes) || 0)
    );
    return {
      options,
      totalSelections,
      leader: totalSelections > 0 ? sorted[0] : null,
    };
  }, [results]);
  if (loading) {
    return (
      <main className="vs-results-page">
        <div className="vs-results-state">
          <div className="vs-results-spinner" />
          <h2>Loading poll insights</h2>
          <p>Preparing your results dashboard...</p>
        </div>
      </main>
    );
  }
  if (!results) {
    return (
      <main className="vs-results-page">
        <div className="vs-results-state">
          <div className="vs-results-state-icon">
            <BarChart3 size={30} />
          </div>
          <h2>Results unavailable</h2>
          <p>{error || "No results available."}</p>
          <Link to={backPath} className="vs-results-back-button">
            <ArrowLeft size={17} />
            {backText}
          </Link>
        </div>
      </main>
    );
  }
  const totalVoters = Number(results.totalVoters) || 0;
  const { options, totalSelections, leader } = analytics;
  return (
    <main className="vs-results-page">
      <div className="vs-results-container">
        <Link to={backPath} className="vs-results-back">
          <ArrowLeft size={17} />
          {backText}
        </Link>
        <header className="vs-results-heading">
          <div>
            <div className="vs-results-eyebrow">
              <Sparkles size={15} />
              POLL ANALYTICS
            </div>
            <h1>
              Live <span>results.</span>
            </h1>
            <p>
              Explore the votes and see how your audience
              is responding.
            </p>
          </div>
          <div className="vs-results-header-actions">
            <span
              className={`vs-results-live-badge ${
                liveConnected ? "connected" : "disconnected"
              }`}
            >
              {liveConnected ? (
                <Wifi size={15} />
              ) : (
                <WifiOff size={15} />
              )}
              {liveConnected
                ? "Live Connected"
                : "Connecting to live updates..."}
            </span>
            {isOwnerView && (
              <button
                type="button"
                className="vs-results-refresh"
                onClick={downloadCSV}
                title="Export current poll results as CSV"
              >
                <Download size={17} />
                Export CSV
              </button>
            )}
            <button
              type="button"
              className="vs-results-refresh"
              onClick={handleManualRefresh}
              disabled={refreshing}
            >
              <RefreshCw
                size={17}
                className={refreshing ? "spinning" : ""}
              />
              Refresh
            </button>
          </div>
        </header>
        {error && (
          <div className="vs-results-error" role="alert">
            {error}
          </div>
        )}
        <section className="vs-results-question-card">
          <div className="vs-results-question-top">
            <span className="vs-results-question-label">
              <Vote size={15} />
              POLL QUESTION
            </span>
            {isOwnerView && (
              <span className="vs-results-owner-badge">
                <Crown size={14} />
                Creator View
              </span>
            )}
          </div>
          <h2>{results.question}</h2>
          <div className="vs-results-question-meta">
            <span>
              <BarChart3 size={15} />
              {options.length} options
            </span>
            <span>
              <Users size={15} />
              {totalVoters} participants
            </span>
            <span>
              <Radio size={15} />
              {isOwnerView
                ? "Creator analytics"
                : "Public results"}
            </span>
          </div>
        </section>
        <section className="vs-results-stats">
          <article className="vs-results-stat">
            <span className="vs-results-stat-icon purple">
              <Users size={23} />
            </span>
            <span className="vs-results-stat-label">
              Total Participants
            </span>
            <strong>{totalVoters.toLocaleString()}</strong>
            <small>Unique voter submissions</small>
          </article>
          <article className="vs-results-stat">
            <span className="vs-results-stat-icon blue">
              <CheckCircle2 size={23} />
            </span>
            <span className="vs-results-stat-label">
              Total Selections
            </span>
            <strong>{totalSelections.toLocaleString()}</strong>
            <small>Answers selected across all votes</small>
          </article>
          <article className="vs-results-stat">
            <span className="vs-results-stat-icon green">
              <TrendingUp size={23} />
            </span>
            <span className="vs-results-stat-label">
              Leading Option
            </span>
            <strong className="vs-results-leading">
              {leader ? leader.text : "No votes yet"}
            </strong>
            <small>
              {leader
                ? `${Number(leader.votes) || 0} selections`
                : "Waiting for responses"}
            </small>
          </article>
        </section>
        <section className="vs-results-chart-card">
          <div className="vs-results-chart-heading">
            <div>
              <span className="vs-results-chart-kicker">
                <Activity size={15} />
                VOTE DISTRIBUTION
              </span>
              <h2>Response breakdown</h2>
              <p>Visual comparison of all voting options.</p>
            </div>
            <span className="vs-results-chart-total">
              <BarChart3 size={17} />
              {totalSelections} selections
            </span>
          </div>
          <div className="vs-results-bars">
            {options.map((option, index) => {
              const votes = Number(option.votes) || 0;
              const percentage =
                totalSelections > 0
                  ? (votes / totalSelections) * 100
                  : 0;
              const isLeader =
                leader &&
                votes > 0 &&
                votes === Number(leader.votes);
              return (
                <div
                  className="vs-results-bar-item"
                  key={option.id ?? index}
                >
                  <div className="vs-results-bar-heading">
                    <div className="vs-results-bar-name">
                      <span className="vs-results-bar-index">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <strong>{option.text}</strong>
                      {isLeader && (
                        <span className="vs-results-leader-tag">
                          <Trophy size={12} />
                          Leading
                        </span>
                      )}
                    </div>
                    <div className="vs-results-bar-numbers">
                      <strong>
                        {percentage.toFixed(1)}%
                      </strong>
                      <span>
                        {votes} {votes === 1 ? "vote" : "votes"}
                      </span>
                    </div>
                  </div>
                  <div
                    className="vs-results-progress"
                    role="progressbar"
                    aria-valuenow={percentage}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`${option.text} percentage`}
                  >
                    <div
                      className={`vs-results-progress-fill ${
                        isLeader ? "leading" : ""
                      }`}
                      style={{
                        width: `${Math.min(
                          100,
                          Math.max(0, percentage)
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="vs-results-chart-footer">
            <span>
              <ShieldCheck size={15} />
              Results fetched from VoteSphere
            </span>
            <span>
              <Clock3 size={15} />
              {lastUpdated
                ? `Updated ${lastUpdated.toLocaleTimeString()}`
                : "Waiting for updates"}
            </span>
          </div>
        </section>
        <div className="vs-results-bottom">
          <div className="vs-results-bottom-info">
            <span className="vs-results-bottom-icon">
              <Eye size={19} />
            </span>
            <div>
              <strong>
                {isOwnerView
                  ? "Creator insights"
                  : "Community results"}
              </strong>
              <p>
                Results update automatically whenever
                a new vote arrives.
              </p>
            </div>
          </div>
          <Link
            to={backPath}
            className="vs-results-bottom-link"
          >
            {backText}
            <ArrowRight size={17} />
          </Link>
        </div>
      </div>
    </main>
  );
}
export default Results;

