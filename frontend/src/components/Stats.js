import React from "react";
import { Box } from "@mui/system";
import { Tooltip } from "@mui/material";
import { CHARS_TOOLTIP } from "../constants/Constants";

const Stats = ({
  status,
  wpm,
  limitStart,
  charStats,
  raw,
  currMode
}) => {
  return (
    <>
      <Box display="flex" flexDirection="row" gap="5rem" justifyContent="center">
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
        {status === "finished" && (
          <section>
            <Tooltip title={
              <span>
                {Math.round((raw / limitStart) * 60.0)} wpm
              </span>
            }>
              <div className="stat-box">
                <span className="stat-head">Raw</span>
                <span className="stat-value">{Math.round((raw / limitStart) * 60.0)}</span>
              </div>
            </Tooltip>
            <div className="stat-box">
              <span className="stat-head">{currMode[0].toUpperCase() + currMode.slice(1)}</span>
              <span className="stat-value">{limitStart}</span>
            </div>
          </section>
        )}
      </Box>
    </>
  );
};

export default Stats;
