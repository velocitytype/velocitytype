import React from "react";
import { Box } from "@mui/system";
import { Tooltip } from "@mui/material";


// This shows the results of a shared result
const ResultStats = ({
  status,
  wpm,
  limitStart,
  currMode,
  accuracy
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
              <span className="stat-value">{Math.round(accuracy)}%</span>
            </div>
          </section>
        )}
        
        {status === "finished" && (
          <section>
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

export default ResultStats;
