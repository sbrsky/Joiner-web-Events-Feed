import { GoogleGenerativeAI } from "@google/generative-ai";
import * as dotenv from "dotenv";
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

async function testModels() {
  console.log("Testing Gemini API Key:", process.env.GEMINI_API_KEY?.substring(0, 10) + "...");
  
  const textModelName = "gemini-3.1-flash-lite-preview";
  const imageModelName = "gemini-3.1-flash-image-preview";

  console.log(`\n--- Testing Text Model: ${textModelName} ---`);
  try {
    const model = genAI.getGenerativeModel({ model: textModelName });
    const result = await model.generateContent("Hello, are you there?");
    console.log("Response:", result.response.text());
  } catch (err) {
    console.error("Text Model Error:", (err as Error).message);
  }

  console.log(`\n--- Testing Image Model: ${imageModelName} ---`);
  try {
    const model = genAI.getGenerativeModel({ model: imageModelName });
    const result = await model.generateContent("A sunset over the ocean");
    console.log("Response (textual part):", result.response.text());
  } catch (err) {
    console.error("Image Model Error:", (err as Error).message);
  }
}

testModels();
