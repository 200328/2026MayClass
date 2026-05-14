import { useState } from 'react';
import Example1Basics from './examples/Example1Basics';
import Example2GeoJSON from './examples/Example2GeoJSON';
import Example3Plugins from './examples/Example3Plugins';

const EXAMPLES = [
  { id: 1, label: '① 기본 (Marker/Popup/Tooltip)', Comp: Example1Basics },
  { id: 2, label: '② GeoJSON + 스타일링',          Comp: Example2GeoJSON },
  { id: 3, label: '③ 플러그인 (Draw/Cluster)',     Comp: Example3Plugins },
];

export default function App() {
  const [currentId, setCurrentId] = useState(1);
  const current = EXAMPLES.find((e) => e.id === currentId);
  const Current = current.Comp;

  return (
    <div className="app">
      <header className="app-header">
        <h1>🍃 Leaflet 실습 (React)</h1>
        <div className="example-tabs">
          {EXAMPLES.map((ex) => (
            <button
              key={ex.id}
              className={currentId === ex.id ? 'active' : ''}
              onClick={() => setCurrentId(ex.id)}
            >
              {ex.label}
            </button>
          ))}
        </div>
      </header>

      <div className="map-wrap">
        {/* key를 바꿔서 예제 전환 시 지도를 완전히 재생성 */}
        <Current key={currentId} />
      </div>
    </div>
  );
}
