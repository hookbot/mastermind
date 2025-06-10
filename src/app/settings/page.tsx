"use client";
import TextField from "@mui/material/TextField";
import Switch from "@mui/material/Switch";
import FormControlLabel from "@mui/material/FormControlLabel";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Paper from "@mui/material/Paper";
import { useGameContext } from "../GameContext";
import { useRouter } from "next/navigation";
import Stack from "@mui/material/Stack";

export default function SettingsPage() {
   const { settings, setSettings } = useGameContext();
   const router = useRouter();

   // Limit number of pegs to 10 in settings
   const maxPegs = 10;

   return (
      <Stack
         justifyContent="center"
         alignItems="center"
         minHeight="100svh"
         sx={{ background: "#181818" }}
      >
         <Paper
            elevation={3}
            sx={{
               p: 4,
               borderRadius: 3,
               minWidth: 380,
               boxShadow: "0 2px 16px rgba(0,0,0,0.06)",
            }}
         >
            <Typography variant="h4" fontWeight={700} align="center" gutterBottom>
               Settings
            </Typography>
            <Stack spacing={3}>
               <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography>Number of Colors</Typography>
                  <TextField
                     type="number"
                     size="small"
                     inputProps={{ min: 2, max: 26 }}
                     value={settings.numColors}
                     onChange={(e) =>
                        setSettings({
                           ...settings,
                           numColors: Number(e.target.value),
                        })
                     }
                     sx={{ width: 90 }}
                  />
               </Stack>
               <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography>Number of Pegs</Typography>
                  <TextField
                     type="number"
                     size="small"
                     inputProps={{ min: 2, max: maxPegs }}
                     value={settings.numPegs}
                     onChange={(e) => {
                        let value = Number(e.target.value);
                        if (value > maxPegs) value = maxPegs;
                        setSettings({ ...settings, numPegs: value });
                     }}
                     sx={{ width: 90 }}
                  />
               </Stack>
               <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography>Allow Duplicates</Typography>
                  <FormControlLabel
                     control={
                        <Switch
                           checked={settings.allowDuplicates}
                           onChange={(e) =>
                              setSettings({
                                 ...settings,
                                 allowDuplicates: e.target.checked,
                              })
                           }
                           color="error"
                        />
                     }
                     label=""
                     sx={{ m: 0 }}
                  />
               </Stack>
            </Stack>
            <Button
               variant="contained"
               color="error"
               size="large"
               fullWidth
               sx={{ mt: 5, fontSize: 20, height: 56 }}
               onClick={() => router.push("/")}
            >
               Back
            </Button>
         </Paper>
      </Stack>
   );
}
