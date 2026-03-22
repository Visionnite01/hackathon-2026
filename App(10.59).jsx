import { useState } from 'react'
import './App.css'

function RouteInput() {
  const [start, setStart] = useState('')
  const [end, setEnd] = useState('')
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setResult(null)
    try {
      const res = await fetch('http://localhost:5000/api/route', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ start, end }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Request failed')
      setResult(data)
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className='addressInput'>
      <form onSubmit={handleSubmit}>
        <label>Start address:</label><br/>
        <input type='text' value={start} onChange={e => setStart(e.target.value)} /><br/>
        <label>End address:</label><br/>
        <input type='text' value={end} onChange={e => setEnd(e.target.value)} /><br/>
        <button type='submit'>Get Route</button>
      </form>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {result && <pre>{JSON.stringify(result, null, 2)}</pre>}
    </div>
  )
}

function RouteDetails() {

  const [time, setTime] = useState(0)
  const [distance, setDistance] = useState(0)
  const [score, setRouteScore] = useState(0)

  return (
    <div class='route'>
      <h1>Route breakdown</h1>
      <h2 id='routeTime'>Time: {time}</h2>
      <h2 id='routeDistance'>Distance: {distance}</h2>
      <h2 id='routeScore'>Score: {score}</h2>
    </div>
  );
}

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <RouteInput />
      <RouteDetails />
    </>
  )
}

export default App
