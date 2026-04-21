import { useState } from "react";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";


const AGE_OPTIONS = [
  "Any",
  "Newborn (0 days)",
  "Neonate (0–27 days)",
  "Infant (0–11 months)",
  "Pediatric (0–17 years)",
  "Child (0–11 years)",
  "Adolescent (12–17 years)",
  "Adult (18–64 years)",
  "Maternity (9–64 years)",
  "Geriatric (65+ years)",
  "Context Dependent",
];

const GENDER_OPTIONS = ["Any", "Male", "Female", "Context Dependent"];

const ConfidenceBadge = ({ score }) => {
  const pct = Math.round(score * 100);
  let bg, color, label;
  if (pct >= 80) {
    bg = "#EAF3DE";
    color = "#3B6D11";
    label = "High";
  } else if (pct >= 60) {
    bg = "#FAEEDA";
    color = "#854F0B";
    label = "Medium";
  } else {
    bg = "#FCEBEB";
    color = "#A32D2D";
    label = "Low";
  }
  return (
    <span
      style={{
        display: "inline-block",
        padding: "2px 8px",
        borderRadius: 6,
        fontSize: 11,
        fontWeight: 500,
        background: bg,
        color,
      }}
    >
      {label} {pct}%
    </span>
  );
};

const AnomalyBanner = ({ anomaly, lowConf }) => {
  if (!anomaly.is_anomaly && !lowConf) return null;
  const isHard = anomaly.is_anomaly;
  const bg = isHard ? "#FCEBEB" : "#FAEEDA";
  const border = isHard ? "#F09595" : "#FAC775";
  const textColor = isHard ? "#A32D2D" : "#854F0B";
  const icon = isHard ? "⚠" : "ℹ";
  const title = isHard ? "Anomaly detected" : "Low confidence";
  const msg = isHard
    ? anomaly.reason
    : "The top results have moderate similarity — review carefully before using.";

  return (
    <div
      style={{
        background: bg,
        border: `1px solid ${border}`,
        borderRadius: 8,
        padding: "10px 14px",
        marginTop: 16,
        display: "flex",
        gap: 10,
        alignItems: "flex-start",
      }}
    >
      <span style={{ fontSize: 16, lineHeight: 1.4, color: textColor }}>
        {icon}
      </span>
      <div>
        <p
          style={{ margin: 0, fontWeight: 500, fontSize: 13, color: textColor }}
        >
          {title}
        </p>
        <p
          style={{
            margin: "4px 0 0",
            fontSize: 12,
            color: textColor,
            lineHeight: 1.5,
          }}
        >
          {msg}
        </p>
      </div>
    </div>
  );
};

const ResultCard = ({ result, rank }) => (
  <div
    style={{
      background: "var(--color-background-primary)",
      border: "0.5px solid var(--color-border-tertiary)",
      borderRadius: 10,
      padding: "12px 16px",
      display: "flex",
      gap: 14,
      alignItems: "flex-start",
    }}
  >
    <div
      style={{
        minWidth: 28,
        height: 28,
        borderRadius: "50%",
        background: "var(--color-background-secondary)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 12,
        fontWeight: 500,
        color: "var(--color-text-secondary)",
        flexShrink: 0,
      }}
    >
      {rank}
    </div>
    <div style={{ flex: 1, minWidth: 0 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 8,
          flexWrap: "wrap",
        }}
      >
        <div>
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 13,
              fontWeight: 500,
              color: "#185FA5",
              background: "#E6F1FB",
              padding: "2px 7px",
              borderRadius: 5,
            }}
          >
            {result.code}
          </span>
        </div>
        <ConfidenceBadge score={result.similarity_score} />
      </div>
      <p
        style={{
          margin: "8px 0 6px",
          fontSize: 14,
          color: "var(--color-text-primary)",
          lineHeight: 1.4,
        }}
      >
        {result.short_description}
      </p>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <MetaPill label="Gender" value={result.gender} />
        <MetaPill label="Age" value={result.age} />
      </div>
      <div style={{ marginTop: 8 }}>
        <ScoreBar score={result.similarity_score} />
      </div>
    </div>
  </div>
);

const MetaPill = ({ label, value }) => (
  <span style={{ fontSize: 11, color: "var(--color-text-secondary)" }}>
    <span style={{ fontWeight: 500 }}>{label}:</span>{" "}
    <span style={{ color: "var(--color-text-primary)" }}>{value}</span>
  </span>
);

const ScoreBar = ({ score }) => {
  const pct = Math.round(score * 100);
  const fill = pct >= 80 ? "#639922" : pct >= 60 ? "#BA7517" : "#E24B4A";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div
        style={{
          flex: 1,
          height: 4,
          background: "var(--color-background-secondary)",
          borderRadius: 2,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${pct}%`,
            height: "100%",
            background: fill,
            borderRadius: 2,
            transition: "width 0.4s ease",
          }}
        />
      </div>
      <span
        style={{
          fontSize: 11,
          color: "var(--color-text-secondary)",
          minWidth: 30,
        }}
      >
        {pct}%
      </span>
    </div>
  );
};

export default function App() {
  const [description, setDescription] = useState("");
  const [gender, setGender] = useState("Any");
  const [age, setAge] = useState("Any");
  const [topK, setTopK] = useState(5);
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState(null);
  const [error, setError] = useState(null);

  const handleSearch = async () => {
    if (!description.trim()) return;
    setLoading(true);
    setError(null);
    setResponse(null);
    try {
      const res = await fetch(`${API_BASE}/search`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description, gender, age, top_k: topK }),
      });
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const data = await res.json();
      setResponse(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleSearch();
  };

  return (
    <div
      style={{
        maxWidth: 760,
        margin: "0 auto",
        padding: "2rem 1rem",
        fontFamily: "var(--font-sans)",
      }}
    >
      <h2
        // style={{ sr-only: true }}
        className="sr-only"
      >
        ICD-10 Semantic Code Search
      </h2>

      {/* Header */}
      <div style={{ marginBottom: "1.5rem" }}>
        <p
          style={{
            fontSize: 22,
            fontWeight: 500,
            margin: "0 0 4px",
            color: "var(--color-text-primary)",
          }}
        >
          ICD-10 code search
        </p>
        <p
          style={{
            fontSize: 14,
            color: "var(--color-text-secondary)",
            margin: 0,
          }}
        >
          Semantic search across 73,000+ ICD-10 FY2025 codes with gender and age
          validation.
        </p>
      </div>

      {/* Form card */}
      <div
        style={{
          background: "var(--color-background-primary)",
          border: "0.5px solid var(--color-border-tertiary)",
          borderRadius: 12,
          padding: "1.25rem",
          marginBottom: "1.25rem",
        }}
      >
        {/* Description */}
        <div style={{ marginBottom: 16 }}>
          <label
            style={{
              display: "block",
              fontSize: 13,
              fontWeight: 500,
              color: "var(--color-text-secondary)",
              marginBottom: 6,
            }}
          >
            Clinical description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="e.g. chest pain, shortness of breath on exertion, suspected angina"
            rows={3}
            style={{
              width: "100%",
              boxSizing: "border-box",
              resize: "vertical",
              padding: "8px 12px",
              fontSize: 14,
              lineHeight: 1.5,
              borderRadius: 8,
              border: "0.5px solid var(--color-border-secondary)",
              background: "var(--color-background-secondary)",
              color: "var(--color-text-primary)",
            }}
          />
        </div>

        {/* Gender + Age row */}
        <div
          style={{
            display: "flex",
            gap: 16,
            flexWrap: "wrap",
            marginBottom: 16,
          }}
        >
          <div style={{ flex: "1 1 160px" }}>
            <label
              style={{
                display: "block",
                fontSize: 13,
                fontWeight: 500,
                color: "var(--color-text-secondary)",
                marginBottom: 6,
              }}
            >
              Patient gender
            </label>
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              style={{
                width: "100%",
                padding: "7px 10px",
                fontSize: 14,
                borderRadius: 8,
                border: "0.5px solid var(--color-border-secondary)",
                background: "var(--color-background-secondary)",
                color: "var(--color-text-primary)",
              }}
            >
              {GENDER_OPTIONS.map((g) => (
                <option key={g}>{g}</option>
              ))}
            </select>
          </div>

          <div style={{ flex: "2 1 220px" }}>
            <label
              style={{
                display: "block",
                fontSize: 13,
                fontWeight: 500,
                color: "var(--color-text-secondary)",
                marginBottom: 6,
              }}
            >
              Patient age group
            </label>
            <select
              value={age}
              onChange={(e) => setAge(e.target.value)}
              style={{
                width: "100%",
                padding: "7px 10px",
                fontSize: 14,
                borderRadius: 8,
                border: "0.5px solid var(--color-border-secondary)",
                background: "var(--color-background-secondary)",
                color: "var(--color-text-primary)",
              }}
            >
              {AGE_OPTIONS.map((a) => (
                <option key={a}>{a}</option>
              ))}
            </select>
          </div>

          <div style={{ flex: "0 1 120px" }}>
            <label
              style={{
                display: "block",
                fontSize: 13,
                fontWeight: 500,
                color: "var(--color-text-secondary)",
                marginBottom: 6,
              }}
            >
              Results
            </label>
            <select
              value={topK}
              onChange={(e) => setTopK(Number(e.target.value))}
              style={{
                width: "100%",
                padding: "7px 10px",
                fontSize: 14,
                borderRadius: 8,
                border: "0.5px solid var(--color-border-secondary)",
                background: "var(--color-background-secondary)",
                color: "var(--color-text-primary)",
              }}
            >
              {[3, 5, 10, 15, 20].map((n) => (
                <option key={n} value={n}>
                  Top {n}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Submit */}
        <button
          onClick={handleSearch}
          disabled={loading || !description.trim()}
          style={{
            padding: "8px 20px",
            fontSize: 14,
            fontWeight: 500,
            borderRadius: 8,
            border: "0.5px solid var(--color-border-secondary)",
            background: loading
              ? "var(--color-background-secondary)"
              : "var(--color-background-primary)",
            color: loading
              ? "var(--color-text-secondary)"
              : "var(--color-text-primary)",
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "Searching…" : "Search codes ↗"}
        </button>

        {/* Tip */}
        <p
          style={{
            fontSize: 12,
            color: "var(--color-text-tertiary)",
            margin: "10px 0 0",
          }}
        >
          Tip: ⌘ + Enter to search. Gender and age are used to refine semantic
          matching.
        </p>
      </div>

      {/* Error */}
      {error && (
        <div
          style={{
            background: "#FCEBEB",
            border: "0.5px solid #F09595",
            borderRadius: 8,
            padding: "10px 14px",
            fontSize: 13,
            color: "#A32D2D",
            marginBottom: 16,
          }}
        >
          {error} — make sure the backend is running at {API_BASE}.
        </div>
      )}

      {/* Results */}
      {response && (
        <div>
          {/* Query string */}
          <div style={{ marginBottom: 12 }}>
            <p
              style={{
                fontSize: 12,
                color: "var(--color-text-tertiary)",
                margin: "0 0 4px",
              }}
            >
              Query sent to model
            </p>
            <code
              style={{
                fontSize: 11,
                color: "var(--color-text-secondary)",
                background: "var(--color-background-secondary)",
                padding: "4px 8px",
                borderRadius: 6,
                display: "block",
                wordBreak: "break-word",
              }}
            >
              {response.query_string}
            </code>
          </div>

          {/* Anomaly / low confidence */}
          <AnomalyBanner
            anomaly={response.anomaly}
            lowConf={response.low_confidence}
          />

          {/* Result count */}
          <p
            style={{
              fontSize: 13,
              color: "var(--color-text-secondary)",
              margin: "16px 0 10px",
            }}
          >
            {response.results.length} results
          </p>

          {/* Cards */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {response.results.map((r, i) => (
              <ResultCard key={r.code + i} result={r} rank={i + 1} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
