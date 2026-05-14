import { useState, useCallback } from 'react';
import MapView from './components/MapView';
import EditToolbar from './components/EditToolbar';

export default function App() {
  const [map, setMap] = useState(null);
  const [vectorSource, setVectorSource] = useState(null);
  const [wmsSource, setWmsSource] = useState(null);

  // ⚠ 콜백을 메모이제이션해야 MapView의 useEffect가 무한 재실행되지 않음
  const handleMapReady = useCallback((m, src, wms) => {
    setMap(m);
    setVectorSource(src);
    setWmsSource(wms);
  }, []);

  return (
    <div className="app">
      <div className="map-container">
        <MapView onMapReady={handleMapReady} />
        {map && vectorSource && (
          <EditToolbar map={map} vectorSource={vectorSource} wmsSource={wmsSource}/>
        )}
      </div>
    </div>
  );
}