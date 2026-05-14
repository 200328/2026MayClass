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

export default function EditToolbar({
    map, vectorSource, wmsSource
}) {
    const [mode, setMode] = useState(null);
    const [pendingChanges, setPendingChanges] = useState([]);

    const interactionRef = useRef(null);
    const snapRef = useRef(null);
    const selectRef = useRef(null);
    const historyRef = useRef([]); // Undo
    const redoRef = useRef([]);    // Redo

    // ... 함수들 ...
    // Snap은 항상 활성화
    useEffect(() => {
        const snap = new Snap({
            source: vectorSource
        });
        map.addInteraction(snap);
        snapRef.current = snap;
        return () => map.removeInteraction(snap);
    }, [map, vectorSource]);

    // 키보드 단축키 (Ctrl+Z / Ctrl+Y)
    useEffect(() => {
        const handler = (e) => {
            if (!(e.ctrlKey || e.metaKey)) return;
            if (e.key === 'z') {
                e.preventDefault();
                undo();
            }
            if (e.key === 'y') {
                e.preventDefault();
                redo();
            }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener(
            'keydown', handler
        );
    }, []);

    const activateDraw = () => {
        clearInteraction();
        const draw = new Draw({
            source: vectorSource, type: 'MultiPolygon', geometryName: 'geom'
        });

        draw.on('drawend', (event) => {
            const feature = event.feature;
            feature.setStyle(draftStyle);
            setPendingChanges((prev) => [
                ...prev,
                { type: 'insert', feature },
            ]);
        });
        map.addInteraction(draw);
        interactionRef.current = draw;
        setMode('Polygon');
    };

    const activateModify = () => {
        clearInteraction();
        const modify = new Modify({
            source: vectorSource,
            geometryName: 'geom',
        });
        modify.on('modifystart', (e) => {
            e.features.forEach((f) =>
                f.set('_originalGeom',
                    f.getGeometry().clone(), true));
        });
        modify.on('modifyend', (e) => {
            e.features.forEach((feature) => {
                feature.setStyle(draftStyle);
                // exists 체크 후 pending에 update
                setPendingChanges((prev) => [...prev,
                {
                    type: 'update', feature,
                    original: feature.get('_originalGeom')
                }]);
            });
        });
        map.addInteraction(modify);
        interactionRef.current = modify;
        setMode('Modify');
    };

    //기존 인터렉션 제거
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

    const activateSelect = () => {
        clearInteraction();
        const select = new Select({
            condition: click
        });
        map.addInteraction(select);
        selectRef.current = select;
        setMode('Select');
    };

    const deleteSelected = async () => {
        // 검증 + confirm (생략)
        if (!selectRef.current) return;
        const features = selectRef.current.getFeatures().getArray();
        if (features.length === 0) return;
        if (!confirm(`${features.length}개 삭제?`)) return;

        // 즉시 서버 삭제 + history 푸시
        for (const feature of [...features]) {
            try {
                await deleteFeature(feature);
                vectorSource.removeFeature(feature);
                historyRef.current.push({
                    type: 'delete', feature
                });
                redoRef.current = [];
            } catch (err) { alert('삭제 실패'); }
        }
        // WMS 캐시 무효화 + 선택 해제
        wmsSource.updateParams({ '_t': Date.now() });
        selectRef.current.getFeatures().clear();
    };

    const saveAll = async () => {
        // ① 빈 배열 체크 + ② 확인 다이얼로그
        if (pendingChanges.length === 0) {
            alert('저장할 변경사항이 없습니다.');
            return;
        }
        if (!confirm(`${pendingChanges.length}개 ` +
            `변경사항을 저장하시겠습니까?`)) return;

        let successCount = 0;
        for (const change of pendingChanges) {
            try {
                // ③ insert 분기
                if (change.type === 'insert') {
                    const result = await insertFeature(change.feature);
                    // 새 fid 부여
                    if (result?.insertIds?.[0]) {
                        change.feature.setId(result.insertIds[0]);
                    }
                    // ④ 스타일 복귀 + history 푸시
                    change.feature.setStyle(null);
                    historyRef.current.push({
                        type: 'insert',
                        feature: change.feature
                    });
                    successCount++;
                }
                // (update 분기는 우측 →)
                // ③ update 분기
                else if (change.type === 'update') {
                    await updateFeature(change.feature);
                    // ④ 스타일 복귀 + history
                    change.feature.setStyle(null);
                    historyRef.current.push({
                        type: 'update',
                        feature: change.feature,
                        original: change.original
                    });
                    successCount++;
                }
            } catch (err) {
                alert(`저장 중 오류: ${err.message}`);
                break;  // 실패 시 중단
            }
        }
        // 성공한 항목만큼 pending 제거
        setPendingChanges((prev) => prev.slice(successCount));
        redoRef.current = [];

        // ⑤ WMS 캐시 무효화
        wmsSource.updateParams({ '_t': Date.now() });

        if (successCount > 0) {
            alert(`${successCount}개 저장 완료`);
        }

    };

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
                last.original = current; // swap
            } else if (last.type === 'delete') {
                vectorSource.addFeature(last.feature);
                await insertFeature(last.feature);
            }
            redoRef.current.push(last);
        } catch (err) {
            console.error('Undo 실패:', err);
        }
    };
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
