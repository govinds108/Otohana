"use client";

import { useState, useEffect } from "react";
import { getMoodFromConversation, getSongsFromPrompt } from "../utils/gemini";
import {
  getAuthorizationUrl,
  handleAuthorizationCode,
  createPlaylistWithSpecificSongs,
} from "../utils/spotify";
import { useSwipeable } from "react-swipeable";

export default function App() {
  const [chat, setChat] = useState("");
  const [playlistUrl, setPlaylistUrl] = useState(null);
  const [mood, setMood] = useState(null);
  const [loading, setLoading] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [songs, setSongs] = useState([]);
  const [selectedSongs, setSelectedSongs] = useState([]);
  const [currentSongIndex, setCurrentSongIndex] = useState(0);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get("code");

    if (code) {
      handleAuthorizationCode(code)
        .then(({ accessToken }) => {
          localStorage.setItem("spotify_access_token", accessToken);
          setAuthenticated(true);
          window.history.replaceState({}, document.title, "/");
        })
        .catch((err) => {
          console.error("Error handling authorization code:", err);
          alert("Failed to authenticate with Spotify. Please try again.");
        });
    }
  }, []);

  const handleLogin = () => {
    const authUrl = getAuthorizationUrl();
    window.location.href = authUrl;
  };

  const handleSubmit = async () => {
    if (!authenticated) {
      alert("Please log in to Spotify first.");
      return;
    }

    setLoading(true);
    setPlaylistUrl(null);
    setMood(null);
    setSongs([]);
    setSelectedSongs([]);
    setCurrentSongIndex(0);

    try {
      const moodResult = await getMoodFromConversation(chat);
      const fetchedSongs = await getSongsFromPrompt(moodResult);
      setMood(moodResult);
      setSongs(fetchedSongs);
    } catch (err) {
      console.error("Error generating playlist:", err);
      alert("Something went wrong! Check the console for more info.");
    } finally {
      setLoading(false);
    }
  };

  const handleSwipe = (direction) => {
    const currentSong = songs[currentSongIndex];
    if (direction === "right") {
      setSelectedSongs((prev) => [...prev, currentSong]);
    }
    setCurrentSongIndex((prev) => prev + 1);
  };

  const handleCreatePlaylist = async () => {
    if (selectedSongs.length === 0) {
      alert("No songs selected for the playlist.");
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("spotify_access_token");
      const playlist = await createPlaylistWithSpecificSongs(
        mood,
        selectedSongs,
        token
      );
      setPlaylistUrl(playlist);
    } catch (err) {
      console.error("Error creating playlist:", err);
      alert("Something went wrong! Check the console for more info.");
    } finally {
      setLoading(false);
    }
  };

  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => handleSwipe("left"),
    onSwipedRight: () => handleSwipe("right"),
    preventDefaultTouchmoveEvent: true,
    trackMouse: true,
  });

  return (
    <div className="v16_34">
        {/* Title */}
        <span className="v21_42">oto hana.</span>
        <span className="v21_44">a spotify playlist generator</span>

        {/* Login Button */}
        {!authenticated && (
          <div className="v24_6">
            <button
              onClick={handleLogin}
              className="w-full h-full bg-transparent border-none focus:outline-none"
            >
              <img
                src="/flower.png"
                alt="Login with Spotify"
                className="w-full h-full hover:scale-110 transition-transform"
              />
            </button>
          </div>
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

        {songs.length > 0 && currentSongIndex < songs.length && (
          <div
            {...swipeHandlers}
            className="mt-6 bg-gray-200 p-6 rounded-lg shadow-lg text-center"
          >
            <p className="text-lg text-gray-700">Swipe to decide:</p>
            <p className="text-xl font-semibold text-green-600">
              {songs[currentSongIndex]}
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Swipe right to add, left to skip.
            </p>
          </div>
        )}

        {currentSongIndex >= songs.length && songs.length > 0 && (
          <div className="mt-6 text-center">
            <p className="text-lg text-gray-700">
              You've swiped through all the songs!
            </p>
            <button
              onClick={handleCreatePlaylist}
              className="w-full bg-green-500 text-white py-3 rounded-xl hover:bg-green-600 transition"
            >
              Create Playlist 🎶
            </button>
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
