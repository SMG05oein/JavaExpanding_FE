import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import useAdminApi from '../../Hooks/Api/useAdminApi';

const Toast = ({ toast }) => (
    toast ? <div className={`admin-toast ${toast.type}`}>{toast.message}</div> : null
);

const EMPTY_FORM = { facName: '', facLocation: '', facDescription: '' };

/* ── 시설 등록/수정 모달 ── */
const FacilityModal = ({ initial, onSave, onClose }) => {
    const [form, setForm] = useState(initial ?? EMPTY_FORM);
    const isEdit = !!initial;

    const handleChange = e =>
        setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

    const handleSubmit = e => {
        e.preventDefault();
        if (!form.facName.trim() || !form.facLocation.trim()) return;
        onSave(form);
    };

    return (
        <div className="admin-modal-backdrop">
            <div className="admin-modal-box">
                <h5>{isEdit ? '시설물 수정' : '시설물 등록'}</h5>
                <form onSubmit={handleSubmit}>
                    <div className="admin-form-group">
                        <label>시설명 *</label>
                        <input
                            name="facName"
                            value={form.facName}
                            onChange={handleChange}
                            placeholder="예) 본부동 세미나실"
                            required
                        />
                    </div>
                    <div className="admin-form-group">
                        <label>위치 *</label>
                        <input
                            name="facLocation"
                            value={form.facLocation}
                            onChange={handleChange}
                            placeholder="예) 본부동 3층"
                            required
                        />
                    </div>
                    <div className="admin-form-group">
                        <label>설명</label>
                        <textarea
                            name="facDescription"
                            value={form.facDescription}
                            onChange={handleChange}
                            rows={3}
                            placeholder="시설물에 대한 설명을 입력하세요..."
                        />
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

const AdminFacilities = () => {
    const navigate = useNavigate();
    const { loadFacilitiesAdmin, createFacility, updateFacility, deleteFacility } = useAdminApi();
    const [facilities, setFacilities] = useState([]);
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState(null);
    const [modal, setModal] = useState(null); // null | { mode: 'create' } | { mode: 'edit', facility }
    const toastTimer = useRef(null);

    const showToast = (message, type = 'success') => {
        clearTimeout(toastTimer.current);
        setToast({ message, type });
        toastTimer.current = setTimeout(() => setToast(null), 3000);
    };

    const load = useCallback(async (p = 0) => {
        setLoading(true);
        try {
            const data = await loadFacilitiesAdmin(p);
            const content = data?.content ?? [];
            setFacilities(content.map(f => ({
                facIdx: f.facIdx,
                name: f.facName,
                location: f.facLocation,
                description: f.facDescription || '',
            })));
            setTotalPages(data?.totalPages ?? 1);
        } catch (e) {
            showToast('시설물 목록 로딩 실패', 'error');
        } finally {
            setLoading(false);
        }
    }, [loadFacilitiesAdmin]);

    useEffect(() => { load(page); }, [load, page]);

    const handleCreate = async (form) => {
        try {
            await createFacility(form);
            showToast('시설물이 등록되었습니다.');
            setModal(null);
            load(page);
        } catch (e) {
            showToast(e.response?.data || '등록 실패', 'error');
        }
    };

    const handleUpdate = async (form) => {
        try {
            await updateFacility(modal.facility.facIdx, form);
            showToast('시설물 정보가 수정되었습니다.');
            setModal(null);
            load(page);
        } catch (e) {
            showToast(e.response?.data || '수정 실패', 'error');
        }
    };

    const handleDelete = async (facIdx, name) => {
        if (!window.confirm(`"${name}" 시설물을 삭제하시겠습니까?`)) return;
        try {
            await deleteFacility(facIdx);
            showToast('시설물이 삭제되었습니다.');
            load(page);
        } catch (e) {
            showToast(e.response?.data || '삭제 실패', 'error');
        }
    };

    return (
        <div>
            <Toast toast={toast} />
            {modal && (
                <FacilityModal
                    initial={modal.mode === 'edit' ? {
                        facName: modal.facility.name,
                        facLocation: modal.facility.location,
                        facDescription: modal.facility.description,
                    } : null}
                    onSave={modal.mode === 'edit' ? handleUpdate : handleCreate}
                    onClose={() => setModal(null)}
                />
            )}

            <div style={{ marginBottom: 24 }}>
                <h2 style={{ fontSize: 22, fontWeight: 800, color: '#111827', margin: 0 }}>시설물 관리</h2>
                <p style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>
                    시설물을 등록·수정·삭제할 수 있습니다.
                </p>
            </div>

            <div className="admin-table-card">
                <div className="admin-table-header">
                    <h5>시설물 목록</h5>
                    <button
                        className="admin-btn-primary"
                        onClick={() => setModal({ mode: 'create' })}
                    >
                        + 시설물 등록
                    </button>
                </div>
                <div className="admin-table-wrapper">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>시설명</th>
                                <th>위치</th>
                                <th>설명</th>
                                <th>관리</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={5} style={{ textAlign: 'center', padding: 48, color: '#9ca3af' }}>로딩 중...</td></tr>
                            ) : facilities.length === 0 ? (
                                <tr><td colSpan={5}>
                                    <div className="admin-empty-state">
                                        <div className="icon">🏢</div>
                                        <div>등록된 시설물이 없습니다.</div>
                                    </div>
                                </td></tr>
                            ) : (
                                facilities.map(f => (
                                    <tr key={f.facIdx}>
                                        <td style={{ fontWeight: 600, color: '#6366f1' }}>#{f.facIdx}</td>
                                        <td style={{ fontWeight: 600 }}>{f.name}</td>
                                        <td>{f.location}</td>
                                        <td style={{ color: '#6b7280', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {f.description || '-'}
                                        </td>
                                        <td style={{ whiteSpace: 'nowrap' }}>
                                            <button
                                                className="admin-action-btn"
                                                style={{ background: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0', marginRight: 4 }}
                                                onClick={() => navigate(`/admin/facilities/${f.facIdx}/times`)}
                                            >⏰ 운영시간</button>
                                            <button
                                                className="admin-action-btn edit"
                                                onClick={() => setModal({ mode: 'edit', facility: f })}
                                            >수정</button>
                                            <button
                                                className="admin-action-btn delete"
                                                onClick={() => handleDelete(f.facIdx, f.name)}
                                            >삭제</button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="admin-pagination">
                        <button className="admin-page-btn" onClick={() => setPage(p => p - 1)} disabled={page === 0}>‹</button>
                        {Array.from({ length: totalPages }, (_, i) => (
                            <button
                                key={i}
                                className={`admin-page-btn ${i === page ? 'active' : ''}`}
                                onClick={() => setPage(i)}
                            >{i + 1}</button>
                        ))}
                        <button className="admin-page-btn" onClick={() => setPage(p => p + 1)} disabled={page >= totalPages - 1}>›</button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminFacilities;
