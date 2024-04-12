import React from "react";
import { Box } from "@mui/system";
import { Tooltip } from "@mui/material";
import { CHARS_TOOLTIP } from "../constants/Constants";

// GameStats shows statistics of games when a user finishes the test

const GameStats = ({
  status,
  wpm,
  limitStart,
  charStats,
  raw,
  currMode
}) => {
  return (
    <>
      <Box display="flex" flexDirection="column" gap="1rem" justifyContent="center" className="game-stats-box">
        {status === "finished" && (
            <div className="game-stats-heading">
                <h2>Your Performance</h2>
            </div>
        )}
        {status === "finished" && (
          <section>
            <Tooltip title={
              <span>
                {Math.round(wpm * 100) / 100} wpm
              </span>
            }>
              <div className="stat-box">
                <span className="stat-head">WPM</span>
                <span className="stat-value">{Math.round(wpm)}</span>
              </div>
            </Tooltip>
            <div className="stat-box">
              <span className="stat-head">Accuracy</span>
              <span className="stat-value">{Math.round(charStats[0])}%</span>
            </div>
          </section>
        )}
        
        {status === "finished" && (
          <Tooltip
            title={
              <span style={{ whiteSpace: "pre-line" }}>
                {CHARS_TOOLTIP}
              </span>
            }
          >
            <div className="stat-box">
              <span className="stat-head">Char</span>
              <div>
                <span className="correct-char-stats stat-value">{charStats[1]}/</span>
                <span className="incorrect-char-stats stat-value">{charStats[2]}/</span>
                <span className="missing-char-stats stat-value">{charStats[3]}/</span>
                <span className="correct-char-stats stat-value">{charStats[4]}</span>
              </div>
            </div>

          </Tooltip>
        )}
      </Box>
    </>
  );
};

export default GameStats;
