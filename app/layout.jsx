import './globals.css';

export const metadata = {
  title: 'fullstacketh3D',
  description: 'A full-stack Ethereum dApp with an interactive 3D interface.',
};

/**
 * Root layout — wraps every route.
 * @param {{ children: React.ReactNode }} props
 */
export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
