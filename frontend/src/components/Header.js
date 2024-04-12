import React from "react";
import { useNavigate } from "react-router-dom";
import { FaUser } from "react-icons/fa";
import { AiFillHome } from "react-icons/ai";
import { MdLeaderboard } from "react-icons/md";
import { IoGameController } from "react-icons/io5";
import '../style/header.css';

const Header = () => {
  const navigate = useNavigate();
  return (
    <div className="header">
      <section>
        <h1 onClick={() => navigate("/")}>
          VelocityType
        </h1>
      </section>
      <section>
        <AiFillHome onClick={() => navigate("/")} style={{fontSize: "24px"}}/>
        <IoGameController onClick={() => navigate("/game")} style={{fontSize: "24px"}}/>
        <MdLeaderboard onClick={() => navigate("/leaderboard")} style={{fontSize: "24px"}}/>
        <FaUser onClick={() => navigate("/register")} style={{fontSize: "24px"}}/>
      </section>
    </div>
  );
};

export default Header;
