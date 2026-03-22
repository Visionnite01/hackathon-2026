import { useState, useEffect } from 'react'
import './App.css'
import RouteMap from './RouteMap'
//all bugs are happy accidents

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
        localStorage.removeItem("token")  // ✅ clear the stale token
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
    <div className='addressInput'>
      <form onSubmit={handleSubmit} className='flex flex-col gap-2'>
        <label>Start address:</label>
        <input type='text' value={start} onChange={e => setStart(e.target.value)} />

        {start !== '' && (
          <>
            <label className='mt-2'>End address:</label>
            <input type='text' value={end} onChange={e => setEnd(e.target.value)} />
            <button type='submit' className='mt-2'>Get Route</button>
          </>
        )}
      </form>
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
}


function RouteDetails({ route, label }) {
  if (!route) {
    return (
      <div className='route'>
        <h2>{label}</h2>
        <p>No route loaded yet</p>
      </div>
    )
  }

  return (
    <div className='rounded-xl border border-gray-200 bg-white p-6 shadow-sm hover'>
      <h2>{label}</h2>
      <p>Time: {Math.round(route.duration / 60)} mins</p>
      <p>Distance: {(route.distance / 1000).toFixed(2)} km</p>
      <p>Score: {route.score.toFixed(2)}</p>
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
      <button onClick={handleLogout} className='mb-4'>Log out</button>

      <div className='flex gap-4 mb-6'>
        <RouteInput
          setRouteData={setRouteData}
          start={start} setStart={setStart}
          end={end} setEnd={setEnd}
          setLoggedIn={setLoggedIn}
        />
        <RouteDetails route={driving} label="Driving" />
        <RouteDetails route={cycling} label="Cycling" />
        <RouteDetails route={walking} label="Walking" />
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
    <div className='bg-blue-500'>
      <h1>{isRegistering ? "Register" : "Log in"}</h1>

      <form onSubmit={handleSubmit} className='flex flex-col gap-3'>
        <input
          placeholder="Username"
          value={username}
          onChange={e => setUsername(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
        />

        <button type="submit" className = 'bg-red-200 rounded-md w-24 mx-auto'>
          {isRegistering ? "Register" : "Log in"}
        </button>
      </form>

      <div className=''>
        <button onClick={() => setIsRegistering(!isRegistering)} className = 'mx-auto bg-red-200 rounded-md'>
          {isRegistering
            ? "Already have an account? Log in"
            : "No account? Register"}
        </button>
      </div>

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
