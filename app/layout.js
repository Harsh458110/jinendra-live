import './globals.css'

export const metadata = {
  title: 'Jinendra Enterprises',
  description: 'Your trusted kirana store',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
