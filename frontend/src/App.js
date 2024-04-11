import React, { useRef } from "react";
import { ThemeProvider } from "styled-components";
import Input from "./components/Input";
import Header from './components/Header';
import './style/input.css';
import './style/header.css';
import './style/register.css';
import './style/leaderboard.css';
import './style/profile.css';
import theme from './style/theme';
import {
  BrowserRouter as Router,
  Routes,
  Route,
} from "react-router-dom";
import Registration from "./components/Registration";
import Leaderboard from "./components/Leaderboard";
import UserProfile from "./components/UserProfile";
import Multiplayer from "./components/Multiplayer";
import { SocketProvider } from "./components/SocketContext";

function Home(){
  const textInputRef = useRef(null);
  const focusTextInput = () => {
    textInputRef.current && textInputRef.current.focus();
  };
  return (
    <ThemeProvider theme={theme}>
      <>
        <div className="canvas">
          <Header />
          <Input
            textInputRef={textInputRef}
            handleInputFocus={() => focusTextInput()}
          ></Input>
        </div>
      </>
    </ThemeProvider>
  )
}

function RegisterPage(){
  return (
    <ThemeProvider theme={theme}>
      <>
        <div className="register-canvas">
          <Registration />
        </div>
      </>
    </ThemeProvider>
  )
}

function LeaderboardPage(){
 return (
    <ThemeProvider theme={theme}>
      <>
        <div className="leaderboard-canvas">
          <Leaderboard />
        </div>
      </>
    </ThemeProvider>
  )
}

function UserProfilePage(){
  return (
    <ThemeProvider theme={theme}>
      <>
        <div className="profile-canvas">
          <UserProfile />
        </div>
      </>
    </ThemeProvider>
  )
}

function MultiplayerPage(){
  const textInputRef = useRef(null);
  const focusTextInput = () => {
    textInputRef.current && textInputRef.current.focus();
  };
  return (
    <SocketProvider>
      <ThemeProvider theme={theme}>
        <>
          <div className="game-canvas">
            <Header />
            <Multiplayer
              textInputRef={textInputRef}
              handleInputFocus={() => focusTextInput()}
            ></Multiplayer>
          </div>
        </>
      </ThemeProvider>
    </SocketProvider>
  )
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/login" element={<RegisterPage />} />
        <Route path="/leaderboard" element={<LeaderboardPage />} />
        <Route path="/profile" element={<UserProfilePage />} />
        <Route path="/game" element={<MultiplayerPage />} />
      </Routes>
    </Router>
  );
}

export default App;
