"use client";

import { useGameContext } from "../GameContext";
import { useEffect, useState } from "react";
import Button from "@mui/material/Button";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import CircleOutlinedIcon from "@mui/icons-material/CircleOutlined";
import CircleIcon from "@mui/icons-material/Circle";

// Vibrant palette for up to 26 colors (A-Z)
const colorPalette = [
   "#e53935", // Red
   "#fbc02d", // Yellow
   "#43a047", // Green
   "#1e88e5", // Blue
   "#8e24aa", // Purple
   "#fb8c00", // Orange
   "#00bcd4", // Cyan
   "#d81b60", // Pink
   "#7cb342", // Light Green
   "#3949ab", // Indigo
   "#c62828", // Dark Red
   "#fdd835", // Bright Yellow
   "#388e3c", // Dark Green
   "#1976d2", // Dark Blue
   "#6d4c41", // Brown
   "#ffb300", // Amber
   "#0097a7", // Teal
   "#c2185b", // Deep Pink
   "#689f38", // Olive
   "#5e35b1", // Deep Purple
   "#f4511e", // Deep Orange
   "#00acc1", // Light Teal
   "#ad1457", // Magenta
   "#33691e", // Forest Green
   "#283593", // Navy
   "#ffd600", // Gold
];

const API_BASE = "https://api.r.cx/api/mm"; // Change to your backend URL/port

function range(n: number) {
   return Array.from({ length: n }, (_, i) => i);
}

function getColorLetter(idx: number) {
   return String.fromCharCode(65 + idx); // A, B, C, ...
}

// Calculate dynamic size for circles and row spacing based on number of pegs
const getCircleSize = (numPegs: number) => {
   if (numPegs <= 4) return 40;
   if (numPegs <= 6) return 36;
   if (numPegs <= 8) return 32;
   return 28;
};

export default function GamePage() {
   const { settings, game, setGame } = useGameContext();
   const [guess, setGuess] = useState<(number | null)[]>(() => Array(settings.numPegs).fill(null));
   const [loading, setLoading] = useState(false);
   const [error, setError] = useState<string | null>(null);
   const [anchorEls, setAnchorEls] = useState<(null | HTMLElement)[]>(() =>
      Array(settings.numPegs).fill(null)
   );
   const [feedback, setFeedback] = useState<{ blacks: number; whites: number }[]>([]);
   const [rows, setRows] = useState<
      { guess: (number | null)[]; feedback: { blacks: number; whites: number } | null }[]
   >([]);
   const [gameStatus, setGameStatus] = useState<"playing" | "won" | "lost">("playing");
   const [solution, setSolution] = useState<string | null>(null);

   // Start a new game on mount
   useEffect(() => {
      async function startGame() {
         setLoading(true);
         setError(null);
         try {
            const startRes = await fetch(`${API_BASE}_start`, { method: "POST" });
            const { session } = await startRes.json();
            const genRes = await fetch(`${API_BASE}_gen`, {
               method: "POST",
               headers: { "Content-Type": "application/json" },
               body: JSON.stringify({
                  session,
                  colors: settings.numColors,
                  pegs: settings.numPegs,
                  dups: settings.allowDuplicates ? 1 : 0,
               }),
            });
            const { success } = await genRes.json();
            if (!success) throw new Error("Failed to generate board");
            setGame({
               sessionId: session,
               guesses: [],
               results: [],
               solution: null,
               status: "playing",
            });
            setGuess(Array(settings.numPegs).fill(null));
            setRows([]);
            setFeedback([]);
            setGameStatus("playing");
            setSolution(null);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
         } catch (e: any) {
            setError(e.message || "Failed to start game");
         } finally {
            setLoading(false);
         }
      }
      startGame();
      // eslint-disable-next-line react-hooks/exhaustive-deps
   }, [settings]);

   const handleCircleClick = (idx: number, event: React.MouseEvent<HTMLElement>) => {
      const newAnchors = [...anchorEls];
      newAnchors[idx] = event.currentTarget;
      setAnchorEls(newAnchors);
   };

   const handleMenuClose = (idx: number) => {
      const newAnchors = [...anchorEls];
      newAnchors[idx] = null;
      setAnchorEls(newAnchors);
   };

   const handleColorPick = (pegIdx: number, colorIdx: number) => {
      const newGuess = [...guess];
      newGuess[pegIdx] = colorIdx;
      setGuess(newGuess);
      handleMenuClose(pegIdx);
   };

   const canGuess = gameStatus === "playing" && guess.every((v) => v !== null);

   const submitGuess = async () => {
      if (!game.sessionId) return;
      setLoading(true);
      setError(null);
      try {
         const guessStr = guess.map((idx) => getColorLetter(idx!)).join("");
         const res = await fetch(`${API_BASE}_judge`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ session: game.sessionId, board: guessStr }),
         });
         const data = await res.json();
         const newRows = [
            ...rows,
            { guess: [...guess], feedback: { blacks: data.blacks, whites: data.whites } },
         ];
         setRows(newRows);
         setFeedback([...feedback, { blacks: data.blacks, whites: data.whites }]);
         if (data.blacks === settings.numPegs) {
            setGameStatus("won");
            setSolution(guessStr);
         } else if (newRows.length >= 10) {
            setGameStatus("lost");
            setSolution(data.solution || null);
         }
         setGuess(Array(settings.numPegs).fill(null));
         // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (e: any) {
         setError(e.message || "Failed to submit guess");
      } finally {
         setLoading(false);
      }
   };

   // Helper to render feedback circles
   const renderFeedback = (blacks: number, whites: number) => {
      const total = blacks + whites;
      return (
         <Stack direction="row" spacing={1}>
            {Array.from({ length: blacks }).map((_, i) => (
               <CircleIcon key={`b${i}`} sx={{ color: "black", fontSize: 20 }} />
            ))}
            {Array.from({ length: whites }).map((_, i) => (
               <CircleIcon
                  key={`w${i}`}
                  sx={{
                     color: "white",
                     fontSize: 20,
                     border: "1px solid #888",
                     borderRadius: "50%",
                  }}
               />
            ))}
            {Array.from({ length: settings.numPegs - total }).map((_, i) => (
               <CircleOutlinedIcon key={`e${i}`} sx={{ color: "#444", fontSize: 20 }} />
            ))}
         </Stack>
      );
   };

   const circleSize = getCircleSize(settings.numPegs);

   return (
      <Box sx={{ background: "var(--background)", minHeight: "100svh", py: 6 }}>
         <Stack spacing={4} alignItems="center" maxWidth={600} mx={"auto"} px={2}>
            <Typography
               variant="h4"
               sx={{ color: "white", fontWeight: 700, mb: 2, letterSpacing: -2 }}
            >
               MASTERMIND
            </Typography>
            {error && <Typography color="error.main">{error}</Typography>}
            <Stack spacing={2} width="100%">
               {rows.map((row, rowIdx) => (
                  <Stack
                     key={rowIdx}
                     direction="row"
                     alignItems="center"
                     justifyContent="flex-start"
                     sx={{
                        background: "#444444",
                        borderRadius: 2,
                        // px: rowPaddingX,
                        py: 1,
                        minWidth: Math.max(420, settings.numPegs * (circleSize + 18) + 180),
                     }}
                  >
                     <Stack direction="row" spacing={2} alignItems="center">
                        {row.guess.map((colorIdx, pegIdx) => (
                           <CircleIcon
                              key={pegIdx}
                              sx={{
                                 color: colorIdx !== null ? colorPalette[colorIdx] : "#444",
                                 fontSize: circleSize + 4,
                                 borderRadius: "50%",
                              }}
                           />
                        ))}
                     </Stack>
                     <Box sx={{ minWidth: 120, textAlign: "right", marginLeft: "auto" }}>
                        {row.feedback && renderFeedback(row.feedback.blacks, row.feedback.whites)}
                     </Box>
                  </Stack>
               ))}
               {gameStatus === "playing" && (
                  <Stack
                     direction="row"
                     alignItems="center"
                     justifyContent="flex-start"
                     sx={{
                        background: "var(--background)",
                        borderRadius: 2,
                        px: 2,
                        py: 1,
                        minWidth: Math.max(420, settings.numPegs * (circleSize + 18) + 210),
                     }}
                  >
                     <Stack direction="row" spacing={2} mr={2} alignItems="center">
                        {guess.map((colorIdx, pegIdx) => (
                           <Box key={pegIdx}>
                              <IconButton
                                 onClick={(e) => handleCircleClick(pegIdx, e)}
                                 sx={{
                                    border: "1.5px dashed #888",
                                    borderRadius: "50%",
                                    width: circleSize + 8,
                                    height: circleSize + 8,
                                    background:
                                       colorIdx !== null ? colorPalette[colorIdx] : "transparent",
                                    color: colorIdx !== null ? colorPalette[colorIdx] : "#888",
                                    transition: "background 0.2s",
                                    p: 0,
                                 }}
                              >
                                 <CircleIcon
                                    sx={{
                                       fontSize: circleSize,
                                       color:
                                          colorIdx !== null
                                             ? colorPalette[colorIdx]
                                             : "transparent",
                                       filter: colorIdx !== null ? "none" : "grayscale(1)",
                                    }}
                                 />
                              </IconButton>
                              <Menu
                                 anchorEl={anchorEls[pegIdx]}
                                 open={Boolean(anchorEls[pegIdx])}
                                 onClose={() => handleMenuClose(pegIdx)}
                              >
                                 {range(settings.numColors).map((cIdx) => (
                                    <MenuItem
                                       key={cIdx}
                                       onClick={() => handleColorPick(pegIdx, cIdx)}
                                    >
                                       <CircleIcon
                                          sx={{ color: colorPalette[cIdx], fontSize: 28, mr: 1 }}
                                       />
                                       {getColorLetter(cIdx)}
                                    </MenuItem>
                                 ))}
                              </Menu>
                           </Box>
                        ))}
                     </Stack>
                     <Box sx={{ minWidth: 120, textAlign: "right", marginLeft: "auto" }}>
                        <Button
                           variant="contained"
                           color="error"
                           size="large"
                           disabled={!canGuess || loading}
                           sx={{ fontWeight: 700, fontSize: 18, px: 4, boxShadow: "none" }}
                           onClick={submitGuess}
                        >
                           Guess
                        </Button>
                     </Box>
                  </Stack>
               )}
            </Stack>
            {gameStatus === "won" && (
               <Typography sx={{ color: "var(--cta-red)", fontWeight: 700, mt: 3 }}>
                  You win! The combination was:{" "}
                  <span style={{ fontFamily: "monospace" }}>{solution}</span>
               </Typography>
            )}
            {gameStatus === "lost" && (
               <Typography sx={{ color: "white", fontWeight: 700, mt: 3 }}>
                  You lose! The combination was:{" "}
                  <span style={{ fontFamily: "monospace" }}>{solution || "(unknown)"}</span>
               </Typography>
            )}
            <Stack direction="row" spacing={2} mt={4}>
               <Button
                  variant="outlined"
                  color="error"
                  onClick={() => window.location.reload()}
                  sx={{ fontWeight: 700 }}
               >
                  Restart
               </Button>
               <Button
                  variant="contained"
                  color="error"
                  onClick={() => (window.location.href = "/")}
                  sx={{ fontWeight: 700 }}
               >
                  Menu
               </Button>
            </Stack>
         </Stack>
      </Box>
   );
}
