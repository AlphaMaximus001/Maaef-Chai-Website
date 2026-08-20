import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

export const metadata = {
  metadataBase: new URL("https://maaef-chai-website.vercel.app"),
  title: "Afterhours Tapri — nine chai stalls, Lucknow",
  description:
    "chai lagao, gaane suno. Nine real Lucknow chai tapris, painted, with a 90s Bollywood playlist running underneath. By Maaef Media House.",
  openGraph: {
    title: "Afterhours Tapri — nine chai stalls, Lucknow",
    description: "chai lagao, gaane suno.",
    images: ["/tapris/ashfaq-day.jpeg"],
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0 }}>
        {children}
        {/* both only load their script when served from Vercel; off-platform
            and in local dev they render nothing */}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
