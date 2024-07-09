import axios from "axios";
import { exec } from "child_process";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import { promises as fs } from "fs";
import ElevenLabs from "elevenlabs-node";
import path from "path";
import ffmpeg from "fluent-ffmpeg";
import { fileURLToPath } from "url";

// Define __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const elevenLabsApiKey = process.env.ELEVEN_LABS_API_KEY;
const voiceID = "pNInz6obpgDQGcFmaJgB"; // Default voice ID

const voice = new ElevenLabs({
  apiKey: elevenLabsApiKey,
  voiceId: voiceID,
});

const ANIMATIONS = [
  "idle",
  "happy",
  "sad",
  "loser",
  "dance",
  "loser",
  "jump",
  "kiss",
];
const FACIAL_EXPRESSIONS = [
  "smile",
  "sad",
  "angry",
  "surprised",
  "funnyFace",
  "default",
];

const app = express();
app.use(cors());
app.use(express.json());

const handler = async (req, res) => {
  try {
    const userMessage = req.body.message;
    console.log("Received message from frontend:", userMessage);

    if (!userMessage) {
      const responseMessage = {
        text: `Hi! how's it going?`,
        audio: await audioFileToBase64("audios/intro.wav"),
        lipsync: await readJsonTranscript("audios/intro.json"),
        facialExpression: "smile",
        animation: "idle",
      };
      console.log("Sending response to frontend:", responseMessage);
      res.status(200).json({ messages: [responseMessage] });
      return;
    }

    console.log("Sending message to Rasa server:", userMessage);

    // Send message to Rasa and get the response
    const rasaResponse = await axios.post(
      "http://localhost:5005/webhooks/rest/webhook",
      {
        sender: "user",
        message: userMessage,
      }
    );

    console.log("Received response from Rasa server:", rasaResponse.data);

    const messages = await Promise.all(
      rasaResponse.data.map(async (rasaMessage, index) => {
        const message = {
          text: rasaMessage.text,
          facialExpression: "default",
          animation: "idle",
          audio: await textToSpeech(rasaMessage.text, index),
          lipsync: await lipSyncMessage(index),
        };
        console.log("Generated message:", {
          text: message.text,
          facialExpression: message.facialExpression,
          animation: message.animation,
        });
        return message;
      })
    );

    console.log("Sending response to frontend:", messages);
    res.status(200).json({ messages });
  } catch (error) {
    console.log("Error:", error);
    const fallbackMessage = {
      text: "Sorry I'm a dumbo!",
      audio: await audioFileToBase64("audios/dumbo.wav"),
      lipsync: await readJsonTranscript("audios/dumbo.json"),
      facialExpression: Math.random() < 0.5 ? "funnyFace" : "default",
      animation: "dance",
    };
    // Create a copy of fallbackMessage without the audio attribute for logging
    const fallbackMessageLog = { ...fallbackMessage };
    delete fallbackMessageLog.audio;

    console.log("Sending fallback response to frontend:", fallbackMessageLog);
    res.status(200).json({ messages: [fallbackMessage] });
  }
};

const textToSpeech = async (textInput, index) => {
  const fileName = `audios/audio_${index}.mp3`;
  try {
    console.log("textToSpeech parameters:", {
      elevenLabsApiKey,
      voiceID,
      fileName,
      textInput,
    });
    await voice.textToSpeech({
      fileName: path.join(__dirname, fileName),
      textInput,
    });
    return await audioFileToBase64(fileName);
  } catch (error) {
    console.log("Error in textToSpeech:", error);
    throw error;
  }
};

// Set the path to ffmpeg executable
ffmpeg.setFfmpegPath(path.join(__dirname, "ffmpeg", "bin", "ffmpeg.exe"));

const lipSyncMessage = async (index) => {
  const mp3FileName = path.join(__dirname, `audios/audio_${index}.mp3`);
  const wavFileName = path.join(__dirname, `audios/audio_${index}.wav`);
  const rhubarbPath = path.join(__dirname, "rhubarb-win", "rhubarb.exe"); // Adjust if necessary
  const fPath = path.join(__dirname, "ffmpeg", "bin", "ffmpeg.exe");

  try {
    // Convert MP3 to WAV using fluent-ffmpeg
    console.log("Converting MP3 to WAV:", mp3FileName, wavFileName);
    await execCommand(`${fPath} -y -i ${mp3FileName} ${wavFileName}`);

    // Perform lip sync operation using execCommand
    await execCommand(
      `${rhubarbPath} -f json -o audios/audio_${index}.json ${wavFileName} -r phonetic`
    );

    return await readJsonTranscript(`audios/audio_${index}.json`);
  } catch (error) {
    console.error("Error in lipSyncMessage:", error);
    throw error;
  }
};

const execCommand = (cmd) => {
  return new Promise((resolve, reject) => {
    exec(cmd, (error, stdout, stderr) => {
      if (error) {
        console.error(`exec error: ${error}`);
        reject(error);
        return;
      }
      if (stderr) {
        console.error(`stderr: ${stderr}`);
      }
      console.log(`stdout: ${stdout}`);
      resolve(stdout);
    });
  });
};

const readJsonTranscript = async (file) => {
  const data = await fs.readFile(file, "utf8");
  return JSON.parse(data);
};

const audioFileToBase64 = async (file) => {
  const data = await fs.readFile(file);
  return data.toString("base64");
};

export default handler;
