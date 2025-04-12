# bitcamp-2025

## Local setup

.env

```
#################################
# Google Gemini API Key
#################################
NEXT_PUBLIC_GEMINI_API_KEY=[INSERT GEMINI API KEY]

#################################
# Spotify API Credentials
#################################
NEXT_PUBLIC_SPOTIFY_CLIENT_ID=[INSERT SPOTIFY CLIENT ID]
NEXT_PUBLIC_SPOTIFY_CLIENT_SECRET=[INSERT SPOTIFY ClIENT SECRET]
NEXT_PUBLIC_SPOTIFY_REDIRECT_URI=[INSERT ngrok LINK]
```

1st terminal:
export environment variables as needed.
`npm i`
`npm run dev`

2nd terminal:

`brew install ngrok`

Sign up for an account: https://dashboard.ngrok.com/signup
Install your authtoken: https://dashboard.ngrok.com/get-started/your-authtoken

`ngrok config add-authtoken [INSERT AUTH TOKEN]`

`ngrok http https://localhost:3000`
