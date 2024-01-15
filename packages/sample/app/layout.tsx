import ConnectProvider from '@/components/connectProvider';
import UIProvider from '@/components/uiProvider';
import '@/styles/globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'BTC Connect',
  description: 'First Account Abstraction Protocol on Bitcoin',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <UIProvider>
          <ConnectProvider>{children}</ConnectProvider>
        </UIProvider>
        <ToastContainer autoClose={4000} hideProgressBar={true} position="top-center" theme="colored" />
      </body>
    </html>
  );
}
