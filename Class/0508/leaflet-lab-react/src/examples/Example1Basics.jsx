// ═══════════════════════════════════════════════════════════════
// 예제 1: TileLayer + Marker + Popup + Tooltip (React-Leaflet)
// ═══════════════════════════════════════════════════════════════
// 학습 목표:
//   ① react-leaflet의 선언적 컴포넌트 구성
//   ② 여러 TileLayer 전환 (LayersControl.BaseLayer)
//   ③ Marker + Popup + Tooltip 의 조합
//   ④ 커스텀 아이콘(L.divIcon) 사용하기
//   ⑤ useMapEvents 훅으로 지도 이벤트 처리
// ═══════════════════════════════════════════════════════════════

import { useState } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Tooltip,
  LayersControl,
  useMapEvents,
  Circle,
  Polygon
} from 'react-leaflet';
import L from 'leaflet';

const { BaseLayer } = LayersControl;

// ─── 커스텀 아이콘 (DivIcon) ──────────────────────────────────
const customIcon = L.divIcon({
  className: 'custom-marker',
  html: `<div style="
    background: #DC2626;
    width: 30px;
    height: 30px;
    border-radius: 50% 50% 50% 0;
    transform: rotate(-45deg);
    border: 2px solid white;
    box-shadow: 0 2px 4px rgba(0,0,0,0.3);
    display: flex;
    align-items: center;
    justify-content: center;
  ">
    <span style="transform: rotate(45deg); color: white; font-size: 14px;">📍</span>
  </div>`,
  iconSize: [30, 30],
  iconAnchor: [15, 30],
  popupAnchor: [0, -30],
});

// ─── 지도 클릭 시 동적 마커 추가용 서브 컴포넌트 ─────────────
// useMapEvents는 MapContainer의 자식 안에서만 사용 가능
function ClickHandler({ onAdd }) {
  useMapEvents({
    click(e) {
      onAdd(e.latlng);
    },
  });
  return null;
}

export default function Example1Basics() {
  // 클릭으로 추가된 마커들
  const [dynamicMarkers, setDynamicMarkers] = useState([]);

  const handleAdd = (latlng) => {
    setDynamicMarkers((prev) => [...prev, latlng]);
  };

  return (
    <MapContainer
      center={[37.5665, 126.978]}
      zoom={13}
      style={{ width: '100%', height: '100%' }}
    >
      {/* ── ② LayersControl로 여러 배경 지도 전환 ── */}
      <LayersControl position="topright">
        <BaseLayer checked name="OpenStreetMap">
          <TileLayer
            attribution="© OpenStreetMap contributors"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
        </BaseLayer>

        <BaseLayer name="Carto Light">
          <TileLayer
            attribution="© OpenStreetMap © CARTO"
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png"
            subdomains="abcd"
          />
        </BaseLayer>
        <BaseLayer name="Carto Dark">
          <TileLayer
            attribution="© OpenStreetMap © CARTO"
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png"
            subdomains="abcd"
          />
        </BaseLayer>
        <BaseLayer name="VWorld Base">
          <TileLayer
            attribution="© vworld"
            url="https://xdworld.vworld.kr/2d/Base/service/{z}/{x}/{y}.png"
            subdomains="abcd"
          />
        </BaseLayer>
      </LayersControl>

      {/* ── ③ 기본 마커 + 팝업 ── */}
      <Marker position={[37.5665, 126.978]}>
        <Popup>
          <div className="popup-title">서울시청</div>
          <div className="popup-desc">서울특별시 중구 세종대로 110</div>
        </Popup>
      </Marker>

      {/* ── ④ 툴팁 (호버 시 표시) ── */}
      <Marker position={[37.5759, 126.9769]}>
        <Tooltip direction="top">광화문</Tooltip>
      </Marker>

      {/* 영구 툴팁 (항상 표시) */}
      <Marker position={[37.5512, 126.9882]}>
        <Tooltip permanent direction="right" offset={[10, 0]}>
          남산타워
        </Tooltip>
      </Marker>

      {/* ── ⑤ 커스텀 아이콘 마커 ── */}
      <Marker position={[37.5796, 126.977]} icon={customIcon}>
        <Popup>
          <b>경복궁</b>
          <br />
          조선왕조의 법궁
        </Popup>
        <Tooltip>경복궁 (커스텀 아이콘)</Tooltip>
      </Marker>

      <Circle center={37.56857, 126.93311} pathOptions={fillBlueOptions} radius={200} />
      <Polygon pathOptions={purpleOptions} positions={polygon} />

      {/* ── ⑥ 클릭으로 추가된 동적 마커들 ── */}
      {dynamicMarkers.map((latlng, i) => (
        <Marker key={i} position={latlng}>
          <Popup>
            새로 추가된 마커
            <br />
            위도: {latlng.lat.toFixed(5)}
            <br />
            경도: {latlng.lng.toFixed(5)}
          </Popup>
        </Marker>
      ))}

      <ClickHandler onAdd={handleAdd} />
    </MapContainer>
  );
}

// ─── 💡 실습 과제 ────────────────────────────────────────────
// 1. BaseLayer에 VWorld Base 타일 추가
// 2. Circle, Polygon 컴포넌트 추가해보기 (react-leaflet 내장)
// 3. Marker 위치를 useState로 관리하여 드래그 가능하게:
//    <Marker draggable eventHandlers={{ dragend: (e) => ... }} />
// 4. 추가된 마커 개수를 헤더에 표시하는 UI 만들기
