import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import useAdminApi from '../../Hooks/Api/useAdminApi';

const FAC_DAYS   = ['월', '화', '수', '목', '금', '토', '일'];
const FAC_STATUS = ['운영중', '예약불가', '점검중'];

const STATUS_CLS = {
    '운영중':  'approved',
    '예약불가': 'rejected',
    '점검중':  'waiting',
};

const EMPTY_FORM = { facDay: '월', facOpen: '09:00', facClose: '18:00', facTimeStatus: '운영중' };

const Toast = ({ toast }) =>
    toast ? <div className={`admin-toast ${toast.type}`}>{toast.message}</div> : null;

/* ── 등록/수정 모달 ── */
const TimeModal = ({ facIdx, initial, onSave, onClose }) => {
    const isEdit = !!initial;
    const [form, setForm] = useState(
        isEdit
            ? {
                facDay: initial.facDay,
                facOpen: formatTimeStr(initial.facOpen),
                facClose: formatTimeStr(initial.facClose),
                facTimeStatus: initial.facTimeStatus,
            }
            : EMPTY_FORM
    );

    function formatTimeStr(t) {
        if (!t) return '09:00';
        if (typeof t === 'string') return t.slice(0, 5);
        const h = String(t.hour ?? 0).padStart(2, '0');
        const m = String(t.minute ?? 0).padStart(2, '0');
        return `${h}:${m}`;
    }

    const handle = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

    const handleSubmit = e => {
        e.preventDefault();
        onSave({ facIdx, ...form });
    };

    return (
        <div className="admin-modal-backdrop">
            <div className="admin-modal-box">
                <h5>{isEdit ? '운영 시간 수정' : '운영 시간 등록'}</h5>
                <form onSubmit={handleSubmit}>
                    {/* 요일 */}
                    <div className="admin-form-group">
                        <label>요일</label>
                        <select name="facDay" value={form.facDay} onChange={handle}>
                            {FAC_DAYS.map(d => <option key={d} value={d}>{d}요일</option>)}
                        </select>
                    </div>

                    {/* 시간 */}
                    <div style={{ display: 'flex', gap: 12 }}>
                        <div className="admin-form-group" style={{ flex: 1 }}>
                            <label>오픈 시간</label>
                            <input type="time" name="facOpen" value={form.facOpen} onChange={handle} required />
                        </div>
                        <div className="admin-form-group" style={{ flex: 1 }}>
                            <label>마감 시간</label>
                            <input type="time" name="facClose" value={form.facClose} onChange={handle} required />
                        </div>
                    </div>

                    {/* 상태 */}
                    <div className="admin-form-group">
                        <label>상태</label>
                        <select name="facTimeStatus" value={form.facTimeStatus} onChange={handle}>
                            {FAC_STATUS.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>

                    <div className="admin-modal-actions">
                        <button type="button" className="admin-btn-secondary" onClick={onClose}>취소</button>
                        <button type="submit" className="admin-btn-primary">
                            {isEdit ? '수정 완료' : '등록'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

/* ── 메인 페이지 ── */
const AdminFacilityTimes = () => {
    const { facIdx } = useParams();
    const navigate   = useNavigate();
    const { loadFacilityTimes, createFacilityTime, updateFacilityTime, deleteFacilityTime } = useAdminApi();

    const [times,   setTimes]   = useState([]);
    const [facName, setFacName] = useState(`시설물 #${facIdx}`);
    const [loading, setLoading] = useState(true);
    const [toast,   setToast]   = useState(null);
    const [modal,   setModal]   = useState(null); // null | { mode:'create' } | { mode:'edit', time }
    const toastTimer = useRef(null);

    const showToast = (msg, type = 'success') => {
        clearTimeout(toastTimer.current);
        setToast({ message: msg, type });
        toastTimer.current = setTimeout(() => setToast(null), 3000);
    };

    const formatTimeStr = (t) => {
        if (!t) return '-';
        if (typeof t === 'string') return t.slice(0, 5);
        const h = String(t.hour ?? 0).padStart(2, '0');
        const m = String(t.minute ?? 0).padStart(2, '0');
        return `${h}:${m}`;
    };

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const data = await loadFacilityTimes(facIdx);
            const list = Array.isArray(data) ? data : [];
            setTimes(list);
            if (list[0]?.facility?.facName) setFacName(list[0].facility.facName);
        } catch (e) {
            showToast('운영 시간 목록 로딩 실패', 'error');
        } finally {
            setLoading(false);
        }
    }, [loadFacilityTimes, facIdx]);

    useEffect(() => { load(); }, [load]);

    const handleCreate = async (form) => {
        try {
            await createFacilityTime(form);
            showToast('운영 시간이 등록되었습니다.');
            setModal(null);
            load();
        } catch (e) {
            showToast(e.response?.data || '등록 실패', 'error');
        }
    };

    const handleUpdate = async (form) => {
        try {
            await updateFacilityTime(modal.time.facTimeIdx, form);
            showToast('운영 시간이 수정되었습니다.');
            setModal(null);
            load();
        } catch (e) {
            showToast(e.response?.data || '수정 실패', 'error');
        }
    };

    const handleDelete = async (t) => {
        if (!window.confirm(`${t.facDay}요일 운영 시간을 삭제하시겠습니까?`)) return;
        try {
            await deleteFacilityTime(t.facTimeIdx);
            showToast('삭제되었습니다.');
            load();
        } catch (e) {
            showToast(e.response?.data || '삭제 실패', 'error');
        }
    };

    /* 요일 순 정렬 */
    const sortedTimes = [...times].sort(
        (a, b) => FAC_DAYS.indexOf(a.facDay) - FAC_DAYS.indexOf(b.facDay)
    );

    return (
        <div>
            <Toast toast={toast} />
            {modal && (
                <TimeModal
                    facIdx={Number(facIdx)}
                    initial={modal.mode === 'edit' ? modal.time : null}
                    onSave={modal.mode === 'edit' ? handleUpdate : handleCreate}
                    onClose={() => setModal(null)}
                />
            )}

            {/* 헤더 */}
            <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 16 }}>
                <button
                    onClick={() => navigate('/admin/facilities')}
                    style={{
                        background: 'none', border: '1px solid #e5e7eb',
                        borderRadius: 8, padding: '6px 14px', cursor: 'pointer',
                        fontSize: 13, color: '#6b7280', display: 'flex', alignItems: 'center', gap: 6
                    }}
                >
                    ← 시설물 목록
                </button>
                <div>
                    <h2 style={{ fontSize: 22, fontWeight: 800, color: '#111827', margin: 0 }}>
                        운영 시간 관리
                    </h2>
                    <p style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>
                        <strong>{facName}</strong>의 요일별 운영 시간을 설정합니다.
                    </p>
                </div>
            </div>

            {/* 요일 요약 카드 */}
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 24 }}>
                {FAC_DAYS.map(day => {
                    const t = times.find(x => x.facDay === day);
                    return (
                        <div key={day} style={{
                            background: '#fff',
                            border: '1px solid #e5e7eb',
                            borderRadius: 12,
                            padding: '14px 18px',
                            minWidth: 110,
                            textAlign: 'center',
                            boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
                        }}>
                            <div style={{ fontSize: 16, fontWeight: 800, color: '#111827', marginBottom: 6 }}>
                                {day}
                            </div>
                            {t ? (
                                <>
                                    <div style={{ fontSize: 12, color: '#374151', fontWeight: 600 }}>
                                        {formatTimeStr(t.facOpen)} ~ {formatTimeStr(t.facClose)}
                                    </div>
                                    <span className={`status-badge ${STATUS_CLS[t.facTimeStatus] || 'waiting'}`}
                                        style={{ marginTop: 6, display: 'inline-block' }}>
                                        {t.facTimeStatus}
                                    </span>
                                </>
                            ) : (
                                <div style={{ fontSize: 12, color: '#9ca3af' }}>미설정</div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* 상세 테이블 */}
            <div className="admin-table-card">
                <div className="admin-table-header">
                    <h5>운영 시간 목록</h5>
                    <button
                        className="admin-btn-primary"
                        onClick={() => setModal({ mode: 'create' })}
                    >
                        + 운영 시간 추가
                    </button>
                </div>
                <div className="admin-table-wrapper">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>요일</th>
                                <th>오픈 시간</th>
                                <th>마감 시간</th>
                                <th>상태</th>
                                <th>관리</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={6} style={{ textAlign: 'center', padding: 48, color: '#9ca3af' }}>로딩 중...</td></tr>
                            ) : sortedTimes.length === 0 ? (
                                <tr><td colSpan={6}>
                                    <div className="admin-empty-state">
                                        <div className="icon">🕐</div>
                                        <div>등록된 운영 시간이 없습니다.<br />오른쪽 위 버튼으로 추가하세요.</div>
                                    </div>
                                </td></tr>
                            ) : (
                                sortedTimes.map(t => (
                                    <tr key={t.facTimeIdx}>
                                        <td style={{ fontWeight: 600, color: '#6366f1' }}>#{t.facTimeIdx}</td>
                                        <td style={{ fontWeight: 700, fontSize: 15 }}>{t.facDay}요일</td>
                                        <td>{formatTimeStr(t.facOpen)}</td>
                                        <td>{formatTimeStr(t.facClose)}</td>
                                        <td>
                                            <span className={`status-badge ${STATUS_CLS[t.facTimeStatus] || 'waiting'}`}>
                                                {t.facTimeStatus}
                                            </span>
                                        </td>
                                        <td style={{ whiteSpace: 'nowrap' }}>
                                            <button
                                                className="admin-action-btn edit"
                                                onClick={() => setModal({ mode: 'edit', time: t })}
                                            >수정</button>
                                            <button
                                                className="admin-action-btn delete"
                                                onClick={() => handleDelete(t)}
                                            >삭제</button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AdminFacilityTimes;
