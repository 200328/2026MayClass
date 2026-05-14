import { useEffect, useRef } from 'react';
import Map from 'ol/Map';
import View from 'ol/View';
import { Attribution, Zoom } from 'ol/control';
import TileLayer from 'ol/layer/Tile';
import VectorLayer from 'ol/layer/Vector';
import XYZ from 'ol/source/XYZ';
import VectorSource from 'ol/source/Vector';
import TileWMS from 'ol/source/TileWMS';
import GeoJSON from 'ol/format/GeoJSON';
import { bbox as bboxStrategy } from 'ol/loadingstrategy';
import { Style, Fill, Stroke } from 'ol/style';
import { WFS_CONFIG } from './wfst';

// 일정 줌 이상에서만 벡터 레이어 표시
const VECTOR_MIN_ZOOM = 17;

// GeoServer 레이어
const TYPENAME = `${WFS_CONFIG.featurePrefix}:${WFS_CONFIG.featureType}`;

// 저장된 폴리곤 스타일
const savedStyle = new Style({
	fill: new Fill({ color: 'rgba(2, 132, 199, 0.25)' }),
	stroke: new Stroke({ color: '#0284c7', width: 2 }),
});

export default function MapView({ onMapReady }) {
	const mapElement = useRef(null);
	const mapRef = useRef(null);
	// 콜백을 ref에 보관 — effect 의존성에서 제외하여 무한 렌더 방지
	const onMapReadyRef = useRef(onMapReady);

	// prop이 바뀌면 ref만 업데이트 (effect는 재실행되지 않음)
	useEffect(() => {
		onMapReadyRef.current = onMapReady;
	}, [onMapReady]);

  	useEffect(() => {
		if (mapRef.current) return; // StrictMode 중복 실행 방지

		// VWorld Base 배경지도
		const vworldBase = new TileLayer({
			source: new XYZ({
				url: 'https://xdworld.vworld.kr/2d/Base/service/{z}/{x}/{y}.png',
				attributions: new Attribution({
					html: 'Data by <a href="http://map.vworld.kr">VWORLD</a>"'
				}),
			}),
		});

		// Building WMS Layer
		const wmsSource = new TileWMS({
			url: '/geoserver/ows',
			params: {
				VERSION: '1.3.0',
				LAYERS: 'building',
				WIDTH: 256,
				HEIGHT: 256,
				CRS: 'EPSG:5174',
				TILED: true
			}
		});

		const wmsLayer = new TileLayer({
			source: wmsSource,
			opacity: .5
		});

		// GeoServer WFS 벡터 소스 (BBOX 전략)
		const vectorSource = new VectorSource({
			format: new GeoJSON(),
			url: (extent) => {
				const params = new URLSearchParams({
					service:      'WFS',
					version:      '2.0.0',
					request:      'GetFeature',
					typeName:     TYPENAME,
					outputFormat: 'application/json',
					srsname:      'EPSG:3857',
					bbox:         extent.join(',') + ',EPSG:3857',
				});
				return `/geoserver/wfs?${params.toString()}`;
			},
			strategy: bboxStrategy,
		});

		// 일정 줌 이상에서만 표출 (minZoom)
		const vectorLayer = new VectorLayer({
			source: vectorSource,
			style: savedStyle,
			minZoom: VECTOR_MIN_ZOOM,
		});

		const map = new Map({
			target: mapElement.current,
			layers: [vworldBase, wmsLayer, vectorLayer],
			view: new View({
				center: [14139375.266574217, 4507391.386530381], // EPSG:3857
				zoom: 16,
			}),
		});

		mapRef.current = map;
		onMapReadyRef.current?.(map, vectorSource, wmsSource);

		return () => {
			map.setTarget(null);
			mapRef.current = null;
		};
		// 빈 의존성 — 마운트 시 한 번만 실행
		// eslint-disable-next-line react-hooks/exhaustive-deps
  	}, []);

  	return <div ref={mapElement} className="map" />;
}