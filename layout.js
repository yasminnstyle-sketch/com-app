import "./globals.css";

export const metadata = {
  title: "Compacto — внутренняя система",
  description: "Проекты, снабжение, касса и поставщики Compacto",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}
