
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  CircleHelp,
  Eye,
  EyeOff,
  FileQuestion,
  GripVertical,
  ListChecks,
  Plus,
  Settings2,
  Sparkles,
  Trash2,
} from "lucide-react";

import { createPoll } from "../services/api";
import "./CreatePoll.css";

function CreatePoll() {
  const navigate = useNavigate();

  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState([
    { id: 1, text: "" },
    { id: 2, text: "" },
  ]);
  const [nextId, setNextId] = useState(3);
  const [allowMultiple, setAllowMultiple] = useState(false);
  const [showResults, setShowResults] = useState(true);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const addOption = () => {
    if (options.length >= 8) return;

    setOptions((current) => [
      ...current,
      { id: nextId, text: "" },
    ]);
    setNextId((current) => current + 1);
  };

  const removeOption = (id) => {
    if (options.length <= 2) return;

    setOptions((current) =>
      current.filter((option) => option.id !== id)
    );
  };

  const updateOption = (id, value) => {
    setOptions((current) =>
      current.map((option) =>
        option.id === id
          ? { ...option, text: value }
          : option
      )
    );
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (question.trim().length < 10) {
      setError("Question must contain at least 10 characters.");
      return;
    }

    const cleanOptions = options.map((option) =>
      option.text.trim()
    );

    if (cleanOptions.some((option) => !option)) {
      setError("Please fill in all voting options.");
      return;
    }

    const normalized = cleanOptions.map((option) =>
      option.toLowerCase()
    );

    if (new Set(normalized).size !== cleanOptions.length) {
      setError("Voting options must be unique.");
      return;
    }

    setLoading(true);

    try {
      await createPoll({
        question: question.trim(),
        options: cleanOptions,
        allowMultiple,
        showResults,
      });

      navigate("/dashboard");
    } catch (err) {
      setError(err.message || "Unable to create poll.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="vs-create-page">
      <div className="vs-create-container">
        <Link to="/dashboard" className="vs-create-back">
          <ArrowLeft size={17} />
          Back to Dashboard
        </Link>

        <header className="vs-create-header">
          <div className="vs-create-eyebrow">
            <Sparkles size={15} />
            POLL BUILDER
          </div>

          <h1>
            Create a new <span>poll.</span>
          </h1>

          <p>
            Ask a question, customize the experience,
            and invite your audience to participate.
          </p>
        </header>

        <div className="vs-create-layout">
          <form
            className="vs-create-form"
            onSubmit={handleSubmit}
          >
            <section className="vs-create-panel">
              <div className="vs-panel-heading">
                <div className="vs-panel-icon purple">
                  <FileQuestion size={21} />
                </div>

                <div>
                  <h2>Poll details</h2>
                  <p>
                    Start with a clear and engaging question.
                  </p>
                </div>
              </div>

              <div className="vs-create-field">
                <div className="vs-field-heading">
                  <label htmlFor="vs-poll-question">
                    Your question
                    <span className="vs-required">*</span>
                  </label>

                  <span>{question.length}/200</span>
                </div>

                <textarea
                  id="vs-poll-question"
                  value={question}
                  onChange={(event) =>
                    setQuestion(event.target.value)
                  }
                  placeholder="e.g. Which technology should we explore next?"
                  maxLength={200}
                  rows={4}
                  required
                />

                <span className="vs-field-hint">
                  <CircleHelp size={14} />
                  A good question is specific and easy to answer.
                </span>
              </div>

              <div className="vs-create-field">
                <div className="vs-field-heading">
                  <label>
                    Answer options
                    <span className="vs-required">*</span>
                  </label>

                  <span>{options.length}/8 options</span>
                </div>

                <div className="vs-create-options">
                  {options.map((option, index) => (
                    <div
                      className="vs-create-option"
                      key={option.id}
                    >
                      <span className="vs-option-grip">
                        <GripVertical size={17} />
                      </span>

                      <span className="vs-option-index">
                        {index + 1}
                      </span>

                      <input
                        type="text"
                        value={option.text}
                        onChange={(event) =>
                          updateOption(
                            option.id,
                            event.target.value
                          )
                        }
                        placeholder={`Enter option ${index + 1}`}
                        maxLength={100}
                        aria-label={`Option ${index + 1}`}
                        required
                      />

                      <button
                        type="button"
                        className="vs-remove-option"
                        onClick={() =>
                          removeOption(option.id)
                        }
                        disabled={options.length <= 2}
                        aria-label={`Remove option ${index + 1}`}
                      >
                        <Trash2 size={17} />
                      </button>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  className="vs-add-option"
                  onClick={addOption}
                  disabled={options.length >= 8}
                >
                  <Plus size={17} />
                  Add another option
                </button>

                <span className="vs-field-hint">
                  <ListChecks size={14} />
                  Add between 2 and 8 unique answers.
                </span>
              </div>
            </section>

            <section className="vs-create-panel">
              <div className="vs-panel-heading">
                <div className="vs-panel-icon blue">
                  <Settings2 size={21} />
                </div>

                <div>
                  <h2>Poll settings</h2>
                  <p>
                    Choose how your audience participates.
                  </p>
                </div>
              </div>

              <label className="vs-create-setting">
                <span className="vs-setting-icon">
                  <ListChecks size={19} />
                </span>

                <span className="vs-setting-description">
                  <strong>Multiple selections</strong>
                  <small>
                    Allow participants to select more than one answer.
                  </small>
                </span>

                <input
                  type="checkbox"
                  className="vs-switch-input"
                  checked={allowMultiple}
                  onChange={(event) =>
                    setAllowMultiple(event.target.checked)
                  }
                />

                <span
                  className="vs-switch-track"
                  aria-hidden="true"
                >
                  <span />
                </span>
              </label>

              <label className="vs-create-setting">
                <span className="vs-setting-icon">
                  {showResults ? (
                    <Eye size={19} />
                  ) : (
                    <EyeOff size={19} />
                  )}
                </span>

                <span className="vs-setting-description">
                  <strong>Public live results</strong>
                  <small>
                    Let participants view voting results.
                  </small>
                </span>

                <input
                  type="checkbox"
                  className="vs-switch-input"
                  checked={showResults}
                  onChange={(event) =>
                    setShowResults(event.target.checked)
                  }
                />

                <span
                  className="vs-switch-track"
                  aria-hidden="true"
                >
                  <span />
                </span>
              </label>
            </section>

            {error && (
              <div className="vs-create-error" role="alert">
                <CircleHelp size={17} />
                {error}
              </div>
            )}

            <div className="vs-create-actions">
              <Link
                to="/dashboard"
                className="vs-create-cancel"
              >
                Cancel
              </Link>

              <button
                type="submit"
                className="vs-create-submit"
                disabled={loading}
              >
                {loading ? (
                  "Creating poll..."
                ) : (
                  <>
                    <Plus size={19} />
                    Create Poll
                    <ArrowRight size={17} />
                  </>
                )}
              </button>
            </div>
          </form>


        </div>
      </div>
    </main>
  );
}

export default CreatePoll;