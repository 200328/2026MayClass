import { MapContainer, TileLayer, Marker, Popup, GeoJSON }
  from 'react-leaflet'; 
import 'leaflet/dist/leaflet.css';

export default function App() {

  return (
    // 기본 지도
    <MapContainer center={[37.5665, 126.978]}
      zoom={13}
      style={{ height: '100vh' }}>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <Marker position={[37.5665, 126.978]}>
        <Popup>서울특별시</Popup>
      </Marker>
    </MapContainer>
  )
}

