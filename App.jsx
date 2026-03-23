import { useState, useEffect } from 'react'
import './App.css'
import RouteMap from './RouteMap'
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
//all bugs are happy accidents

//ROUTE INPUT
function RouteInput({ setRouteData, start, setStart, end, setEnd, setLoggedIn }) {
  const [error, setError] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)

    const token = localStorage.getItem("token")    

    if (!token) {
      setError("You must log in first")
      return
    }

    console.log('Submitting route request:', { start, end })
    try {
      const res = await fetch('http://127.0.0.1:5000/route', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ start, end }),
      })
      if (res.status === 401) {
        localStorage.removeItem("token")
        setLoggedIn(false)
        return
      }
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Request failed')
      setRouteData(data.routes)
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div style={{ minWidth: 220 }} className='searchBarArea'>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column' }}>
        <p style={{ fontSize: 10, letterSpacing: '1.2px', textTransform: 'uppercase', color: 'rgba(60,120,60,0.5)', marginBottom: 10 }}>
          Start
        </p>
        <input
          style={{
            background: 'transparent',
            border: 'none',
            borderBottom: '1px solid rgba(100,180,100,0.3)',
            padding: '4px 0',
            color: '#1b5e20',
            fontFamily: 'Georgia, serif',
            fontSize: 18,
            outline: 'none',
            marginBottom: 20,
            width: '100%',
          }}
          type='text'
          value={start}
          onChange={e => setStart(e.target.value)}
          placeholder='e.g. London Bridge'
        />

        <p style={{ fontSize: 10, letterSpacing: '1.2px', textTransform: 'uppercase', color: 'rgba(60,120,60,0.5)', marginBottom: 10 }}>
          End
        </p>
        <input
          style={{
            background: 'transparent',
            border: 'none',
            borderBottom: '1px solid rgba(100,180,100,0.3)',
            padding: '4px 0',
            color: '#1b5e20',
            fontFamily: 'Georgia, serif',
            fontSize: 18,
            outline: 'none',
            marginBottom: 20,
            width: '100%',
          }}
          type='text'
          value={end}
          onChange={e => setEnd(e.target.value)}
          placeholder='e.g. Victoria Station'
        />

        <button type='submit' style={{
          padding: '8px 16px',
          background: 'linear-gradient(135deg, #2e7d32 0%, #43a047 100%)',
          border: 'none',
          borderRadius: 8,
          color: '#e8f5e9',
          fontSize: 13,
          fontWeight: 500,
          cursor: 'pointer',
          boxShadow: '0 4px 14px rgba(46,125,50,0.25)',
          marginTop: 4,
        }}>
          Get Route
        </button>
      </form>
      {error && <p style={{ color: '#c62828', fontSize: 13, marginTop: 10 }}>{error}</p>}
    </div>
  )
}


function RouteDetails({ route, label, onSelect, onConfirm, isSelected }) {
  if (!route) {
    return (
      <div style={{
        flex: 1,
        background: 'rgba(255,255,255,0.7)',
        border: '1px solid rgba(100,180,100,0.25)',
        borderRadius: 16,
        padding: '20px 24px',
        backdropFilter: 'blur(18px)',
        minHeight: 120,
        boxShadow: '10px 10px rgba(100,180,100,0.25)'
      }}>
        <p style={{ fontSize: 10, letterSpacing: '1.2px', textTransform: 'uppercase', color: 'rgba(60,120,60,0.5)', marginBottom: 10 }}>
          {label}
        </p>
        <p style={{ fontFamily: 'Georgia, serif', fontSize: 24, color: 'rgba(60,120,60,0.2)', marginBottom: 2 }}>
          -- mins
        </p>
        <p style={{ fontSize: 12, color: 'rgba(60,120,60,0.3)', marginBottom: 10 }}>
          -- km
        </p>
        <span style={{
          display: 'inline-block',
          padding: '3px 10px',
          background: 'rgba(46,125,50,0.1)',
          border: '1px solid rgba(100,180,100,0.2)',
          borderRadius: 20,
          fontSize: 12,
          color: 'rgba(46,125,50,0.3)',
        }}>
          Score --
        </span>
      </div>
    )
  }

  return (
    <div
      onClick={() => isSelected ? onConfirm() : onSelect(route)}
      style={{
        flex: 1,
        background: 'rgba(255,255,255,0.7)',
        border: isSelected ? '2px solid #2e7d32' : '1px solid rgba(100,180,100,0.25)',
        borderRadius: 16,
        padding: '20px 24px',
        backdropFilter: 'blur(18px)',
        minHeight: 120,
        boxShadow: '10px 10px rgba(100,180,100,0.25)',
        cursor: 'pointer',
      }}
    >
      <p style={{ fontSize: 10, letterSpacing: '1.2px', textTransform: 'uppercase', color: 'rgba(60,120,60,0.5)', marginBottom: 10 }}>
        {label}
      </p>
      <p style={{ fontFamily: 'Georgia, serif', fontSize: 24, color: '#1b5e20', marginBottom: 2 }}>
        {Math.round(route.duration / 60)} mins
      </p>
      <p style={{ fontSize: 12, color: 'rgba(60,120,60,0.6)', marginBottom: 10 }}>
        {(route.distance / 1000).toFixed(2)} km
      </p>
      <span style={{
        display: 'inline-block',
        padding: '3px 10px',
        background: 'rgba(46,125,50,0.1)',
        border: '1px solid rgba(100,180,100,0.2)',
        borderRadius: 20,
        fontSize: 12,
        color: '#2e7d32',
      }}>
        Score {route.score.toFixed(2)}
      </span>
      {isSelected && (
        <p style={{ marginTop: 10, fontSize: 12, color: '#2e7d32', fontWeight: 600 }}>
          ✓ Click again to confirm
        </p>
      )}
    </div>
  )
}

function Leaderboard() {
  const [leaders, setLeaders] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function fetchLeaderboard() {
      try {
        const res = await fetch('http://127.0.0.1:5000/leaderboard')
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Failed to fetch leaderboard')
        setLeaders(data)
      } catch (err) {
        setError(err.message)
      }
    }
    fetchLeaderboard()
  }, [])

  if (error) return <p style={{ color: 'red' }}>{error}</p>
  if (!leaders) return <p>Loading leaderboard...</p>

  return (
    <div style={{ padding: '32px 48px' }}>
      <p style={{
        fontFamily: 'Georgia, serif',
        fontSize: 22,
        color: '#1b5e20',
        fontWeight: 400,
        letterSpacing: '0.5px',
        marginBottom: 24
      }}>
        Leader<span style={{ color: 'rgba(60,120,60,0.5)' }}>board</span>
      </p>

      <div style={{
        background: 'rgba(255,255,255,0.7)',
        border: '1px solid rgba(100,180,100,0.25)',
        borderRadius: 16,
        backdropFilter: 'blur(18px)',
        boxShadow: '10px 10px rgba(100,180,100,0.25)',
        overflow: 'hidden',
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(100,180,100,0.2)' }}>
              <th style={{ fontFamily: 'Georgia, serif', color: 'rgba(60,120,60,0.5)', fontWeight: 400, fontSize: 10, letterSpacing: '1.2px', textTransform: 'uppercase', padding: '16px 24px', textAlign: 'left' }}>Rank</th>
              <th style={{ fontFamily: 'Georgia, serif', color: 'rgba(60,120,60,0.5)', fontWeight: 400, fontSize: 10, letterSpacing: '1.2px', textTransform: 'uppercase', padding: '16px 24px', textAlign: 'left' }}>Username</th>
              <th style={{ fontFamily: 'Georgia, serif', color: 'rgba(60,120,60,0.5)', fontWeight: 400, fontSize: 10, letterSpacing: '1.2px', textTransform: 'uppercase', padding: '16px 24px', textAlign: 'left' }}>Score</th>
            </tr>
          </thead>
          <tbody>
            {leaders.map((entry, index) => (
              <tr key={entry.username} style={{ borderBottom: '1px solid rgba(100,180,100,0.1)' }}>
                <td style={{ fontFamily: 'Georgia, serif', color: 'rgba(60,120,60,0.4)', fontSize: 14, padding: '14px 24px' }}>{index + 1}</td>
                <td style={{ fontFamily: 'Georgia, serif', color: '#1b5e20', fontSize: 18, padding: '14px 24px' }}>{entry.username}</td>
                <td style={{ padding: '14px 24px' }}>
                  <span style={{
                    display: 'inline-block',
                    padding: '3px 10px',
                    background: 'rgba(46,125,50,0.1)',
                    border: '1px solid rgba(100,180,100,0.2)',
                    borderRadius: 20,
                    fontSize: 12,
                    color: '#2e7d32',
                    fontFamily: 'Georgia, serif',
                  }}>
                    {entry.score.toFixed(2)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function Home() {
  return (
    <h1>Testings</h1>
  )
}

//MAIN PAGE
function MainPage({ setLoggedIn }) {
  const [routeData, setRouteData] = useState(null)
  const [start, setStart] = useState('')
  const [end, setEnd] = useState('')

  const driving = routeData?.find(r => r.profile === "driving-car")
  const cycling = routeData?.find(r => r.profile === "cycling-regular")
  const walking = routeData?.find(r => r.profile === "foot-walking")

  function handleLogout() {
    localStorage.removeItem("token")
    setLoggedIn(false)
  }

  const [selectedRoute, setSelectedRoute] = useState(null)
  const [savedScore, setSavedScore] = useState(null)

  async function handleConfirmRoute() {
    const token = localStorage.getItem("token")
    const res = await fetch('http://127.0.0.1:5000/select-route', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ score: selectedRoute.score })
    })
    const data = await res.json()
    setSavedScore(data.user_score)
    setSelectedRoute(null)
  }

  useEffect(() => { setSelectedRoute(null); setSavedScore(null) }, [routeData])

  return (
    <div className='mainPage' style={{ paddingBottom: 8 }}>
      <BrowserRouter>
        <nav style={{
          display: 'flex',
          flexDirection: 'row-reverse',
          alignItems: 'center',
          background: 'rgba(100,180,100,0.15)',
          borderBottom: '1px solid rgba(100,180,100,0.25)',
          backdropFilter: 'blur(10px)',
          padding: '12px 48px',
          gap: 8,
        }}>
          <button onClick={handleLogout} style={{
            fontFamily: 'Georgia, serif',
            color: '#1b5e20',
            fontSize: 14,
            background: 'none',
            border: '1px solid rgba(100,180,100,0.3)',
            borderRadius: 20,
            cursor: 'pointer',
            padding: '6px 16px',
            letterSpacing: '0.5px',
          }}>Log out</button>
          <Link to="/leaderboard" style={{
            fontFamily: 'Georgia, serif',
            color: '#1b5e20',
            fontSize: 14,
            textDecoration: 'none',
            padding: '6px 16px',
            letterSpacing: '0.5px',
          }}>Leaderboard</Link>
          <Link to="/" style={{
            fontFamily: 'Georgia, serif',
            color: '#1b5e20',
            fontSize: 14,
            textDecoration: 'none',
            padding: '6px 16px',
            letterSpacing: '0.5px',
          }}>Home</Link>

          <span style={{
            marginRight: 'auto',
            fontFamily: 'Georgia, serif',
            fontSize: 22,
            color: '#1b5e20',
            fontWeight: 400,
            letterSpacing: '0.5px',
          }}>
            Green<span style={{ color: 'rgba(60,120,60,0.5)' }}>Route</span>
          </span>
        </nav>

        <Routes>
          <Route path="/" element={
            <>
              <div className='introductionElement'>
                <p style={{ fontFamily: 'Georgia, serif', fontSize: 14, color: 'rgba(10, 70, 10, 0.6)', letterSpacing: '0.5px' }}>
                  The one-stop approach to make your community travel greener. Get competitive and do your best to take care of our planet. 🌿
                </p>
              </div>

              <div className='flex gap-4 mb-6'>
                <RouteInput setRouteData={setRouteData} start={start} setStart={setStart} end={end} setEnd={setEnd} setLoggedIn={setLoggedIn}/>

                <div style={{ position: 'relative', display: 'flex', gap: 16, margin: '8px 24px 4px 8px', flex: 1 }}>
                  <RouteDetails route={driving}  label="Driving"  onSelect={setSelectedRoute} onConfirm={handleConfirmRoute} isSelected={selectedRoute?.profile === 'driving-car'} />
                  <RouteDetails route={cycling}  label="Cycling"  onSelect={setSelectedRoute} onConfirm={handleConfirmRoute} isSelected={selectedRoute?.profile === 'cycling-regular'} />
                  <RouteDetails route={walking}  label="Walking"  onSelect={setSelectedRoute} onConfirm={handleConfirmRoute} isSelected={selectedRoute?.profile === 'foot-walking'} />

                  {savedScore && (
                    <div style={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      background: 'rgba(232, 245, 233, 0.95)',
                      backdropFilter: 'blur(8px)',
                      borderRadius: 20,
                      border: '1px solid rgba(100,180,100,0.4)',
                      boxShadow: '0 8px 32px rgba(46,125,50,0.2)',
                      padding: '16px 40px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      zIndex: 10,
                      whiteSpace: 'nowrap',
                    }}>
                      <span style={{ fontSize: 24 }}>🌿</span>
                      <p style={{ color: '#2e7d32', fontWeight: 700, fontSize: 16, margin: 0, fontFamily: 'Georgia, serif' }}>Route confirmed!</p>
                      <p style={{ color: '#388e3c', fontSize: 14, margin: 0, fontFamily: 'Georgia, serif' }}>Your average score: {savedScore.toFixed(2)}</p>
                      <button
                        onClick={() => { setSavedScore(null); setRouteData(null); setStart(''); setEnd('') }}
                        style={{
                          fontFamily: 'Georgia, serif',
                          color: '#1b5e20',
                          fontSize: 13,
                          background: 'none',
                          border: '1px solid rgba(100,180,100,0.3)',
                          borderRadius: 20,
                          cursor: 'pointer',
                          padding: '4px 14px',
                          letterSpacing: '0.5px',
                          marginLeft: 8,
                        }}
                      >
                        Clear
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <RouteMap routeData={routeData} start={start} end={end} />
              </div>
            </>
          } />

          <Route path="/leaderboard" element={<Leaderboard />} />
        </Routes>
      </BrowserRouter>
    </div>
  )
}


//LOG IN PAGE
function LogInPage({ setLoggedIn }) {
  const [isRegistering, setIsRegistering] = useState(false)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const endpoint = isRegistering ? "register" : "login"

    try {
      const res = await fetch(`http://127.0.0.1:5000/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Request failed')

      if (isRegistering) {
        const loginRes = await fetch(`http://127.0.0.1:5000/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password })
        })
        const loginData = await loginRes.json()
        if (!loginRes.ok) throw new Error(loginData.error || 'Login failed')
        localStorage.setItem("token", loginData.token)
      } else {
        localStorage.setItem("token", data.token)
      }

      setLoggedIn(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="eco-page">
        <div className="eco-card">
          <div className="eco-logo">
            <div className="eco-logo-icon">🌿</div>
            <span className="eco-logo-text">GreenRoute</span>
          </div>

          <h1 className="eco-heading">
            {isRegistering ? "Join the movement" : "Welcome back"}
          </h1>
          <p className="eco-subheading">
            {isRegistering ? "Track your eco-friendly travel choices" : "Continue your sustainable journey"}
          </p>

          <form onSubmit={handleSubmit}>
            <div className="eco-field">
              <label className="eco-label">Username</label>
              <input
                className="eco-input"
                placeholder="e.g. greenrider42"
                value={username}
                onChange={e => setUsername(e.target.value)}
                autoComplete="username"
              />
            </div>

            <div className="eco-field">
              <label className="eco-label">Password</label>
              <input
                className="eco-input"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoComplete={isRegistering ? "new-password" : "current-password"}
              />
            </div>

            <button type="submit" className="eco-btn-primary" disabled={loading}>
              {loading ? "..." : isRegistering ? "Create account" : "Sign in"}
            </button>
          </form>

          <div className="eco-divider">
            <div className="eco-divider-line" />
            <span className="eco-divider-text">or</span>
            <div className="eco-divider-line" />
          </div>

          <button className="eco-btn-secondary" onClick={() => { setIsRegistering(!isRegistering); setError(null) }}>
            {isRegistering ? "Already have an account? Sign in" : "No account? Register"}
          </button>

          {error && <div className="eco-error">{error}</div>}

          <div className="eco-footer">
            <div className="eco-leaf-row">🌱 🌍 🚲</div>
            Travel greener, score higher
          </div>
        </div>
      </div>
    </>
  )
}

function App() {
  const [loggedIn, setLoggedIn] = useState(
    !!localStorage.getItem("token")
  )
  return (
    <>
      {loggedIn ? (
        <MainPage setLoggedIn={setLoggedIn} />
      ) : (
        <LogInPage setLoggedIn={setLoggedIn} />
      )}
    </>
  )
}

export default App