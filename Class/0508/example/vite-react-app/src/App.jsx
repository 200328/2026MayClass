import { useState, useCallback } from 'react';
import MapView from './components/MapView';
import EditToolbar from './components/EditToolbar';

export default function App() {
  const [map, setMap] = useState(null);
  const [vectorSource, setVectorSource] = useState(null);
  const [wmsSource, setWmsSource] = useState(null);

  const handleMapReady = useCallback((m, src, wms) => {
    setMap(m);
    setVectorSource(src);
    setWmsSource(wms);
  }, []);

  return (
    <div className="app">
      <div className="map-container">
        <MapView onMapReady={handleMapReady} />
        {map && vectorSource && wmsSource && (
          <EditToolbar map={map} vectorSource={vectorSource} wmsSource={wmsSource}/>
        )}
      </div>
    </div>
  );
}
