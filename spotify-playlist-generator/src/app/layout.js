import { Geist, Geist_Mono, Outfit } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const outfitFont = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["400", "700"],
});

export const metadata = {
  title: "otohana",
  description: "spotify playlist generator",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        {/* Add the link to the flower image as the favicon */}
        <link rel="icon" href="/flower.png" type="image/png" />
      </head>
      <body className={`${outfitFont.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
