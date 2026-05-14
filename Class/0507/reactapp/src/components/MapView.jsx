// DualMapView.jsx
import { useEffect, useRef } from 'react';
import 'ol/ol.css';

import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import { fromLonLat } from 'ol/proj';
import TileWMS from 'ol/source/TileWMS';

import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import GeoJSON from 'ol/format/GeoJSON';
import Style from 'ol/style/Style';
import Stroke from 'ol/style/Stroke';
import Fill from 'ol/style/Fill';
import CircleStyle from 'ol/style/Circle';

import WKT from 'ol/format/WKT';
import Feature from 'ol/Feature';

import ScaleLine from 'ol/control/ScaleLine';
import { defaults as defaultControls } from 'ol/control/defaults';

import FullScreen from 'ol/control/FullScreen';
import Select from 'ol/interaction/Select';
import { click } from 'ol/events/condition';
import Draw from 'ol/interaction/Draw';
import Modify from 'ol/interaction/Modify';
import Snap from 'ol/interaction/Snap';

export default function MapView() {
    const mapElement1 = useRef(null);
    const mapElement2 = useRef(null);

    const mapRef1 = useRef(null);
    const mapRef2 = useRef(null);

    const selectInteractionRef = useRef(null);
    const drawInteractionRef = useRef(null);
    const modifyInteractionRef = useRef(null);
    const snapInteractionRef = useRef(null);

    useEffect(() => {
        if (!mapElement1.current || !mapElement2.current) return;

        // 하나의 View를 두 지도에서 공유
        const sharedView = new View({
            center: fromLonLat([127.0, 37.5]),
            zoom: 7,
        });

        const baseLayer1 = new TileLayer({
            source: new OSM(),
        });

        const baseLayer2 = new TileLayer({
            source: new OSM(),
        });

        const map1 = new Map({
            target: mapElement1.current,
            layers: [baseLayer1],
            view: sharedView,

            controls: defaultControls().extend([
                new ScaleLine({
                    // 축척 단위
                    // 'metric': m, km
                    // 'imperial': in, ft, mi
                    // 'nautical': 해리
                    // 'us': 미국 단위
                    units: 'metric',

                    // bar 형태로 표시할지 여부
                    bar: true,

                    // 텍스트 표시 여부
                    text: true,

                    // 최소 너비(px)
                    minWidth: 100,
                }),
            ]),
        });

        const map2 = new Map({
            target: mapElement2.current,
            layers: [baseLayer2],
            view: sharedView,
        });

        mapRef1.current = map1;
        mapRef2.current = map2;

        return () => {
            map1.setTarget(null);
            map2.setTarget(null);

        };
    }, []);

    const addTileLayer = (map) => {
        const geoserverTileLayer = new TileLayer({
            source: new TileWMS({
                url: "http://128.134.187.146:7089/geoserver/wms",
                params: {
                    LAYERS: 'sample:poi',
                    STYLES: '',
                    FORMAT: 'image/png',
                    TRANSPARENT: true,
                    VERSION: '1.3.0',
                    TILED: true,
                },
                serverType: 'geoserver',
                crossOrigin: 'anonymous',
            }),
        });

        map.addLayer(geoserverTileLayer);
    }

    const addVectorLayer = (map) => {
        const geoserverVectorSource = new VectorSource({
            // GeoServer WFS GetFeature 요청 URL
            // service=WFS              : WFS 서비스 요청
            // version=1.1.0            : WFS 버전
            // request=GetFeature       : 피처 조회 요청
            // typeName=workspace:layer : 조회할 레이어 이름
            // outputFormat=application/json : GeoJSON 형태로 반환
            // srsName=EPSG:3857        : 반환 좌표계를 현재 지도 View와 맞춤
            url:
                'http://128.134.187.146:7089/geoserver/wfs' +
                '?service=WFS' +
                '&version=1.1.0' +
                '&request=GetFeature' +
                '&typeName=sample:poi' +
                '&outputFormat=application/json' +
                '&srsName=EPSG:3857',

            // GeoJSON 형식으로 응답을 읽음
            format: new GeoJSON(),
        });

        // 벡터 레이어 생성
        const geoserverVectorLayer = new VectorLayer({
            source: geoserverVectorSource,

            // 레이어 표시 여부
            visible: true,

            // 레이어 투명도 (0 ~ 1)
            opacity: 1,

            // 레이어 그리기 순서
            zIndex: 20,

            // 간단한 스타일 예시
            style: new Style({
                stroke: new Stroke({
                    color: '#ff6600', // 선 색상
                    width: 2,         // 선 두께
                }),
                fill: new Fill({
                    color: 'rgba(255, 102, 0, 0.2)', // 면 색상
                }),
                image: new CircleStyle({
                    radius: 6, // 포인트 반경
                    fill: new Fill({
                        color: '#ff6600',
                    }),
                    stroke: new Stroke({
                        color: '#ffffff',
                        width: 1,
                    }),
                }),
            }),
        });

        // map2에 벡터 레이어 추가
        map.addLayer(geoserverVectorLayer);
    }

    const addWkt = (map) => {
        const wktSource = new VectorSource();

        // 2. VectorLayer 생성
        const wktLayer = new VectorLayer({
            title: 'wktLayer',
            source: wktSource,
            // 레이어 표시 여부
            visible: true,
            // 레이어 투명도
            opacity: 1,
            // 레이어 순서
            zIndex: 30,
            // 스타일 지정
            style: new Style({
                stroke: new Stroke({
                    color: '#0066ff',
                    width: 3,
                }),
                fill: new Fill({
                    color: 'rgba(0, 102, 255, 0.2)',
                }),
                image: new CircleStyle({
                    radius: 6,
                    fill: new Fill({
                        color: '#0066ff',
                    }),
                    stroke: new Stroke({
                        color: '#ffffff',
                        width: 1,
                    }),
                }),
            }),
        });

        // 3. map1에 레이어 추가
        map.addLayer(wktLayer);

        // 4. WKT 포맷 객체 생성
        const wktFormat = new WKT();

        // 5. 실습용 WKT 문자열
        // 예시: 서울 부근 사각형 polygon
        const wktText =
            'POLYGON((126.90 37.45, 127.10 37.45, 127.10 37.60, 126.90 37.60,126.90 37.45))';

        // 6. WKT 문자열을 Feature로 읽기
        const wktFeature = wktFormat.readFeature(wktText, {
            // WKT 원본 좌표계
            dataProjection: 'EPSG:4326',
            // 지도에 표시할 좌표계
            featureProjection: 'EPSG:3857',
        });

        // 7. source에 feature 추가
        wktSource.addFeature(wktFeature);
    }

    const addGeoJSON = (map) => {
        const geojsonSource = new VectorSource({
            // 브라우저가 접근 가능한 GeoJSON 파일 경로
            // 보통 Vite에서는 public 폴더 아래 파일을 /경로 형태로 접근
            url: '/data/seoul_sgg.geojson',

            // GeoJSON 형식으로 읽기
            // dataProjection: 원본 GeoJSON 좌표계
            // featureProjection: 지도에 표시할 좌표계
            format: new GeoJSON({
                dataProjection: 'EPSG:4326',
                featureProjection: 'EPSG:3857',
            }),
        });

        // VectorLayer 생성
        const geojsonLayer = new VectorLayer({
            source: geojsonSource,

            // 레이어 표시 여부
            visible: true,

            // 레이어 투명도
            opacity: 1,

            // 레이어 순서
            zIndex: 20,

            // 스타일
            style: new Style({
                stroke: new Stroke({
                    color: '#ff6600',
                    width: 2,
                }),
                fill: new Fill({
                    color: 'rgba(255, 102, 0, 0.15)',
                }),
            }),
        });

        // map1에 레이어 추가
        map.addLayer(geojsonLayer);
    }

    const addFullScreenControl = (map) => {
        if (!map) return;

        const controls = map.getControls().getArray();

        // 이미 FullScreen 컨트롤이 있는지 찾기
        const fullScreenControl = controls.find(
            (control) => control instanceof FullScreen
        );

        if (fullScreenControl) return;

        map.addControl(
            new FullScreen({
                label: '⛶',
                labelActive: '✕',
                tipLabel: '전체화면',
            })
        );
    };

    // fullscreen 컨트롤 삭제
    const removeFullScreenControl = (map) => {
        if (!map) return;

        const controls = map.getControls().getArray();

        const fullScreenControl = controls.find(
            (control) => control instanceof FullScreen
        );

        if (!fullScreenControl) return;

        map.removeControl(fullScreenControl);
    };

    const findLayerTitle = (map, layerTitle) => {
        if (!map) return null;

        return map
            .getLayers()
            .getArray()
            .find((layer) => layer.get('title') === layerTitle);
    };

    const addSelectInteraction = (map, layerTitle) => {
        if (!map) return;

        const sampleVectorLayer = findLayerTitle(map, layerTitle);
        if (!sampleVectorLayer) return;

        // 기존 select interaction 제거
        if (selectInteractionRef.current) {
            map.removeInteraction(selectInteractionRef.current);
            selectInteractionRef.current = null;
        }

        const selectInteraction = new Select({
            // 클릭 시 선택
            condition: click,

            // sampleVector 레이어에서만 선택 가능
            layers: [sampleVectorLayer],
        });

        selectInteraction.on('select', (e) => {
            console.log(e.selected);
        });

        map.addInteraction(selectInteraction);
        selectInteractionRef.current = selectInteraction;
    };

    const addDrawInteraction = (map, drawType, layerTitle) => {
        if (!map) return;

        const sampleVectorLayer = findLayerTitle(map, layerTitle);
        if (!sampleVectorLayer) return;

        const source = sampleVectorLayer.getSource();
        if (!source) return;

        // 기존 draw interaction 제거
        if (drawInteractionRef.current) {
            map.removeInteraction(drawInteractionRef.current);
            drawInteractionRef.current = null;
        }

        const drawInteraction = new Draw({
            source: source,   // 그린 결과를 sampleVector source에 바로 추가
            type: drawType,   // Point, LineString, Polygon 등
        });

        map.addInteraction(drawInteraction);
        drawInteractionRef.current = drawInteraction;
    };

    const addModifyInteraction = (map, layerTitle) => {
        if (!map) return;

        const sampleVectorLayer = findLayerTitle(map, layerTitle);
        if (!sampleVectorLayer) return;

        const source = sampleVectorLayer.getSource();
        if (!source) return;

        // 기존 modify interaction 제거
        if (modifyInteractionRef.current) {
            map.removeInteraction(modifyInteractionRef.current);
            modifyInteractionRef.current = null;
        }

        const modifyInteraction = new Modify({
            source: source, // sampleVector source의 feature 수정
        });

        map.addInteraction(modifyInteraction);
        modifyInteractionRef.current = modifyInteraction;
    };

    const deleteSelectedFeatures = (map, layerTitle) => {
        if (!map) return;

        const sampleVectorLayer = findLayerTitle(map, layerTitle);
        if (!sampleVectorLayer) return;

        const source = sampleVectorLayer.getSource();
        if (!source) return;

        if (!selectInteractionRef.current) return;

        const selectedFeatures = selectInteractionRef.current.getFeatures();
        const featuresToDelete = selectedFeatures.getArray();

        if (featuresToDelete.length === 0) return;

        featuresToDelete.forEach((feature) => {
            source.removeFeature(feature);
        });

        selectedFeatures.clear();
    };
    const addSnapInteraction = (map, layerTitle) => {
        if (!map) return;

        const sampleVectorLayer = findLayerTitle(map, layerTitle);
        if (!sampleVectorLayer) return;

        const source = sampleVectorLayer.getSource();
        if (!source) return;

        // 기존 snap interaction 제거
        if (snapInteractionRef.current) {
            map.removeInteraction(snapInteractionRef.current);
            snapInteractionRef.current = null;
        }

        const snapInteraction = new Snap({
            source: source, // sampleVector 레이어의 feature를 기준으로 스냅
        });

        map.addInteraction(snapInteraction);
        snapInteractionRef.current = snapInteraction;
    };

    const removeInteractionByType = (map, InteractionClass) => {
        if (!map) return;

        const interactions = map.getInteractions().getArray();

        interactions.forEach((interaction) => {
            if (interaction instanceof InteractionClass) {
                map.removeInteraction(interaction);
            }
        });
    };
    
    return (
        <>
            <div
                style={{
                    display: 'flex',
                    gap: '16px',
                    width: '100%',
                    height: '95vh',
                    padding: '16px',
                    boxSizing: 'border-box',
                }}
            >
                <div
                    ref={mapElement1}
                    style={{
                        flex: 1,
                        border: '1px solid #ccc',
                    }}
                />
                <div
                    ref={mapElement2}
                    style={{
                        flex: 1,
                        border: '1px solid #ccc',
                    }}
                />
            </div>
            <div>
                <button onClick={() => addTileLayer(mapRef1.current)}>wms 추가</button>
                <button onClick={() => addVectorLayer(mapRef2.current)}>vector 추가</button>
                <button onClick={() => addWkt(mapRef1.current)}>wkt 추가</button>
                <button onClick={() => addGeoJSON(mapRef2.current)}>GeoJSON 추가</button>
                <button onClick={() => addFullScreenControl(mapRef2.current)}>control 추가</button>
                <button onClick={() => removeFullScreenControl(mapRef2.current)}>control 삭제</button>

                <br/>

                <button onClick={() => addSelectInteraction(mapRef1.current, 'wktLayer')}>select 추가</button>
                <button onClick={() => addDrawInteraction(mapRef1.current, 'Polygon', 'wktLayer')}>draw 추가</button>
                <button onClick={() => addModifyInteraction(mapRef1.current, 'wktLayer')}>modify 추가</button>
                <button onClick={() => deleteSelectedFeatures(mapRef1.current, 'wktLayer')}>객체 삭제</button>
                <button onClick={() => addSnapInteraction(mapRef1.current, 'wktLayer')}>snap 추가</button>
                <button onClick={() => removeInteractionByType(mapRef1.current, Select)}>interaction 삭제</button>
            </div>
        </>
    );
}