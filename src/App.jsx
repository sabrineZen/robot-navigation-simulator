import React, { useState } from "react";
import HomeScreen from "./components/HomeScreen.jsx";
import LevelScreen from "./components/LevelScreen.jsx";

export default function App() {
  const [selectedLevel, setSelectedLevel] = useState(1);
  const [activeScreen, setActiveScreen] = useState("home"); // "home" | "level"

  if (activeScreen === "home") {
    return (
      <HomeScreen
        selectedLevel={selectedLevel}
        onSelectLevel={setSelectedLevel}
        onStart={(lvl) => {
          setSelectedLevel(lvl);
          setActiveScreen("level");
        }}
      />
    );
  }

  return (
    <LevelScreen
      level={selectedLevel}
      onBackToHome={() => setActiveScreen("home")}
    />
  );
}