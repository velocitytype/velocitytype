// Import all components and their styling

import React, { useRef } from "react";
import { ThemeProvider } from "styled-components";
import Input from "./components/Input";
import Header from './components/Header';
import './style/input.css';
import './style/header.css';
import './style/register.css';
import './style/leaderboard.css';
import './style/profile.css';
import './style/sharedresult.css';
import './style/notfound.css';
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
import ResetPassword from "./components/ResetPassword";
import { SocketProvider } from "./components/SocketContext";
import SharedResult from "./components/SharedResult";
import NotFound from "./components/NotFound";

// Home is the homepage that contains the wpm test
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

// Registration Page
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

// Leaderboard Page
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

// Profile page of a user
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

// Multiplayer/Game mode page
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

// Shared Result Page
function SharedResultPage(){
  return (
    <ThemeProvider theme={theme}>
      <>
        <div className="shared-result-canvas">
          <SharedResult />
        </div>
      </>
    </ThemeProvider>
  )
}

// 404 not found page
function NotFoundPage(){
  return (
    <ThemeProvider theme={theme}>
      <>
        <div className="not-found-canvas">
          <NotFound />
        </div>
      </>
    </ThemeProvider>
  )
}

function ResetPasswordPage(){
  return (
    <ThemeProvider theme={theme}>
      <>
        <div className="reset-password-canvas">
          <ResetPassword />
        </div>
      </>
    </ThemeProvider>
  )
}

function App() {
  return (
    // Set up routing
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/login" element={<RegisterPage />} />
        <Route path="/leaderboard" element={<LeaderboardPage />} />
        <Route path="/profile" element={<UserProfilePage />} />
        <Route path="/game" element={<MultiplayerPage />} />
        <Route path="/results/:id" element={<SharedResultPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Router>
  );
}

export default App;
