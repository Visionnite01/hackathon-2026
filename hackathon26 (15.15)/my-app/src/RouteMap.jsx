import { useEffect } from 'react'
import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

function FitBounds({ geometry }) {
  const map = useMap()
  useEffect(() => {
    if (!geometry) return
    const coords = geometry.coordinates.map(([lng, lat]) => [lat, lng])
    map.fitBounds(L.latLngBounds(coords), { padding: [40, 40] })
  }, [geometry, map])
  return null
}

export default function RouteMap({ routeData }) {
  return (
    <MapContainer center={[51.5, -0.1]} zoom={13} style={{ height: '400px', width: '100%' }}>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      />
      {routeData?.geometry && (
        <>
          <GeoJSON
            key={JSON.stringify(routeData.geometry)}
            data={{ type: 'Feature', geometry: routeData.geometry }}
            style={{ color: '#22c55e', weight: 5, opacity: 0.8 }}
          />
          <FitBounds geometry={routeData.geometry} />
        </>
      )}
    </MapContainer>
  )
}
