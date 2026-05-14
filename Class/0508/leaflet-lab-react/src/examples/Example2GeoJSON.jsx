// ═══════════════════════════════════════════════════════════════
// 예제 2: GeoJSON 레이어 + 스타일링 (React-Leaflet)
// ═══════════════════════════════════════════════════════════════
// 학습 목표:
//   ① GeoJSON 컴포넌트로 피처 렌더링
//   ② 속성 기반 Choropleth(단계구분도) 스타일링
//   ③ 호버 하이라이트 + 클릭 줌인 (eventHandlers)
//   ④ useMap 훅으로 range별 컨트롤 추가 (Legend)
// ═══════════════════════════════════════════════════════════════

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet';
import L from 'leaflet';

// ─── ① 인구 수에 따른 색상 매핑 ──────────────────────────────
function getColor(population) {
  return population > 350000 ? '#800026'
       : population > 300000 ? '#BD0026'
       : population > 250000 ? '#E31A1C'
       : population > 200000 ? '#FC4E2A'
       : population > 150000 ? '#FD8D3C'
       : population > 100000 ? '#FEB24C'
       :                       '#FED976';
}

// ─── ② 기본 스타일 ──────────────────────────────────────────
function styleFn(feature) {
  return {
    fillColor: getColor(feature.properties.population),
    weight: 2,
    opacity: 1,
    color: 'white',
    dashArray: '3',
    fillOpacity: 0.7,
  };
}

// ─── ③ 피처별 이벤트 바인딩 ─────────────────────────────────
function onEachFeature(feature, layer) {
  const { name, population, area_km2 } = feature.properties;
  const density = Math.round(population / area_km2);

  // 팝업
  layer.bindPopup(`
    <div class="popup-title">${name}</div>
    <div class="popup-desc">
      인구: <b>${population.toLocaleString()}명</b><br>
      면적: ${area_km2} km²<br>
      인구밀도: ${density.toLocaleString()} 명/km²
    </div>
  `);

  // 툴팁
  layer.bindTooltip(name, { sticky: true });

  // 호버 하이라이트
  layer.on({
    mouseover: (e) => {
      e.target.setStyle({
        weight: 4,
        color: '#666',
        dashArray: '',
        fillOpacity: 0.9,
      });
      e.target.bringToFront();
    },
    mouseout: (e) => {
      // resetStyle을 쓰려면 GeoJSON 레이어 참조가 필요 — 아래 styleFn 재적용으로 대체
      e.target.setStyle(styleFn(feature));
    },
    // 클릭 시 해당 피처로 줌인
    click: (e) => {
      e.target._map.fitBounds(e.target.getBounds());
    },
  });
}

// ─── ④ 범례(Legend) 컴포넌트 ─────────────────────────────────
// useMap 훅을 통해 지도 인스턴스에 Leaflet Control을 직접 추가
function Legend() {
  const map = useMap();

  useEffect(() => {
    const legend = L.control({ position: 'bottomright' });

    legend.onAdd = function () {
      const div = L.DomUtil.create('div', 'legend');
      const grades = [0, 100000, 150000, 200000, 250000, 300000, 350000];

      div.innerHTML = '<h4>인구 (명)</h4>';
      for (let i = 0; i < grades.length; i++) {
        const from = grades[i];
        const to = grades[i + 1];
        div.innerHTML +=
          `<i style="background:${getColor(from + 1)}"></i> ` +
          from.toLocaleString() +
          (to ? '–' + to.toLocaleString() : '+') +
          '<br>';
      }
      return div;
    };

    legend.addTo(map);

    return () => legend.remove();
  }, [map]);

  return null;
}

// ─── ⑤ 메인 컴포넌트 ────────────────────────────────────────
export default function Example2GeoJSON() {
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch('/data/seoul-districts.geojson')
      .then((res) => res.json())
      .then((json) => {
        setData(json);
        console.log('[예제 2] GeoJSON 로드 완료', json.features.length + '개 피처');
      })
      .catch((err) => {
        console.error('GeoJSON 로드 실패:', err);
        alert('GeoJSON 파일을 불러올 수 없습니다.');
      });
  }, []);

  return (
    <MapContainer
      center={[37.5665, 126.978]}
      zoom={12}
      style={{ width: '100%', height: '100%' }}
    >
      <TileLayer
        attribution="© OpenStreetMap © CARTO"
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png"
        subdomains="abcd"
      />

      {data && (
        <GeoJSON
          data={data}
          style={styleFn}
          onEachFeature={onEachFeature}
        />
      )}

      <Legend />
    </MapContainer>
  );
}

// ─── 💡 실습 과제 ────────────────────────────────────────────
// 1. getColor() 경계값을 인구밀도 기준으로 바꿔보기
// 2. GeoJSON의 properties를 추가(예: 'region', 'mayor')하여
//    팝업에 더 많은 정보 표시
// 3. useRef로 GeoJSON 레이어를 참조하여 resetStyle() 정확히 구현
// 4. 실제 서울시 행정경계 GeoJSON 데이터로 교체
//    (공공데이터포털: data.go.kr)
