"use client";

import { useState, useEffect } from "react";
import {
  getMoodFromConversation,
  getPlayListDescription,
  getPlaylistTitleFromPrompt,
  getSongsFromPrompt,
  getSongDescription,
} from "../utils/gemini";
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
  const [title, setTitle] = useState(null);
  const [description, setDescription] = useState(null);
  const [loading, setLoading] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [songs, setSongs] = useState([]);
  const [selectedSongs, setSelectedSongs] = useState([]);
  const [currentSongIndex, setCurrentSongIndex] = useState(0);
  const [songDescription, setSongDescription] = useState("");
  const [isSongDataReady, setIsSongDataReady] = useState(false);

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

  useEffect(() => {
    const fetchSongData = async () => {
      if (currentSongIndex < songs.length) {
        try {
          const currentSong = songs[currentSongIndex];
          const description = await getSongDescription(mood, currentSong);
          setSongDescription(description);
          setIsSongDataReady(true);
        } catch (err) {
          console.error("Error fetching song description:", err);
          setSongDescription("Unable to fetch song description.");
          setIsSongDataReady(false);
        }
      } else {
        setIsSongDataReady(false);
      }
    };

    setIsSongDataReady(false);
    fetchSongData();
  }, [currentSongIndex, mood, songs]);

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
      const fetchedSongs = await getSongsFromPrompt(chat, moodResult);
      const playListTitle = await getPlaylistTitleFromPrompt(chat);
      const playListDesc = await getPlayListDescription(chat, playListTitle);
      setMood(moodResult);
      setSongs(fetchedSongs);
      setTitle(playListTitle);
      setDescription(playListDesc);
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
        token,
        title,
        description
      );
      setPlaylistUrl(playlist);
    } catch (err) {
      console.error("Error creating playlist:", err);
      alert("Something went wrong! Check the console for more info.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddSong = () => {
    if (currentSongIndex < songs.length) {
      const currentSong = songs[currentSongIndex];
      setSelectedSongs((prev) => [...prev, currentSong]);
      setCurrentSongIndex((prev) => prev + 1);
    }
  };

  const handleSkipSong = () => {
    if (currentSongIndex < songs.length) {
      setCurrentSongIndex((prev) => prev + 1);
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
      {!authenticated && (
        <>
          <span className="v21_42">oto hana.</span>
          <span className="v21_44">a spotify playlist generator</span>
        </>
      )}

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
        <div className="flex flex-col items-center justify-center pt-5">
          <img src="/flower.png" alt="Flower" className="w-90 h-90 mb-8" />

          <div className="w-[1200px] px-4 -mt-15 flex flex-col items-center relative">
            <textarea
              value={chat}
              onChange={(e) => setChat(e.target.value)}
              placeholder="tell me how you're feeling."
              className="w-full h-[130px] text-left text-[#FD93AA] placeholder-[#FD93AA] placeholder-opacity-20 text-[24px] font-normal font-[Outfit] bg-transparent border-[3px] border-[#FD93AA] rounded-xl px-8 py-2 pr-12 focus:outline-none resize-none overflow-y-auto"
              style={{
                boxShadow: "none",
                lineHeight: "1.5",
              }}
            ></textarea>

            <button
              onClick={handleSubmit}
              disabled={loading || !chat.trim()}
              className="absolute right-6 bottom-2 font-semibold text-[#FD93AA] w-12 h-12 rounded-full transition disabled:opacity-50 flex items-center justify-center"
            >
              <span className="text-3xl leading-none transition hover:text-[#FF6B8B]">
                &gt;
              </span>
            </button>
          </div>
        </div>
      )}

      {mood && (
        <div className="mt-6 text-center">
          <p className="text-lg text-[#FF6B8B] font-[Outfit]">
            We felt your mood was:
          </p>
          <p className="text-2xl font-semibold text-[#FF6B8B] capitalize font-[Outfit]">
            {mood}
          </p>
        </div>
      )}

      {songs.length > 0 &&
        currentSongIndex < songs.length &&
        isSongDataReady && (
          <div className="mt-6 p-6 rounded-lg text-center flex items-center justify-center w-[600px] mx-auto bg-[#FD93AA] border-4 border-[#FD93AA]">
            <button
              onClick={handleSkipSong}
              className="bg-white text-[#FD93AA] w-12 h-12 rounded-full hover:bg-gray-200 transition text-2xl flex items-center justify-center font-[Outfit]"
            >
              <span className="font-bold font-[Outfit]">-</span>
            </button>

            <div className="flex-1 text-center px-4 font-[Outfit]">
              <p className="text-lg text-white font-[Outfit]">
                Do you want to add this song?
              </p>
              <p className="text-xl font-semibold text-white font-[Outfit]">
                {songs[currentSongIndex]}
              </p>
              <p className="text-sm text-white mt-2 font-[Outfit]">
                {songDescription}
              </p>
            </div>

            <button
              onClick={handleAddSong}
              className="bg-white text-[#FD93AA] w-12 h-12 rounded-full hover:bg-gray-200 transition text-2xl flex items-center justify-center font-[Outfit]"
            >
              <span className="font-bold font-[Outfit]">+</span>
            </button>
          </div>
        )}

      {currentSongIndex >= songs.length && songs.length > 0 && (
        <div className="flex justify-center font-[Outfit]">
          <div className="w-[1200px] flex flex-col items-center justify-center mt-6 px-4 font-[Outfit]">
            <p className="text-lg text-[#FF6B8B] font-[Outfit]">
              You've swiped through all the songs!
            </p>
            <button
              onClick={handleCreatePlaylist}
              className="w-full bg-[#FD93AA] text-white py-3 rounded-xl hover:bg-[#FF6B8B] transition text-2xl disabled:opacity-50 font-[Outfit]"
            >
              Create Playlist
            </button>
          </div>
        </div>
      )}

      {playlistUrl && (
        <div className="mt-4 text-center font-[Outfit]">
          <a
            href={playlistUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block mt-2 text-[#FD93AA] text-2xl font-semibold hover:text-[#FF6B8B] transition font-[Outfit]"
          >
            Lets see your new playlist!
          </a>
        </div>
      )}
    </div>
  );
}
