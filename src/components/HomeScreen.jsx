import React from "react";

const LEVELS = [
  {
    id: 1,
    badge: "Niveau 1 • Facile",
    title: "Chemin avec obstacles fixes",
    description:
      "Le robot trouve un chemin valide entre le départ et la destination sur une grille (min. 60×60) avec des obstacles fixes.",
    tag: "Base sur 13 pts",
  },
  {
    id: 2,
    badge: "Niveau 2 • Moyen",
    title: "Obstacles dynamiques en temps réel",
    description:
      "Des obstacles apparaissent ou disparaissent pendant le trajet : si le chemin est bloqué, un nouvel itinéraire est recalculé.",
    tag: "+3 pts cumulables",
  },
  {
    id: 3,
    badge: "Niveau 3 • Difficile",
    title: "Plus court chemin & sélection dynamique",
    description:
      "Recherche optimisée sous contrainte de temps T(m) avec sélection dynamique entre recherche locale et A* complet.",
    tag: "+4 pts cumulables",
  },
];

export default function HomeScreen({ selectedLevel, onSelectLevel, onStart }) {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "radial-gradient(circle at top, #0f172a 0%, #020617 70%)",
        color: "#f8fafc",
        fontFamily: "system-ui, -apple-system, sans-serif",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "32px 20px",
        gap: "28px",
      }}
    >
      <div style={{ textAlign: "center", maxWidth: "680px" }}>
        <div
          style={{
            display: "inline-block",
            padding: "5px 12px",
            borderRadius: "999px",
            background: "rgba(56, 189, 248, 0.14)",
            border: "1px solid rgba(56, 189, 248, 0.35)",
            color: "#7dd3fc",
            fontSize: "0.82rem",
            fontWeight: 600,
            marginBottom: "12px",
          }}
        >
          Algorithmique Avancée • Thème 2
        </div>
        <h1 style={{ margin: 0, fontSize: "2rem", letterSpacing: "-0.02em" }}>
          Navigation Intelligente d’un Robot
        </h1>
        <p style={{ margin: "10px 0 0", color: "#94a3b8", fontSize: "1rem", lineHeight: 1.5 }}>
          Choisis ton niveau puis clique sur <strong>Commencer</strong> pour lancer l’interface correspondante.
        </p>
      </div>

      {/* Cartes des 3 niveaux */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
          gap: "18px",
          width: "100%",
          maxWidth: "920px",
        }}
      >
        {LEVELS.map((lvl) => {
          const active = selectedLevel === lvl.id;
          return (
            <button
              key={lvl.id}
              type="button"
              onClick={() => onSelectLevel(lvl.id)}
              style={{
                textAlign: "left",
                padding: "20px",
                borderRadius: "16px",
                cursor: "pointer",
                background: active
                  ? "linear-gradient(160deg, rgba(56, 189, 248, 0.16), rgba(15, 23, 42, 0.95))"
                  : "rgba(15, 23, 42, 0.75)",
                border: active ? "2px solid #38bdf8" : "1px solid #1e293b",
                color: "#f8fafc",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                gap: "14px",
                transition: "all 0.18s ease",
                boxShadow: active ? "0 12px 30px rgba(56, 189, 248, 0.16)" : "none",
              }}
            >
              <div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: "8px",
                    marginBottom: "10px",
                  }}
                >
                  <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "#38bdf8" }}>
                    {lvl.badge}
                  </span>
                  <span
                    style={{
                      fontSize: "0.75rem",
                      padding: "3px 8px",
                      borderRadius: "8px",
                      background: "#1e293b",
                      color: "#cbd5e1",
                    }}
                  >
                    {lvl.tag}
                  </span>
                </div>

                <h2 style={{ margin: "0 0 8px", fontSize: "1.15rem" }}>{lvl.title}</h2>
                <p style={{ margin: 0, fontSize: "0.88rem", color: "#94a3b8", lineHeight: 1.5 }}>
                  {lvl.description}
                </p>
              </div>

              <div
                style={{
                  fontSize: "0.84rem",
                  fontWeight: 600,
                  color: active ? "#38bdf8" : "#64748b",
                }}
              >
                {active ? "✓ Niveau sélectionné" : "Sélectionner ce niveau"}
              </div>
            </button>
          );
        })}
      </div>

      {/* Bouton principal Commencer */}
      <button
        type="button"
        onClick={() => onStart(selectedLevel)}
        style={{
          padding: "14px 34px",
          borderRadius: "12px",
          border: "none",
          background: "linear-gradient(90deg, #10b981, #38bdf8)",
          color: "#020617",
          fontSize: "1.05rem",
          fontWeight: 800,
          cursor: "pointer",
          boxShadow: "0 12px 28px rgba(16, 185, 129, 0.28)",
        }}
      >
        Commencer le Niveau {selectedLevel} →
      </button>
    </div>
  );
}