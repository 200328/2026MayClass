import { useEffect, useRef } from 'react';
import Map from 'ol/Map';
import View from 'ol/View';
import 'ol/ol.css';
import TileLayer from 'ol/layer/Tile';
import { TileWMS, XYZ } from 'ol/source';
import Attribution from 'ol/control/Attribution';

import { bbox as bboxStrategy } from 'ol/loadingstrategy';
import { WFS_CONFIG } from './wfst';
import GeoJSON from 'ol/format/GeoJSON';
import VectorSource from 'ol/source/Vector';
import VectorLayer from 'ol/layer/Vector';

const TYPENAME = `${WFS_CONFIG.featurePrefix}:${WFS_CONFIG.featureType}`;
const VECTOR_MIN_ZOOM = 17;

export default function MapView({ onMapReady }) {
    const mapElement = useRef(null);
    const mapRef = useRef(null);
    const onMapReadyRef = useRef(onMapReady);

    useEffect(() => {
        onMapReadyRef.current = onMapReady;
    }, [onMapReady]);

    useEffect(() => {
        if (mapRef.current) return;

        // ① VWorld 배경
        const vworldBase = new TileLayer({
            source: new XYZ({
                url: 'https://xdworld.vworld.kr/2d/' +
                    'Base/service/{z}/{x}/{y}.png',
                attributions: new Attribution({
                    html: 'Data by <a>VWORLD</a>',
                }),
            }),
        });

        // ② 건물 WMS (반투명)
        const wmsSource = new TileWMS({
            url: '/geoserver/ows',
            params: {
                VERSION: '1.3.0',
                LAYERS: 'building',
                CRS: 'EPSG:5174',
                TILED: true,
            },
        });
        const wmsLayer = new TileLayer({
            source: wmsSource,
            opacity: 0.5,
        });

        const vectorSource = new VectorSource({
            format: new GeoJSON(),
            url: (extent) => {
                const params = new URLSearchParams({
                    service: 'WFS',
                    version: '2.0.0',
                    request: 'GetFeature',
                    typeName: TYPENAME,
                    outputFormat: 'application/json',
                    srsname: 'EPSG:3857',
                    bbox: extent.join(',') +
                        ',EPSG:3857',
                });
                return '/geoserver/wfs?' +
                    params.toString();
            },
            strategy: bboxStrategy,
        });

        const vectorLayer = new VectorLayer({
            source: vectorSource,
            minZoom: VECTOR_MIN_ZOOM, // 17
        });

        // ... 레이어 생성 ...
        const map = new Map({
            target: mapElement.current,
            layers: [
                vworldBase, // 배경지도를 항상 제일 먼저! 가장 아래에 깔리도록
                wmsLayer,
                vectorLayer
            ],
            view: new View({
                // EPSG:3857 좌표 직접 입력
                center: [
                    14139375.266574217,
                    4507391.386530381,
                ],
                zoom: 16,
            }),
        });
        mapRef.current = map;
        onMapReadyRef.current?.(map, vectorSource, wmsSource);
        return () => {
            map.setTarget(null);
            mapRef.current = null;
        };
    }, []);

    return <div ref={mapElement} className="map" />;
}
