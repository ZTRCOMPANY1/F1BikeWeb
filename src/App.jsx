import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Polyline } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'

export default function App() {
  const [route, setRoute] = useState([])
  const [recording, setRecording] = useState(false)
  const [time, setTime] = useState(0)

  useEffect(() => {
    let watchId
    let timer

    if (recording) {
      timer = setInterval(() => {
        setTime(t => t + 1)
      }, 1000)

      watchId = navigator.geolocation.watchPosition(
        (pos) => {
          setRoute(prev => [
            ...prev,
            [pos.coords.latitude, pos.coords.longitude]
          ])
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

  const center = route.length ? route[route.length - 1] : [-26.3044, -48.8487]

  return (
    <div className="app">
      <div className="hud">
        <h1>F1 BIKE TRACKER</h1>

        <div className="card">
          TEMPO: {Math.floor(time / 60).toString().padStart(2,'0')}:
          {(time % 60).toString().padStart(2,'0')}
        </div>

        {!recording ? (
          <button className="start" onClick={() => {
            setRoute([])
            setTime(0)
            setRecording(true)
          }}>
            START RACE
          </button>
        ) : (
          <button className="stop" onClick={() => setRecording(false)}>
            FINISH
          </button>
        )}
      </div>

      <MapContainer center={center} zoom={15} className="map">
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {route.length > 0 && (
          <Polyline positions={route} />
        )}
      </MapContainer>
    </div>
  )
}