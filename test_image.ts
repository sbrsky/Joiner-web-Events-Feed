import { GoogleGenerativeAI } from "@google/generative-ai";
import * as dotenv from "dotenv";
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

async function testImageModel() {
  const imageModelName = "gemini-3.1-flash-image-preview";
  console.log(`\n--- Testing Image Model: ${imageModelName} ---`);
  
  try {
    const model = genAI.getGenerativeModel({ model: imageModelName });
    const result = await model.generateContent("A professional futuristic event poster for a tech conference");
    const response = await result.response;
    
    console.log("Response Candidates Length:", response.candidates?.length);
    if (response.candidates && response.candidates[0].content.parts) {
      response.candidates[0].content.parts.forEach((part, i) => {
        console.log(`Part ${i} Keys:`, Object.keys(part));
        if (part.inlineData) {
          console.log(`Part ${i} inlineData MimeType:`, part.inlineData.mimeType);
          console.log(`Part ${i} inlineData Base64 Prefix:`, part.inlineData.data.substring(0, 50));
        }
        if (part.text) {
          console.log(`Part ${i} Text:`, part.text);
        }
      });
    }
  } catch (err) {
    console.error("Image Model Error:", (err as Error).message);
  }
}

testImageModel();
