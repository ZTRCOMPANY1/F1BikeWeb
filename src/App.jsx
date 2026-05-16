import { useEffect, useMemo, useState } from 'react'
import { MapContainer, TileLayer, Polyline, Marker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'

function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)

  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)))
}

export default function App() {
  const [route, setRoute] = useState([])
  const [recording, setRecording] = useState(false)
  const [time, setTime] = useState(0)
  const [speed, setSpeed] = useState(0)
  const [distance, setDistance] = useState(0)
  const [mapStyle, setMapStyle] = useState('default')
  const [sessions, setSessions] = useState([])

  useEffect(() => {
    let watchId
    let timer

    if (recording) {
      timer = setInterval(() => {
        setTime(t => t + 1)
      }, 1000)

      watchId = navigator.geolocation.watchPosition(
        (pos) => {
          const point = [pos.coords.latitude, pos.coords.longitude]

          setSpeed(Math.max(0, (pos.coords.speed || 0) * 3.6))

          setRoute(prev => {
            if (prev.length > 0) {
              const last = prev[prev.length - 1]
              const km = calculateDistance(last[0], last[1], point[0], point[1])
              setDistance(d => d + km)
            }

            return [...prev, point]
          })
        },
        (err) => alert(err.message),
        { enableHighAccuracy: true }
      )
    }

    return () => {
      clearInterval(timer)
      if (watchId) navigator.geolocation.clearWatch(watchId)
    }
  }, [recording])

  const finishRace = () => {
    setRecording(false)

    if (route.length > 0) {
      setSessions(prev => [
        {
          id: Date.now(),
          time,
          distance: distance.toFixed(2),
          avgSpeed: time > 0 ? ((distance / (time / 3600)).toFixed(1)) : 0
        },
        ...prev.slice(0, 4)
      ])
    }
  }

  const center = route.length ? route[route.length - 1] : [-26.3044, -48.8487]

  const mapUrl = useMemo(() => {
    switch (mapStyle) {
      case 'dark':
        return 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
      case 'satellite':
        return 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png'
      default:
        return 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
    }
  }, [mapStyle])

  return (
    <div className="app">
      <div className="hud">
        <h1>F1 BIKE TRACKER</h1>

        <div className="stats-grid">
          <div className="card">
            <span>TIME</span>
            <strong>
              {Math.floor(time / 60).toString().padStart(2,'0')}:
              {(time % 60).toString().padStart(2,'0')}
            </strong>
          </div>

          <div className="card">
            <span>SPEED</span>
            <strong>{speed.toFixed(1)} km/h</strong>
          </div>

          <div className="card">
            <span>DISTANCE</span>
            <strong>{distance.toFixed(2)} km</strong>
          </div>

          <div className="card">
            <span>AVG</span>
            <strong>
              {time > 0 ? (distance / (time / 3600)).toFixed(1) : '0.0'} km/h
            </strong>
          </div>
        </div>

        <div className="controls">
          <select value={mapStyle} onChange={(e) => setMapStyle(e.target.value)}>
            <option value="default">Default Map</option>
            <option value="dark">Dark Mode</option>
            <option value="satellite">Topographic</option>
          </select>

          {!recording ? (
            <button className="start" onClick={() => {
              setRoute([])
              setTime(0)
              setDistance(0)
              setSpeed(0)
              setRecording(true)
            }}>
              START RACE
            </button>
          ) : (
            <button className="stop" onClick={finishRace}>
              FINISH
            </button>
          )}
        </div>

        {sessions.length > 0 && (
          <div className="history">
            <h2>LAST RACES</h2>

            {sessions.map(session => (
              <div className="history-item" key={session.id}>
                <span>{session.distance} km</span>
                <span>{session.avgSpeed} km/h</span>
                <span>{Math.floor(session.time / 60)}m</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <MapContainer center={center} zoom={15} className="map">
        <TileLayer url={mapUrl} />

        {route.length > 0 && (
          <>
            <Polyline positions={route} />

            <Marker position={route[route.length - 1]}>
              <Popup>Current Position</Popup>
            </Marker>
          </>
        )}
      </MapContainer>
    </div>
  )
}
