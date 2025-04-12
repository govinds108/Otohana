import SpotifyWebApi from "spotify-web-api-node";
require("dotenv").config();

console.log(process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID);
console.log(process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_SECRET);
console.log(process.env.NEXT_PUBLIC_SPOTIFY_REDIRECT_URI);

const spotifyApi = new SpotifyWebApi({
  clientId: process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID,
  clientSecret: process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_SECRET,
  redirectUri: process.env.NEXT_PUBLIC_SPOTIFY_REDIRECT_URI,
});

// console.log("Spotify API Instance:", spotifyApi);
// console.log(
//   "createAuthorizeURL exists:",
//   typeof spotifyApi.createAuthorizeURL === "function"
// );

// SpotifyWebApi._addMethods(spotifyApi);
// export function getAuthorizationUrl() {
//   const scopes = ["playlist-modify-public", "playlist-modify-private"];
//   const state = "some-random-state"; // You can generate this dynamically
//   return spotifyApi.createAuthorizeURL(scopes, state);
// }
console.log("Spotify API Instance Methods:", Object.keys(spotifyApi));

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
      Authorization: `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
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

  spotifyApi.setAccessToken(data.access_token);
  spotifyApi.setRefreshToken(data.refresh_token);
}

// export async function handleAuthorizationCode(code) {
//   const data = await spotifyApi.authorizationCodeGrant(code);
//   spotifyApi.setAccessToken(data.body["access_token"]);
//   spotifyApi.setRefreshToken(data.body["refresh_token"]);
// }

export async function createPlaylistForMood(mood) {
  console.log("Access Token:", spotifyApi.getAccessToken());

  const me = await spotifyApi.getMe();
  console.log("User Info:", me.body);

  const playlist = await spotifyApi.createPlaylist(
    `${mood.charAt(0).toUpperCase() + mood.slice(1)} Vibes`,
    { public: true }
  );

  const moodToGenre = {
    happy: "pop",
    sad: "acoustic",
    angry: "metal",
    chill: "lo-fi",
    energetic: "edm",
  };

  const genre = moodToGenre[mood] || "pop";
  const tracks = await spotifyApi.searchTracks(`genre:${genre}`, { limit: 10 }); // Opportunity to fine tune using ML

  const uris = tracks.body.tracks.items.map((track) => track.uri);
  await spotifyApi.addTracksToPlaylist(playlist.body.id, uris);

  return playlist.body.external_urls.spotify;
}
