import { useState, useEffect } from 'react'
import './App.css'
import RouteMap from './RouteMap'
//all bugs are happy accidents

function RouteInput({ setRouteData, start, setStart, end, setEnd }) {
  const [error, setError] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)

    const token = localStorage.getItem("token")    
    console.log("TOKEN:", token)

    if (!token) {
      setError("You must log in first")
      return
    }

    console.log('Submitting route request:', { start, end })
    try {
      console.log('Sending fetch to /route...')
      const res = await fetch('http://127.0.0.1:5000/route', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ start, end }),
        //needs to sort out verification/login stuff, removed for compatability test
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Request failed')
      setRouteData(data.routes)
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className='addressInput'>
      <form onSubmit={handleSubmit}>
        <label>Start address:</label><br/>
        <input type='text' value={start} onChange={e => setStart(e.target.value)} /><br/>

        {start !== '' && (
          <>
            <label>End address:</label><br/>
            <input type='text' value={end} onChange={e => setEnd(e.target.value)} /><br/>
            <button type='submit'>Get Route</button>
          </>
        )}

      </form>
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
}

function RouteDetails({ routeData }) {
  if (!routeData) {
    return (
      <div className='route'>
        <h1>Route breakdown</h1>
        <p>No route loaded yet</p>
      </div>
    )
  }

  const profileLabels = {
    "driving-car": "Driving",
    "cycling-regular": "Cycling",
    "foot-walking": "Walking"
  }

  return (
    <div className='route'>
      <h1>Route breakdown</h1>
      {routeData.map(route => (
        <div key={route.profile} className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2>{profileLabels[route.profile] || route.profile}</h2>
          <p>Time: {Math.round(route.duration / 60)} mins</p>
          <p>Distance: {(route.distance / 1000).toFixed(2)} km</p>
          <p>Emissions: {route.emissions.toFixed(3)} kg CO₂</p>
          <p>Score: {route.score.toFixed(2)}</p>
        </div>
      ))}
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
    <div className='leaderboard'>
      <h1>Leaderboard</h1>
      <table>
        <thead>
          <tr>
            <th>Rank</th>
            <th>Username</th>
            <th>Score</th>
          </tr>
        </thead>
        <tbody>
          {leaders.map((entry, index) => (
            <tr key={entry.username}>
              <td>{index + 1}</td>
              <td>{entry.username}</td>
              <td>{entry.score.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

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

  return (
    <>
      <button onClick={handleLogout}>Log out</button>

      <div style={{ display: 'flex', gap: '1rem' }}>
        <RouteInput
          setRouteData={setRouteData}
          start={start} setStart={setStart}
          end={end} setEnd={setEnd}
        />
        <RouteDetails route={driving} label="🚗 Driving" />
        <RouteDetails route={cycling} label="🚲 Cycling" />
        <RouteDetails route={walking} label="🚶 Walking" />
      </div>

      <RouteMap routeData={routeData} start={start} end={end} />
      <Leaderboard />
    </>
  )
}

function LogInPage({ setLoggedIn }) {
  const [isRegistering, setIsRegistering] = useState(false)

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)

    const endpoint = isRegistering ? "register" : "login"

    try {
      const res = await fetch(`http://127.0.0.1:5000/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      })

      const data = await res.json()

      if (!res.ok) throw new Error(data.error || 'Request failed')

      // ✅ If registering, immediately log in
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
    }
  }

  return (
    <div className='logInPage'>
      <h1>{isRegistering ? "Register" : "Log in"}</h1>

      <form onSubmit={handleSubmit}>
        <input
          placeholder="Username"
          value={username}
          onChange={e => setUsername(e.target.value)}
        /><br/>

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
        /><br/>

        <button type="submit">
          {isRegistering ? "Register" : "Log in"}
        </button>
      </form>

      <br/>

      <button onClick={() => setIsRegistering(!isRegistering)}>
        {isRegistering
          ? "Already have an account? Log in"
          : "No account? Register"}
      </button>

      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  )
}

function App() {

const [loggedIn, setLoggedIn] = useState(
  !!localStorage.getItem("token")
)
  return (
    <>
    {loggedIn? (
      <MainPage setLoggedIn={setLoggedIn} />

    ) : (
      <LogInPage setLoggedIn={setLoggedIn} />
    )}
    </>
  );
}

export default App
