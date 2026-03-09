import "./globals.css";

export const metadata = {
  title: "InfiLove E-Coupon",
  description: "E-Coupon System for Charity Bazaar",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
