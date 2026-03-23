import { useEffect } from 'react'
import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

const profileStyles = {
  "driving-car":     { color: '#ef4444', weight: 5, opacity: 0.8 },
  "cycling-regular": { color: '#e2a713', weight: 5, opacity: 0.8 },
  "foot-walking":    { color: '#22c55e', weight: 5, opacity: 0.8 }
}
//we will need to look at accessibility at some point

function FitBounds({ routes }) {
  const map = useMap()
  useEffect(() => {
    if (!routes?.length) return
    const allCoords = routes.flatMap(route =>
      route.geometry.coordinates.map(([lng, lat]) => [lat, lng])
    )
    map.fitBounds(L.latLngBounds(allCoords), { padding: [20, 20] })
  }, [routes, map])
  return null
}

export default function RouteMap({ routeData, start, end }) {
  return (
    <div style={{
  position: 'relative',
//  border: '8px solid rgba(100,180,100,0.25)',
  borderRadius: 16,
  overflow: 'hidden',
  boxShadow: '10px 10px rgba(100,180,100,0.25)',
  margin: '24px'
}}>
      {(start || end) && (
        <div style={{
          position: 'absolute', top: 10, left: 50,
          zIndex: 1000, background: 'white',
          padding: '0.5rem', borderRadius: '4px'
        }}>
          <p><strong>From:</strong> {start || '—'}</p>
          <p><strong>To:</strong> {end || '—'}</p>
        </div>
      )}
      <MapContainer center={[51.5, -0.1]} zoom={13} style={{ height: '400px', width: '100%' }}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />
        {routeData?.map(route => (
          <GeoJSON
            key={route.profile}
            data={{ type: 'Feature', geometry: route.geometry }}
            style={profileStyles[route.profile] ?? { color: '#6b7280', weight: 5, opacity: 0.8 }}
          />
        ))}
        {routeData?.length > 0 && <FitBounds routes={routeData} />}
      </MapContainer>
    </div>
  )
}