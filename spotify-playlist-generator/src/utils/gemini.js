import { GoogleGenerativeAI } from "@google/generative-ai";

console.log(process.env.NEXT_PUBLIC_GEMINI_API_KEY);

const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY);

export async function getMoodFromConversation(chatLog) {
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  const result = await model.generateContent(
    `Analyze the user's mood based on this chat: ${chatLog}. Return only the emotion as a categorical mood (as specific as possible) the user is feeling on one word our a very short phrase (with no punctuation).`
  );

  console.log(result.response.text().trim().toLowerCase());
  return result.response.text().trim().toLowerCase();
}

export async function getSongsFromPrompt(prompt, mood) {
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  const result = await model.generateContent(
    `Generate a list of 10 songs that match this prompt: "${prompt}" and fit the mood of ${mood}. It is critical to return your response in array format for further processing:
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

export async function getSimilarSongs(userLikedSongs) {
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  const likedSongsString = userLikedSongs.map((song) => `"${song}"`).join(", ");
  const prompt = `The user likes the following songs: [${likedSongsString}]. Generate a list of 10 songs that includes these songs and additional songs that are similar to them. Return the response in array format:
      [
        "Song Title 1",
        "Song Title 2",
        ...
        "Song Title 10"
      ]`;

  const result = await model.generateContent(prompt);

  try {
    // Clean up the response to remove any extra formatting
    const rawResponse = result.response.text();
    const cleanedResponse = rawResponse
      .replace(/```json\n/, "") // Remove the opening backticks and "json" tag
      .replace(/\n```/, "") // Remove the closing backticks
      .trim(); // Trim any extra whitespace

    // Parse the cleaned response as JSON
    const songs = JSON.parse(cleanedResponse);
    console.log("GEMINI", songs);
    return songs;
  } catch (error) {
    console.error("Failed to parse similar songs response:", error);
    throw new Error("Invalid response format from generative AI");
  }
}

export async function getPlaylistTitleFromPrompt(prompt) {
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  const result = await model.generateContent(
    `Create a creative and catchy playlist title based on this prompt: "${prompt}". Please select only one mood, which fits the tone and mood of the user's input. Do not provide multiple options, make a selection for the user. Format your response to only be the title, no additional characters. The only text you respond with should only be the title.`
  );

  try {
    const title = result.response.text().trim();
    console.log("Generated Playlist Title from Prompt:", title);
    return title;
  } catch (error) {
    console.error("Failed to generate playlist title from prompt:", error);
    throw new Error("Error generating playlist title from prompt");
  }
}

export async function getPlayListDescription(prompt, title) {
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  const result = await model.generateContent(
    `Create a creative and catchy playlist description for a music playlist based on this prompt: "${prompt}". The title of this playlist will be "${title}".  Do not provide multiple options, make a selection for the user. Format your response to only be the title, no additional characters. Plase do not include the title in the description of the playlist.`
  );

  try {
    const title = result.response.text().trim();
    console.log("Generated Playlist Title from Prompt:", title);
    return title;
  } catch (error) {
    console.error("Failed to generate playlist title from prompt:", error);
    throw new Error("Error generating playlist title from prompt");
  }
}

export async function getSongDescription(mood, title) {
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  const result = await model.generateContent(
    `Provide a short description of the song ${title} and describe how it relates to the mood of ${mood}. Keep this description short and cocise, it MUST be a few short phrases. It is very important not to provide or include any additional text (including headers) that is not related to the actual response requested.`
  );

  try {
    const desc = result.response.text().trim();
    return desc;
  } catch (error) {
    console.error("Failed to generate playlist desc from prompt:", error);
    throw new Error("Error generating playlist desc from prompt");
  }
}

