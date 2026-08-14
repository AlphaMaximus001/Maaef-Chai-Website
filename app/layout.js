export const metadata = {
  metadataBase: new URL("https://maaef-chai-website.vercel.app"),
  title: "Nau Tapri — nine chai stalls, Lucknow",
  description:
    "chai lagao, gaane suno. Nine real Lucknow chai tapris, painted, with a 90s Bollywood playlist running underneath. By Maaef Media House.",
  openGraph: {
    title: "Nau Tapri — nine chai stalls, Lucknow",
    description: "chai lagao, gaane suno.",
    images: ["/tapris/ashfaq-day.jpeg"],
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0 }}>{children}</body>
    </html>
  );
}
