import SpotifyWebApi from "spotify-web-api-node";
require("dotenv").config();

const spotifyApi = new SpotifyWebApi({
  clientId: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
  redirectUri: process.env.SPOTIFY_REDIRECT_URI,
});

export async function createPlaylistForMood(mood) {
  await spotifyApi.clientCredentialsGrant().then((data) => {
    spotifyApi.setAccessToken(data.body["access_token"]);
  });

  const me = await spotifyApi.getMe();
  const userId = me.body.id;
  const playlist = await spotifyApi.createPlaylist(
    userId,
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
  const tracks = await spotifyApi.searchTracks(`genre:${genre}`, { limit: 10 });
  const uris = tracks.body.tracks.items.map((track) => track.uri);
  await spotifyApi.addTracksToPlaylist(playlist.body.id, uris);
  return playlist.body.external_urls.spotify;
}
