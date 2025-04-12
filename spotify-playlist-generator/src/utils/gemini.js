import { GoogleGenerativeAI } from "@google/generative-ai";

console.log(process.env.NEXT_PUBLIC_GEMINI_API_KEY);

const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY);

export async function getMoodFromConversation(chatLog) {
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  const result = await model.generateContent(
    `Analyze the user's mood based on this chat: ${chatLog}. Return only the emotion in one word.`
  );

  console.log(result.response.text().trim().toLowerCase());
  return result.response.text().trim().toLowerCase();
}
