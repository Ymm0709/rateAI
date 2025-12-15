import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { useEffect, useState } from 'react'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import AIDetail from './pages/AIDetail'
import Rankings from './pages/Rankings'
import Profile from './pages/Profile'
import Login from './pages/Login'
import Register from './pages/Register'
import { AppProvider } from './context/AppContext'
import './App.css'

function App() {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('rateAI_theme') || 'light'
  })

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('rateAI_theme', theme)
  }, [theme])

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'))
  }

  return (
    <AppProvider>
      <Router>
        <div className="app">
          <Navbar theme={theme} onToggleTheme={toggleTheme} />
          <main className="main-content">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/ai/:id" element={<AIDetail />} />
              <Route path="/rankings" element={<Rankings />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
            </Routes>
          </main>
        </div>
      </Router>
    </AppProvider>
  )
}

export default App

