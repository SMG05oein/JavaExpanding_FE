import React, { useEffect, useState, useCallback, useRef } from 'react';
import useAdminApi from '../../Hooks/Api/useAdminApi';

const STATUS_INFO = {
    '대기': { cls: 'waiting',  label: '승인 대기' },
    '승인': { cls: 'approved', label: '승인 완료' },
    '거절': { cls: 'rejected', label: '반려됨'    },
    '취소': { cls: 'canceled', label: '취소됨'    },
};

const formatTime = (time) => {
    if (!time) return '';
    if (typeof time === 'string') return time.slice(0, 5);
    const h = String(time.hour ?? 0).padStart(2, '0');
    const m = String(time.minute ?? 0).padStart(2, '0');
    return `${h}:${m}`;
};

/* ── Toast ── */
const Toast = ({ toast }) => (
    toast ? <div className={`admin-toast ${toast.type}`}>{toast.message}</div> : null
);

/* ── 반려 사유 모달 ── */
const RejectModal = ({ onConfirm, onCancel }) => {
    const [comment, setComment] = useState('');
    return (
        <div className="admin-modal-backdrop">
            <div className="admin-modal-box">
                <h5>예약 반려</h5>
                <div className="admin-form-group">
                    <label>반려 사유 (선택)</label>
                    <textarea
                        rows={3}
                        value={comment}
                        onChange={e => setComment(e.target.value)}
                        placeholder="반려 사유를 입력하세요..."
                    />
                </div>
                <div className="admin-modal-actions">
                    <button className="admin-btn-secondary" onClick={onCancel}>취소</button>
                    <button className="admin-btn-danger" onClick={() => onConfirm(comment)}>반려 처리</button>
                </div>
            </div>
        </div>
    );
};

const AdminReservations = () => {
    const { loadAllReservations, deleteReservation, processApproval } = useAdminApi();
    const [reservations, setReservations] = useState([]);
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState(null);
    const [rejectTarget, setRejectTarget] = useState(null); // resIdx to reject
    const toastTimer = useRef(null);

    const showToast = (message, type = 'success') => {
        clearTimeout(toastTimer.current);
        setToast({ message, type });
        toastTimer.current = setTimeout(() => setToast(null), 3000);
    };

    const load = useCallback(async (p = 0) => {
        setLoading(true);
        try {
            const data = await loadAllReservations(p);
            const content = data?.content ?? [];
            setReservations(content.map(r => ({
                resIdx: r.resIdx,
                user: r.user?.userId || r.userId || '-',
                facility: r.facility?.facName || '-',
                date: r.resDate,
                start: formatTime(r.resStart),
                end: formatTime(r.resEnd),
                purpose: r.resPurpose || '-',
                headcount: r.resHeadcount,
                status: r.resStatus || '대기',
            })));
            setTotalPages(data?.totalPages ?? 1);
        } catch (e) {
            showToast('예약 목록 로딩 실패', 'error');
        } finally {
            setLoading(false);
        }
    }, [loadAllReservations]);

    useEffect(() => { load(page); }, [load, page]);

    const handleApprove = async (resIdx) => {
        if (!window.confirm('이 예약을 승인하시겠습니까?')) return;
        try {
            await processApproval({ resIdx, appIsApprov: true, appComment: '' });
            showToast('예약이 승인되었습니다.');
            load(page);
        } catch (e) {
            showToast(e.response?.data || '승인 처리 실패', 'error');
        }
    };

    const handleReject = (resIdx) => {
        setRejectTarget(resIdx);
    };

    const confirmReject = async (comment) => {
        try {
            await processApproval({ resIdx: rejectTarget, appIsApprov: false, appComment: comment });
            showToast('예약이 반려되었습니다.');
            setRejectTarget(null);
            load(page);
        } catch (e) {
            showToast(e.response?.data || '반려 처리 실패', 'error');
        }
    };

    const handleDelete = async (resIdx) => {
        if (!window.confirm(`예약 #${resIdx}을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`)) return;
        try {
            await deleteReservation(resIdx);
            showToast('예약이 삭제되었습니다.');
            load(page);
        } catch (e) {
            showToast(e.response?.data || '삭제 실패', 'error');
        }
    };

    return (
        <div>
            <Toast toast={toast} />
            {rejectTarget !== null && (
                <RejectModal
                    onConfirm={confirmReject}
                    onCancel={() => setRejectTarget(null)}
                />
            )}

            <div style={{ marginBottom: 24 }}>
                <h2 style={{ fontSize: 22, fontWeight: 800, color: '#111827', margin: 0 }}>예약 관리</h2>
                <p style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>
                    전체 예약 목록을 조회하고 승인·반려·삭제할 수 있습니다.
                </p>
            </div>

            <div className="admin-table-card">
                <div className="admin-table-header">
                    <h5>전체 예약 목록</h5>
                    <span style={{ fontSize: 13, color: '#9ca3af' }}>
                        페이지 {page + 1} / {totalPages}
                    </span>
                </div>
                <div className="admin-table-wrapper">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>예약자</th>
                                <th>시설</th>
                                <th>날짜</th>
                                <th>시간</th>
                                <th>인원</th>
                                <th>목적</th>
                                <th>상태</th>
                                <th>처리</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={9} style={{ textAlign: 'center', padding: 48, color: '#9ca3af' }}>로딩 중...</td></tr>
                            ) : reservations.length === 0 ? (
                                <tr><td colSpan={9}>
                                    <div className="admin-empty-state">
                                        <div className="icon">📭</div>
                                        <div>예약 내역이 없습니다.</div>
                                    </div>
                                </td></tr>
                            ) : (
                                reservations.map(r => {
                                    const si = STATUS_INFO[r.status] ?? { cls: 'canceled', label: r.status };
                                    const canProcess = r.status === '대기';
                                    return (
                                        <tr key={r.resIdx}>
                                            <td style={{ fontWeight: 600, color: '#6366f1' }}>#{r.resIdx}</td>
                                            <td>{r.user}</td>
                                            <td>{r.facility}</td>
                                            <td style={{ whiteSpace: 'nowrap' }}>{r.date}</td>
                                            <td style={{ whiteSpace: 'nowrap' }}>{r.start} ~ {r.end}</td>
                                            <td>{r.headcount}명</td>
                                            <td style={{ maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.purpose}</td>
                                            <td><span className={`status-badge ${si.cls}`}>{si.label}</span></td>
                                            <td style={{ whiteSpace: 'nowrap' }}>
                                                {r.status !== '승인' && r.status !== '취소' && (
                                                    <button className="admin-action-btn approve" onClick={() => handleApprove(r.resIdx)}>승인</button>
                                                )}
                                                {r.status !== '거절' && r.status !== '취소' && (
                                                    <button className="admin-action-btn reject" onClick={() => handleReject(r.resIdx)}>반려</button>
                                                )}
                                                <button className="admin-action-btn delete" onClick={() => handleDelete(r.resIdx)}>삭제</button>
                                            </td>
                                        </tr>
                                    );
                                })
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

export default AdminReservations;
