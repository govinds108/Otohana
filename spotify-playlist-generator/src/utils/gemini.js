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

export async function getSongsFromPrompt(prompt) {
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  const result = await model.generateContent(
    `Generate a list of 10 songs that match this prompt: "${prompt}". It is critical to return your response in array format for further processing:
      [
        "Song Title 1",
        "Song Title 2",
        "Song Title 3",
        ...
        "Song Title 10"
      ]`
  );

  try {
    // Clean up the response to remove any extra formatting
    const rawResponse = result.response.text();
    const cleanedResponse = rawResponse
      .replace(/```json\n/, "") // Remove the opening backticks and "json" tag
      .replace(/\n```/, "") // Remove the closing backticks
      .trim(); // Trim any extra whitespace

    // Parse the cleaned response as JSON
    const songs = JSON.parse(cleanedResponse);
    console.log(songs);
    return songs;
  } catch (error) {
    console.error("Failed to parse songs response:", error);
    throw new Error("Invalid response format from generative AI");
  }
}
