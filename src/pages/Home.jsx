
import { useState } from "react";
import "./Home.css";
import { useNavigate } from "react-router-dom";

function Home() {
    const [playerName, setPlayerName] = useState("");
    const [level, setLevel] = useState("easy");
    const [message, setMessage] = useState("");

    const navigate = useNavigate();

    // Gestion du lancement du jeu
    function handlePlay(event) {
        event.preventDefault();

        const player = playerName.trim();

        // Vérification du niveau sélectionné
        let selectedLevel = "";

        if (level === "easy") {
            selectedLevel = "Facile";
        } 
        else if (level === "medium") {
            selectedLevel = "Intermédiaire";
        } 
        else if (level === "hard") {
            selectedLevel = "Difficile";
        }

        setMessage(
            `${player ? `Bienvenue, ${player} ! ` : ""}Niveau ${selectedLevel} sélectionné.`
        );

        // Navigation vers l'interface correspondante
        if (level === "easy") {
            navigate("/easy-level", { state: { playerName: player } });
        } 
        else if (level === "medium") {
            navigate("/medium-level", { state: { playerName: player } });
        } 
        else if (level === "hard") {
            navigate("/hard-level", { state: { playerName: player } });
        }
    }

    // Quitter le menu
    function handleQuit() {
        window.history.back();
    }

    return (
        <main className="home">
            <section className="menu-card" aria-labelledby="game-title">

                <div className="menu-card__content">

                    <p className="menu-eyebrow">
                        Prêt pour l'aventure ?
                    </p>

                    <h1 id="game-title">
                        Robot Navigation
                    </h1>

                    <p className="menu-subtitle">
                        Choisis ta configuration et prends les commandes.
                    </p>

                    <form className="menu-form" onSubmit={handlePlay}>

                        <label className="menu-label" htmlFor="player-name">
                            Ton pseudo
                        </label>

                        <input
                            id="player-name"
                            className="menu-input"
                            type="text"
                            placeholder="Entre ton pseudo"
                            value={playerName}
                            onChange={(event) => setPlayerName(event.target.value)}
                            autoComplete="nickname"
                        />

                        <label className="menu-label" htmlFor="game-level">
                            Niveau
                        </label>

                        <select
                            id="game-level"
                            className="menu-input menu-select"
                            value={level}
                            onChange={(event) => setLevel(event.target.value)}
                        >
                            <option value="easy">Facile</option>
                            <option value="medium">Intermédiaire</option>
                            <option value="hard">Difficile</option>
                        </select>

                        <button
                            className="menu-button menu-button--play"
                            type="submit"
                        >
                            Jouer
                        </button>

                        <button
                            className="menu-button menu-button--quit"
                            type="button"
                            onClick={handleQuit}
                        >
                            Quitter
                        </button>

                    </form>

                    <p className="menu-message" aria-live="polite">
                        {message}
                    </p>

                </div>
            </section>

            <p className="home-caption">
                ROBOT NAVIGATION SIMULATOR
            </p>

        </main>
    );
}

export default Home;
