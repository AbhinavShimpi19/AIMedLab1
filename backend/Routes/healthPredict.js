import express from "express";
import { spawn } from "child_process";
const router = express.Router({ mergeParams: true });

const pythonScriptPathForSymptoms = "C:\\projects\\AI-MedLab-main\\backend\\symptoms.py";
const symptomsModel = "C:\\projects\\AI-MedLab-main\\aimodels\\svc.pkl";

router.post("/symptoms", (req, res) => {
  let responseSent = false;
  try {
    const data = req.body.data;
    console.log({ dataInString: JSON.stringify({ data }) });

    const pythonProcess = spawn("python", [
      pythonScriptPathForSymptoms,
      "--loads",
      symptomsModel,
      JSON.stringify({ data }),
    ]);

    let output = ""; // To accumulate stdout data

    pythonProcess.stdout.on("data", (data) => {
      output += data.toString();
    });

    pythonProcess.stderr.on("data", (data) => {
      console.error("Python script error:", data.toString());
    });

    pythonProcess.on("close", (code) => {
      console.log("Python process closed with code:", code);
      try {
        const prediction = JSON.parse(output); // Parse entire output
        if (!responseSent) {
          res.json({ data: prediction });
          responseSent = true;
        }
      } catch (err) {
        console.error("JSON parsing error:", err);
        if (!responseSent) {
          res.status(500).send("Failed to parse Python script output.");
          responseSent = true;
        }
      }
    });

    pythonProcess.on("error", (error) => {
      console.error("Python process error:", error);
      if (!responseSent) {
        res.status(500).send("Internal Server Error");
        responseSent = true;
      }
    });
  } catch (error) {
    console.error("Error:", error);
    if (!responseSent) {
      res.status(500).send("Internal Server Error");
      responseSent = true;
    }
  }
});

export default router;
