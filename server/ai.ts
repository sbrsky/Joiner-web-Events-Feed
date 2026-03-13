import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const textModel = genAI.getGenerativeModel({ model: "gemini-3.1-flash-lite-preview" });
const imageModel = genAI.getGenerativeModel({ model: "gemini-3.1-flash-image-preview" });

export async function refineDescription(description: string): Promise<string> {
  const prompt = `You are an expert event organizer. Rewrite the following event description to make it extremely engaging, professional, and exciting for users on a social event platform. Keep the tone vibrant and inviting. 
  Original text: "${description}"
  Provide only the refined text without any prefixes, quotes, or additional commentary.`;

  try {
    const result = await textModel.generateContent(prompt);
    const response = await result.response;
    let text = response.text().trim();
    // Remove any surrounding quotes if Gemini added them
    if (text.startsWith('"') && text.endsWith('"')) {
      text = text.substring(1, text.length - 1);
    }
    return text;
  } catch (error) {
    console.error("Gemini AI refinement error:", error);
    throw new Error("Failed to refine description with AI");
  }
}

export async function generateImageFromPrompt(userPrompt: string): Promise<{ url: string }> {
  console.log(`[AI Image] Generating image for prompt: ${userPrompt} using gemini-3.1-flash-image-preview`);
  
  try {
    const result = await imageModel.generateContent(userPrompt);
    const response = await result.response;
    
    // The image model returns the image as binary data in one of the parts
    const part = response.candidates?.[0]?.content?.parts?.[0];
    
    if (part?.inlineData) {
      const dataUri = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      console.log(`[AI Image] Successfully generated image (${part.inlineData.mimeType})`);
      return { url: dataUri };
    }

    // Fallback if no image data found
    console.warn("[AI Image] No inlineData found in response parts");
    return { url: `https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=2070&auto=format&fit=crop` };
  } catch (error) {
    console.error("Gemini Image generation error:", error);
    return { url: `https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=2070&auto=format&fit=crop` };
  }
}
