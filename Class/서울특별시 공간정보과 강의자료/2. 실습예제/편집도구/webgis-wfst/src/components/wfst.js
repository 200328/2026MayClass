import {WFS, GML} from 'ol/format';
import Feature from 'ol/Feature.js';
import axios from 'axios';

// ===== GeoServer 레이어 설정 =====
export const WFS_CONFIG = {
	featureNS:     'http://osgeo.kr/korea',
	featurePrefix: 'korea',
	featureType:   'building',
	srsName:       'EPSG:3857',
	version:       '1.1.0',
};

const formatGML = new GML({
	featureNS: WFS_CONFIG.featureNS,
	featureType: WFS_CONFIG.featureType,
	srsName: WFS_CONFIG.srsName
})

const wfsFormat = new WFS();

/**
 * WFS-T 트랜잭션 전송 (Insert / Update / Delete)
 * @param {Array} inserts - 추가할 피처
 * @param {Array} updates - 수정할 피처
 * @param {Array} deletes - 삭제할 피처
 */
async function sendTransaction(inserts, updates, deletes) {

	let node = wfsFormat.writeTransaction(
		inserts,
		updates,
		deletes,
		formatGML
	);

	if (updates) {
		const updateFeature = new Feature({
			geometry: updates[0].getGeometry()
		});
		updateFeature.setGeometryName('geom');
		updateFeature.setId(updates[0].getId())
		node = wfsFormat.writeTransaction(
			null,
			[updateFeature],
			null,
			formatGML
		);
	}

	const body = new XMLSerializer().serializeToString(node);

	const response = await axios.post('/geoserver/ows', body, {
		headers: { 'Content-Type': 'text/xml' },
	});

	// 응답 XML 파싱 — 새 피처의 fid 가져오기
	const result = wfsFormat.readTransactionResponse(response.data);
	return result;
}

export const insertFeature = (feature) => sendTransaction([feature], null, null);
export const updateFeature = (feature) => sendTransaction(null, [feature], null);
export const deleteFeature = (feature) => sendTransaction(null, null, [feature]);
