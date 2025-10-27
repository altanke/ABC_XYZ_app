import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { UserProvider } from "@/context/UserContext";

export const metadata = {
  title: "Attire | Магазин одежды",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <UserProvider>
          <main>{children}</main>
          <Toaster />
        </UserProvider>
      </body>
    </html>
  );
}
