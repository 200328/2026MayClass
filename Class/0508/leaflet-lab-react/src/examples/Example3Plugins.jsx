// ═══════════════════════════════════════════════════════════════
// 예제 3: 플러그인 활용 — Leaflet.draw + Leaflet.markercluster
// ═══════════════════════════════════════════════════════════════
// 학습 목표:
//   ① React-Leaflet 공식 래퍼가 없는 플러그인을 useMap으로 연동
//   ② Leaflet.draw로 도형 그리기 (편집/삭제 포함)
//   ③ Leaflet.markercluster로 대량 마커(500개) 클러스터링
//   ④ React useEffect 생명주기와 Leaflet 인스턴스 관리
// ═══════════════════════════════════════════════════════════════

import { useEffect } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';

// 플러그인 JS + CSS
import 'leaflet-draw';
import 'leaflet-draw/dist/leaflet.draw.css';

import 'leaflet.markercluster';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';

// ═══════════════════════════════════════════════════════════════
// [Part 1] Leaflet.draw 컴포넌트
// ═══════════════════════════════════════════════════════════════
function DrawControl() {
  const map = useMap();

  useEffect(() => {
    // ① 그린 도형을 담을 FeatureGroup
    const drawnItems = new L.FeatureGroup();
    map.addLayer(drawnItems);

    // ② Draw 컨트롤 설정
    const drawControl = new L.Control.Draw({
      position: 'topright',
      draw: {
        polygon: {
          allowIntersection: false,
          showArea: true,
          drawError: {
            color: '#e1e100',
            message: '<strong>교차하는 폴리곤은 그릴 수 없습니다!</strong>',
          },
          shapeOptions: { color: '#0284c7', weight: 3 },
        },
        polyline: { shapeOptions: { color: '#059669', weight: 4 } },
        circle:   { shapeOptions: { color: '#7c3aed' } },
        rectangle:{ shapeOptions: { color: '#d97706' } },
        marker: true,
        circlemarker: false,
      },
      edit: {
        featureGroup: drawnItems,
        remove: true,
      },
    });
    map.addControl(drawControl);

    // ③ 그리기 완료 이벤트
    const onCreated = (event) => {
      const layer = event.layer;
      const type = event.layerType;

      let info = `<b>${type}</b>`;
      if (type === 'polygon' || type === 'rectangle') {
        const latlngs = layer.getLatLngs()[0];
        const area = L.GeometryUtil.geodesicArea(latlngs);
        info += `<br>면적: ${(area / 1000000).toFixed(3)} km²`;
      } else if (type === 'polyline') {
        const latlngs = layer.getLatLngs();
        let distance = 0;
        for (let i = 1; i < latlngs.length; i++) {
          distance += latlngs[i - 1].distanceTo(latlngs[i]);
        }
        info += `<br>거리: ${(distance / 1000).toFixed(3)} km`;
      } else if (type === 'circle') {
        info += `<br>반지름: ${layer.getRadius().toFixed(1)} m`;
      }

      layer.bindPopup(info);
      drawnItems.addLayer(layer);
      console.log('[draw:created]', type, layer.toGeoJSON());
    };

    const onEdited = (event) => {
      console.log('[draw:edited]', event.layers.getLayers().length + '개 편집됨');
    };

    const onDeleted = (event) => {
      console.log('[draw:deleted]', event.layers.getLayers().length + '개 삭제됨');
    };

    map.on(L.Draw.Event.CREATED, onCreated);
    map.on(L.Draw.Event.EDITED, onEdited);
    map.on(L.Draw.Event.DELETED, onDeleted);

    // ④ 언마운트 시 정리
    return () => {
      map.off(L.Draw.Event.CREATED, onCreated);
      map.off(L.Draw.Event.EDITED, onEdited);
      map.off(L.Draw.Event.DELETED, onDeleted);
      map.removeControl(drawControl);
      map.removeLayer(drawnItems);
    };
  }, [map]);

  return null;
}

// ═══════════════════════════════════════════════════════════════
// [Part 2] MarkerCluster 컴포넌트
// ═══════════════════════════════════════════════════════════════
function ClusterLayer({ center, count = 500 }) {
  const map = useMap();

  useEffect(() => {
    // ① 클러스터 그룹 생성 (커스텀 아이콘 포함)
    const markers = L.markerClusterGroup({
      showCoverageOnHover: true,
      zoomToBoundsOnClick: true,
      spiderfyOnMaxZoom: true,
      maxClusterRadius: 80,
      iconCreateFunction: (cluster) => {
        const num = cluster.getChildCount();
        let size = 40;
        let color = '#0284c7';
        if (num > 100)     { size = 60; color = '#dc2626'; }
        else if (num > 30) { size = 50; color = '#d97706'; }

        return L.divIcon({
          html: `<div style="
            background: ${color};
            color: white;
            border-radius: 50%;
            width: ${size}px;
            height: ${size}px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            font-size: 13px;
            border: 3px solid white;
            box-shadow: 0 2px 4px rgba(0,0,0,0.3);
          ">${num}</div>`,
          className: 'custom-cluster',
          iconSize: L.point(size, size),
        });
      },
    });

    // ② 랜덤 마커 대량 생성 (서울 중심)
    for (let i = 0; i < count; i++) {
      const lat = center[0] + (Math.random() - 0.5) * 0.3;
      const lng = center[1] + (Math.random() - 0.5) * 0.4;

      const marker = L.marker([lat, lng])
        .bindPopup(`<b>장소 #${i + 1}</b><br>위도: ${lat.toFixed(4)}<br>경도: ${lng.toFixed(4)}`)
        .bindTooltip(`#${i + 1}`);

      markers.addLayer(marker);
    }

    map.addLayer(markers);
    console.log(`[예제 3] ${count}개 마커 클러스터링 완료`);

    // ③ 언마운트 시 정리
    return () => {
      map.removeLayer(markers);
    };
  }, [map, center, count]);

  return null;
}

// ═══════════════════════════════════════════════════════════════
// 메인 컴포넌트
// ═══════════════════════════════════════════════════════════════
export default function Example3Plugins() {
  return (
    <MapContainer
      center={[37.5665, 126.978]}
      zoom={12}
      style={{ width: '100%', height: '100%' }}
    >
      <TileLayer
        attribution="© OpenStreetMap contributors"
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <DrawControl />
      <ClusterLayer center={[37.5665, 126.978]} count={500} />
    </MapContainer>
  );
}

// ─── 💡 실습 과제 ────────────────────────────────────────────
// 1. 그린 도형을 drawnItems.toGeoJSON()으로 export하여 화면에 출력
// 2. count prop을 5000으로 늘려 성능 체감
// 3. 실제 공공데이터(공공자전거 대여소 등)를 useEffect에서 fetch하여
//    ClusterLayer에 표시
// 4. Draw 이벤트 상태를 React state로 관리하여
//    "현재 도형 N개" UI 표시
