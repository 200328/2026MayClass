// ═══════════════════════════════════════════════════════════════
// Cesium 기본 예제 — 3D 지구본 + 마커 + 건물 박스
// ═══════════════════════════════════════════════════════════════
// 학습 목표:
//   ① Viewer 초기화 (3D 지구본)
//   ② 카메라 이동 (flyTo)
//   ③ Entity 추가 — Point / Billboard / Label / Box
// ═══════════════════════════════════════════════════════════════

import { Viewer, Cartesian3, Color, HeightReference } from 'cesium';
import 'cesium/Build/Cesium/Widgets/widgets.css';

// ─── ① Viewer 생성 (3D 지구본) ────────────────────────────
// Cesium Ion 기본 자산 사용 (토큰 없으면 기본 이미지만 표시됨)
// 토큰 발급: https://cesium.com/ion/signup (무료)
// Cesium.Ion.defaultAccessToken = 'YOUR_TOKEN';

const viewer = new Viewer('cesiumContainer', {
  animation: false,       // 좌측 하단 시간 컨트롤 숨김
  timeline: false,        // 하단 타임라인 숨김
  geocoder: false,        // 우측 상단 검색창 숨김
  homeButton: false,      // 홈 버튼 숨김
  sceneModePicker: false, // 2D/3D 전환 버튼 숨김
  baseLayerPicker: false, // 배경 지도 선택 숨김
  navigationHelpButton: false,
});

// ─── ② 카메라를 서울시청으로 이동 ───────────────────────────
viewer.camera.flyTo({
  destination: Cartesian3.fromDegrees(126.978, 37.5665, 2000), // 경도, 위도, 높이(m)
  duration: 2, // 애니메이션 시간 (초)
});

// ─── ③ Point + Label (서울시청) ──────────────────────────
viewer.entities.add({
  position: Cartesian3.fromDegrees(126.978, 37.5665),
  point: {
    pixelSize: 12,
    color: Color.RED,
    outlineColor: Color.WHITE,
    outlineWidth: 2,
    heightReference: HeightReference.CLAMP_TO_GROUND, // 지면에 붙이기
  },
  label: {
    text: '서울시청',
    font: '14px sans-serif',
    fillColor: Color.WHITE,
    outlineColor: Color.BLACK,
    outlineWidth: 2,
    pixelOffset: new Cartesian3(0, -20, 0), // 점 위로 띄우기
  },
});

// ─── ④ 3D 박스 (건물 표현) ─────────────────────────────────
viewer.entities.add({
  position: Cartesian3.fromDegrees(126.979, 37.567, 50), // 높이 50m
  box: {
    dimensions: new Cartesian3(80, 80, 100), // 가로·세로·높이(m)
    material: Color.CYAN.withAlpha(0.7),
    outline: true,
    outlineColor: Color.BLACK,
  },
});

// ─── ⑤ 경복궁 위치에 원뿔 (랜드마크 강조) ──────────────────
viewer.entities.add({
  position: Cartesian3.fromDegrees(126.977, 37.5796, 100),
  cylinder: {
    length: 200,
    topRadius: 0,
    bottomRadius: 50,
    material: Color.YELLOW.withAlpha(0.6),
  },
  label: {
    text: '경복궁',
    font: '14px sans-serif',
    fillColor: Color.WHITE,
    outlineColor: Color.BLACK,
    outlineWidth: 2,
    pixelOffset: new Cartesian3(0, -30, 0),
  },
});

console.log('[Cesium] 초기화 완료 — 마우스로 회전/줌 가능');

// ─── 💡 실습 과제 ────────────────────────────────────────────
// 1. Cesium Ion 토큰 발급 후 적용 → 3D 건물(OSM Buildings) 표시
//    https://cesium.com/ion/signup
// 2. 여러 마커를 배열로 생성해서 추가해보기
// 3. polyline 으로 경복궁↔서울시청 경로선 그리기
//    polyline: { positions: Cartesian3.fromDegreesArray([lon1,lat1, lon2,lat2]) }
// 4. 지도 클릭 시 해당 좌표에 마커 추가하기
//    viewer.screenSpaceEventHandler.setInputAction(...)
