import { useState, useRef, useEffect } from 'react';
import Draw from 'ol/interaction/Draw';
import Modify from 'ol/interaction/Modify';
import Select from 'ol/interaction/Select';
import Snap from 'ol/interaction/Snap';
import { click } from 'ol/events/condition';
import { Style, Fill, Stroke } from 'ol/style';
import { insertFeature, updateFeature, deleteFeature } from './wfst';

// 편집 중 임시 스타일 (점선 + 반투명) — 아직 저장 안 됨
const draftStyle = new Style({
	fill: new Fill({ color: 'rgba(245, 158, 11, 0.25)' }),
	stroke: new Stroke({ color: '#d97706', width: 2, lineDash: [4, 4] }),
});

export default function EditToolbar({ map, vectorSource, wmsSource }) {
	const [mode, setMode] = useState(null);
	const [pendingChanges, setPendingChanges] = useState([]); // 저장 대기 중인 변경사항
	const interactionRef = useRef(null);
	const snapRef = useRef(null);
	const selectRef = useRef(null);
	const historyRef = useRef([]); // Undo 스택
	const redoRef = useRef([]);    // Redo 스택

	// Snap은 항상 활성화
	useEffect(() => {
		const snap = new Snap({ source: vectorSource });
		map.addInteraction(snap);
		snapRef.current = snap;
		return () => map.removeInteraction(snap);
	}, [map, vectorSource]);

	// 키보드 단축키 (Ctrl+Z / Ctrl+Y)
	useEffect(() => {
		const handler = (e) => {
		if (!(e.ctrlKey || e.metaKey)) return;
		if (e.key === 'z') { e.preventDefault(); undo(); }
		if (e.key === 'y') { e.preventDefault(); redo(); }
		};
		window.addEventListener('keydown', handler);
		return () => window.removeEventListener('keydown', handler);
	}, []);

	// 기존 인터랙션 제거
	const clearInteraction = () => {
		if (interactionRef.current) {
			map.removeInteraction(interactionRef.current);
			interactionRef.current = null;
		}
		if (selectRef.current) {
			selectRef.current.getFeatures().clear();
			map.removeInteraction(selectRef.current);
			selectRef.current = null;
		}
	};

	// 폴리곤 그리기 모드
	const activateDraw = () => {
		clearInteraction();
		const draw = new Draw({ source: vectorSource, type: 'MultiPolygon', geometryName: 'geom' });

		draw.on('drawend', (event) => {
			const feature = event.feature;
			feature.setStyle(draftStyle); // 임시 스타일 (아직 저장 안 됨)

			// 저장 대기 목록에 추가
			setPendingChanges((prev) => [
				...prev,
				{ type: 'insert', feature },
			]);
		});

		map.addInteraction(draw);
		interactionRef.current = draw;
		setMode('Polygon');
	};

	// 수정 모드
	const activateModify = () => {
		clearInteraction();
		const modify = new Modify({ source: vectorSource, geometryName: 'geom' });

		modify.on('modifystart', (event) => {
			event.features.forEach((f) => {
				f.set('_originalGeom', f.getGeometry().clone(), true);
			});
		});

		modify.on('modifyend', (event) => {
			event.features.forEach((feature) => {
				const original = feature.get('_originalGeom');
				feature.setStyle(draftStyle); // 수정됨을 표시

				// 이미 대기 목록에 있는지 확인 (중복 방지)
				const exists = pendingChanges.find(
					(p) => p.type === 'update' && p.feature === feature
				);

				if (!exists) {
					setPendingChanges((prev) => [
						...prev,
						{ type: 'update', feature, original },
					]);
				}
				feature.unset('_originalGeom', true);
			});
		});

		map.addInteraction(modify);
		interactionRef.current = modify;
		setMode('Modify');
	};

	// 선택 모드
	const activateSelect = () => {
		clearInteraction();
		const select = new Select({ condition: click });
		map.addInteraction(select);
		selectRef.current = select;
		setMode('Select');
	};

	// 선택된 피처 삭제 (즉시 적용)
	const deleteSelected = async () => {
		if (!selectRef.current) {
			alert('먼저 [선택] 모드에서 피처를 선택해주세요.');
			return;
		}
		const features = selectRef.current.getFeatures().getArray();
		if (features.length === 0) {
			alert('삭제할 피처를 먼저 선택해주세요.');
			return;
		}

		if (!confirm(`${features.length}개의 피처를 삭제하시겠습니까?`)) return;

		for (const feature of [...features]) {
			try {
				await deleteFeature(feature);
				vectorSource.removeFeature(feature);
				historyRef.current.push({ type: 'delete', feature });
				redoRef.current = [];

			} catch (err) {
				console.error('삭제 실패:', err);
				alert('피처 삭제에 실패했습니다.');
			}
		}
		wmsSource.updateParams({ '_t': Date.now() });
		selectRef.current.getFeatures().clear();
	};

	// 💾 저장 버튼: 대기 중인 변경사항 일괄 처리
	const saveAll = async () => {
		if (pendingChanges.length === 0) {
			alert('저장할 변경사항이 없습니다.');
			return;
		}

		const confirmed = confirm(
			`${pendingChanges.length}개의 변경사항을 저장하시겠습니까?`
		);
		if (!confirmed) return;

		let successCount = 0;

		for (const change of pendingChanges) {
			try {
				if (change.type === 'insert') {
					const result = await insertFeature(change.feature);
					if (result?.insertIds?.[0]) {
						change.feature.setId(result.insertIds[0]);
					}
					change.feature.setStyle(null); // 저장됨 → 기본 스타일
					historyRef.current.push({ type: 'insert', feature: change.feature });
					successCount++;
				} else if (change.type === 'update') {
					await updateFeature(change.feature);
					change.feature.setStyle(null); // 저장됨 → 기본 스타일
					historyRef.current.push({
						type: 'update',
						feature: change.feature,
						original: change.original,
					});
					successCount++;
				}
			} catch (err) {
				console.error('저장 실패:', err);
				alert(`저장 중 오류가 발생했습니다:\n${err.message}`);
				break;
			}
		}

		// 성공한 항목만큼 제거
		setPendingChanges((prev) => prev.slice(successCount));
		redoRef.current = [];

		wmsSource.updateParams({ '_t': Date.now() });

		if (successCount > 0) {
			alert(`${successCount}개 항목이 저장되었습니다.`);
		}
	};

	// Undo
	const undo = async () => {
		const last = historyRef.current.pop();
		if (!last) return;

		try {
			if (last.type === 'insert') {
				await deleteFeature(last.feature);
				vectorSource.removeFeature(last.feature);
			} else if (last.type === 'update') {
				const current = last.feature.getGeometry().clone();
				last.feature.setGeometry(last.original);
				await updateFeature(last.feature);
				last.original = current;
			} else if (last.type === 'delete') {
				vectorSource.addFeature(last.feature);
				await insertFeature(last.feature);
			}
			redoRef.current.push(last);
		} catch (err) {
			console.error('Undo 실패:', err);
		}
	};

	// Redo
	const redo = async () => {
		const next = redoRef.current.pop();
		if (!next) return;

		try {
			if (next.type === 'insert') {
				vectorSource.addFeature(next.feature);
				await insertFeature(next.feature);
			} else if (next.type === 'update') {
				const current = next.feature.getGeometry().clone();
				next.feature.setGeometry(next.original);
				await updateFeature(next.feature);
				next.original = current;
			} else if (next.type === 'delete') {
				await deleteFeature(next.feature);
				vectorSource.removeFeature(next.feature);
			}
			historyRef.current.push(next);
		} catch (err) {
			console.error('Redo 실패:', err);
		}
	};

	const btnClass = (type) => (mode === type ? 'active' : '');

	return (
		<div className="toolbar">
			<button className={btnClass('Polygon')} onClick={activateDraw}>
				⬡ 폴리곤 그리기
			</button>
			<div className="divider" />
			<button className={btnClass('Modify')} onClick={activateModify}>
				✏ 수정
			</button>
			<button className={btnClass('Select')} onClick={activateSelect}>
				👆 선택
			</button>
			<button onClick={deleteSelected}>🗑 삭제</button>
			<div className="divider" />
			<button onClick={saveAll} style={{ fontWeight: 'bold' }}>
				💾 저장 {pendingChanges.length > 0 && `(${pendingChanges.length})`}
			</button>
			<div className="divider" />
			<button onClick={undo} title="Ctrl+Z">↶ Undo</button>
			<button onClick={redo} title="Ctrl+Y">↷ Redo</button>
		</div>
	);
}