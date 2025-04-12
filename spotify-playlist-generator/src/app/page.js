"use client";

import { useState, useEffect } from "react";
import { getMoodFromConversation, getSongsFromPrompt } from "../utils/gemini";
import {
  getAuthorizationUrl,
  handleAuthorizationCode,
  createPlaylistForMood,
  createPlaylistWithSpecificSongs,
} from "../utils/spotify";

export default function App() {
  const [chat, setChat] = useState("");
  const [playlistUrl, setPlaylistUrl] = useState(null);
  const [mood, setMood] = useState(null);
  const [loading, setLoading] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);

  // Check for authorization code in the URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get("code");

    if (code) {
      handleAuthorizationCode(code)
        .then(() => {
          setAuthenticated(true);
          window.history.replaceState({}, document.title, "/"); // Clean up the URL
        })
        .catch((err) => {
          console.error("Error handling authorization code:", err);
          alert("Failed to authenticate with Spotify. Please try again.");
        });
    }
  }, []);

  const handleLogin = () => {
    const authUrl = getAuthorizationUrl();
    window.location.href = authUrl; // Redirect to Spotify login
  };

  const handleSubmit = async () => {
    if (!authenticated) {
      alert("Please log in to Spotify first.");
      return;
    }

    setLoading(true);
    setPlaylistUrl(null);
    setMood(null);

    try {
      const moodResult = await getMoodFromConversation(chat);
      const songs = await getSongsFromPrompt(moodResult);
      // const playlist = await createPlaylistForMood(moodResult);
      const playlist = await createPlaylistWithSpecificSongs(moodResult, songs);
      setMood(moodResult);
      setPlaylistUrl(playlist);
    } catch (err) {
      console.error("Error generating playlist:", err);
      alert("Something went wrong! Check the console for more info.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
        {/* Title */}
        <h1 className="text-4xl font-bold mb-4 text-green-600">oto hana</h1>
        <p className="text-gray-600 mb-6">Tell me how you're feeling.</p>

        {/* Login Button */}
        {!authenticated && (
          <button
            onClick={handleLogin}
            className="w-24 h-24 bg-transparent border-none focus:outline-none"
          >
            <img
              src="/flower.png"
              alt="Login with Spotify"
              className="w-full h-full hover:scale-110 transition-transform"
            />
          </button>
        )}

        {authenticated && (
          <>
            <textarea
              value={chat}
              onChange={(e) => setChat(e.target.value)}
              placeholder="Tell me how you're feeling."
              className="w-full h-40 p-3 mb-4 resize-none border-none bg-transparent focus:outline-none"
            ></textarea>

            <button
              onClick={handleSubmit}
              disabled={loading || !chat.trim()}
              className="w-full bg-green-500 text-white py-3 rounded-xl hover:bg-green-600 transition disabled:opacity-50"
            >
              {loading ? "Analyzing your vibe..." : "Generate Playlist 🎶"}
            </button>
          </>
        )}

        {mood && (
          <div className="mt-6 text-center">
            <p className="text-lg text-gray-700">We felt your mood was:</p>
            <p className="text-2xl font-semibold text-green-600 capitalize">
              {mood}
            </p>
          </div>
        )}

        {playlistUrl && (
          <div className="mt-4 text-center">
            <a
              href={playlistUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block mt-2 text-blue-500 hover:underline"
            >
              Lets see your new playlist!
            </a>
          </div>
        )}
      </div>
  );
}
