import { WFS, GML } from 'ol/format';
import Feature from 'ol/Feature.js';
import axios from 'axios';

// ===== GeoServer 레이어 설정 =====
export const WFS_CONFIG = {
    featureNS: 'http://osgeo.kr/korea',
    featurePrefix: 'korea',
    featureType: 'building',
    srsName: 'EPSG:3857',
    version: '1.1.0',
};

// GML 포맷터 — 도형 직렬화용
const formatGML = new GML({
    featureNS: WFS_CONFIG.featureNS,
    featureType: WFS_CONFIG.featureType,
    srsName: WFS_CONFIG.srsName,
});

// WFS 포맷터 — 트랜잭션 XML 작성/파싱
const wfsFormat = new WFS();

async function sendTransaction(inserts, updates, deletes) {
    // ① XML DOM 생성
    let node = wfsFormat.writeTransaction(
        inserts, updates, deletes, formatGML
    );
    // (Update 특수 처리는 4단계에서)

    if (updates) {
        const updateFeature = new Feature({
            geometry: updates[0].getGeometry()
        });
        updateFeature.setGeometryName('geom');
        updateFeature.setId(updates[0].getId());

        node = wfsFormat.writeTransaction(
            null,
            [updateFeature],
            null,
            formatGML
        );

    }

    // ② DOM → 문자열
    const body = new XMLSerializer().serializeToString(node);

    // ③ GeoServer로 POST
    const response = await axios.post(
        '/geoserver/ows', body,
        { headers: { 'Content-Type': 'text/xml' }, }
    );

    // ④ 응답 XML 파싱 → fid 추출
    const result = wfsFormat.readTransactionResponse(response.data);
    return result;
}

export const insertFeature = (feature) => sendTransaction([feature], null, null);
export const updateFeature = (feature) => sendTransaction(null, [feature], null);
export const deleteFeature = (feature) => sendTransaction(null, null, [feature]);





