import './globals.css';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'VedaAI',
  description:
    'Upload a question paper and student answer sheet. AI extracts questions and maps each answer to its highlighted region on the answer sheet.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
      </body>
    </html>
  );
}
