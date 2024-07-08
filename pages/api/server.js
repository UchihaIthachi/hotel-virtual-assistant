// pages/api/chat.js
import axios from "axios";
import voice from "elevenlabs-node";
import fs from "fs/promises";
import path from "path";
import { exec } from "child_process";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const elevenLabsApiKey = process.env.ELEVEN_LABS_API_KEY;
  const voiceID = "pNInz6obpgDQGcFmaJgB";

  try {
    const userMessage = req.body.message;
    if (!userMessage) {
      const responseMessage = {
        text: `Hi! how's it going?`,
        audio: await audioFileToBase64("public/audios/intro.wav"),
        lipsync: await readJsonTranscript("public/audios/intro.json"),
        facialExpression: "smile",
        animation: "idle",
      };
      return res.status(200).json({ messages: [responseMessage] });
    }

    const rasaResponse = await axios.post(
      "http://localhost:5005/webhooks/rest/webhook",
      {
        sender: "user",
        message: userMessage,
      }
    );

    const messages = await Promise.all(
      rasaResponse.data.map(async (rasaMessage, index) => {
        const message = {
          text: rasaMessage.text,
          facialExpression: "default",
          animation: "idle",
          audio: await textToSpeech(
            elevenLabsApiKey,
            voiceID,
            rasaMessage.text,
            index
          ),
          lipsync: await lipSyncMessage(index),
        };
        return message;
      })
    );

    res.status(200).json({ messages });
  } catch (error) {
    console.error("Error:", error);
    const fallbackMessage = {
      text: "Sorry I'm a dumbo!",
      audio: await audioFileToBase64("public/audios/dumbo.wav"),
      lipsync: await readJsonTranscript("public/audios/dumbo.json"),
      facialExpression: Math.random() < 0.5 ? "funnyFace" : "default",
      animation: "dance",
    };
    res.status(500).json({ messages: [fallbackMessage] });
  }
}

const textToSpeech = async (elevenLabsApiKey, voiceID, textInput, index) => {
  const fileName = `public/audios/audio_${index}.mp3`;
  await voice.textToSpeech(elevenLabsApiKey, voiceID, fileName, textInput);
  return await audioFileToBase64(fileName);
};

const lipSyncMessage = async (index) => {
  const mp3FileName = path.join(
    process.cwd(),
    `public/audios/audio_${index}.mp3`
  );
  const wavFileName = path.join(
    process.cwd(),
    `public/audios/audio_${index}.wav`
  );
  const rhubarbPath = path.join(process.cwd(), "rhubarb-win", "rhubarb.exe");
  const fPath = path.join(process.cwd(), "ffmpeg", "bin", "ffmpeg.exe");

  await execCommand(`${fPath} -y -i ${mp3FileName} ${wavFileName}`);
  await execCommand(
    `${rhubarbPath} -f json -o public/audios/audio_${index}.json ${wavFileName} -r phonetic`
  );
  return await readJsonTranscript(`public/audios/audio_${index}.json`);
};

const execCommand = (cmd) => {
  return new Promise((resolve, reject) => {
    exec(cmd, (error, stdout, stderr) => {
      if (error) reject(error);
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
