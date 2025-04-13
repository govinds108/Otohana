import SpotifyWebApi from "spotify-web-api-node";
import { getSimilarSongs } from "./gemini";
require("dotenv").config();

const spotifyApi = new SpotifyWebApi({
  clientId: process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID,
  clientSecret: process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_SECRET,
  redirectUri: process.env.NEXT_PUBLIC_SPOTIFY_REDIRECT_URI,
});

export function getAuthorizationUrl() {
  const clientId = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID;
  const redirectUri = process.env.NEXT_PUBLIC_SPOTIFY_REDIRECT_URI;
  const scopes = encodeURIComponent(
    "playlist-modify-public playlist-modify-private"
  );
  const state = "some-random-state"; // You can generate this dynamically

  return `https://accounts.spotify.com/authorize?response_type=code&client_id=${clientId}&scope=${scopes}&redirect_uri=${encodeURIComponent(
    redirectUri
  )}&state=${state}`;
}

export async function handleAuthorizationCode(code) {
  const clientId = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_SECRET;
  const redirectUri = process.env.NEXT_PUBLIC_SPOTIFY_REDIRECT_URI;

  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(
        `${clientId}:${clientSecret}`
      ).toString("base64")}`,
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(`Failed to exchange authorization code: ${data.error}`);
  }

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresIn: data.expires_in,
  };
}

export async function createPlaylistWithSpecificSongs(
  mood,
  songs,
  accessToken,
  title,
  description
) {
  if (!accessToken) {
    throw new Error("No access token provided");
  }

  spotifyApi.setAccessToken(accessToken);
  try {
    const finalSongList = await getSimilarSongs(songs);

    const me = await spotifyApi.getMe();

    const uris = [];

    for (const song of finalSongList) {
      const searchResult = await spotifyApi.searchTracks(song, { limit: 1 });
      if (searchResult.body.tracks.items.length > 0) {
        const trackUri = searchResult.body.tracks.items[0].uri;
        uris.push(trackUri);
      } else {
        console.warn(`Song not found on Spotify: ${song}`);
      }
    }

    const playlist = await spotifyApi.createPlaylist(me.body.id, `${title}`, {
      public: true,
      description: `${description}`,
    });

    if (uris.length > 0) {
      spotifyApi.setAccessToken(accessToken);

      await spotifyApi.addTracksToPlaylist(playlist.body.id, uris);
    } else {
      console.warn("No songs found to add.");
    }

    return playlist.body.external_urls.spotify;
  } catch (error) {
    console.error("Failed to create playlist with specific songs:", error);
    throw new Error("Error creating playlist with specific songs");
  }
}
