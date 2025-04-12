import SpotifyWebApi from "spotify-web-api-node";
import { getSimilarSongs } from "./gemini";

console.log(process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID);
console.log(process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_SECRET);
console.log(process.env.NEXT_PUBLIC_SPOTIFY_REDIRECT_URI);

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
  accessToken
) {
  if (!accessToken) {
    throw new Error("No access token provided");
  }

  spotifyApi.setAccessToken(accessToken);
  try {
    const finalSongList = await getSimilarSongs(songs);
    console.log("Final Song List:", finalSongList);

    const me = await spotifyApi.getMe();
    console.log("User Info:", me.body);

    const uris = [];

    console.log("songs", finalSongList);

    for (const song of finalSongList) {
      //   spotifyApi.setAccessToken(accessToken);

      const searchResult = await spotifyApi.searchTracks(song, { limit: 1 });
      if (searchResult.body.tracks.items.length > 0) {
        const trackUri = searchResult.body.tracks.items[0].uri;
        uris.push(trackUri);
      } else {
        console.warn(`Song not found on Spotify: ${song}`);
      }
    }
    // spotifyApi.setAccessToken(accessToken);

    const playlist = await spotifyApi.createPlaylist(
      me.body.id,
      `${mood.charAt(0).toUpperCase() + mood.slice(1)} Vibes`,
      {
        public: true,
      }
    );

    console.log(`Created playlist: ${playlist.body.name}`);

    console.log("uris", uris);
    if (uris.length > 0) {
      spotifyApi.setAccessToken(accessToken);

      await spotifyApi.addTracksToPlaylist(playlist.body.id, uris);
      console.log(`Added ${uris.length} songs to playlist`);
    } else {
      console.warn("No songs found to add.");
    }

    return playlist.body.external_urls.spotify;
  } catch (error) {
    console.error("Failed to create playlist with specific songs:", error);
    throw new Error("Error creating playlist with specific songs");
  }
}
