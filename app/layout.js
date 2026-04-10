import './globals.css'
import { Inter } from 'next/font/google'
import WelcomeMessage from './components/WelcomeMessage'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Reborn Art AI',
  description: 'Където изкуственият интелект създава музика, видео и анимация',
}

export default function RootLayout({ children }) {
  return (
    <html lang="bg">
      <body className={inter.className}>{children}
        <WelcomeMessage />
      </body>
    </html>
  )
}