import React, { useEffect, useState, useCallback, useRef } from 'react';
import useAdminApi from '../../Hooks/Api/useAdminApi';

const formatTime = (time) => {
    if (!time) return '';
    if (typeof time === 'string') return time.slice(0, 5);
    const h = String(time.hour ?? 0).padStart(2, '0');
    const m = String(time.minute ?? 0).padStart(2, '0');
    return `${h}:${m}`;
};

const Toast = ({ toast }) => (
    toast ? <div className={`admin-toast ${toast.type}`}>{toast.message}</div> : null
);

const AdminApprovals = () => {
    const { loadApprovals } = useAdminApi();
    const [approvals, setApprovals] = useState([]);
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState(null);
    const toastTimer = useRef(null);

    const showToast = (message, type = 'success') => {
        clearTimeout(toastTimer.current);
        setToast({ message, type });
        toastTimer.current = setTimeout(() => setToast(null), 3000);
    };

    const load = useCallback(async (p = 0) => {
        setLoading(true);
        try {
            const data = await loadApprovals(p);
            const content = data?.content ?? [];
            setApprovals(content.map(a => ({
                appIdx: a.appIdx,
                resIdx: a.reservation?.resIdx || a.resIdx || '-',
                user: a.reservation?.user?.userId || a.userId || '-',
                facility: a.reservation?.facility?.facName || '-',
                date: a.reservation?.resDate || '-',
                start: formatTime(a.reservation?.resStart),
                end: formatTime(a.reservation?.resEnd),
                isApproved: a.appIsApprov,
                comment: a.appComment || '',
                processedAt: a.appCreateDt || '',
            })));
            setTotalPages(data?.totalPages ?? 1);
        } catch (e) {
            showToast('승인 내역 로딩 실패', 'error');
        } finally {
            setLoading(false);
        }
    }, [loadApprovals]);

    useEffect(() => { load(page); }, [load, page]);

    return (
        <div>
            <Toast toast={toast} />

            <div style={{ marginBottom: 24 }}>
                <h2 style={{ fontSize: 22, fontWeight: 800, color: '#111827', margin: 0 }}>승인 내역</h2>
                <p style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>
                    예약 승인·반려 처리 내역을 조회합니다.
                </p>
            </div>

            <div className="admin-table-card">
                <div className="admin-table-header">
                    <h5>승인/반려 내역</h5>
                    <span style={{ fontSize: 13, color: '#9ca3af' }}>
                        페이지 {page + 1} / {totalPages || 1}
                    </span>
                </div>
                <div className="admin-table-wrapper">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>승인 ID</th>
                                <th>예약 ID</th>
                                <th>예약자</th>
                                <th>시설</th>
                                <th>날짜</th>
                                <th>시간</th>
                                <th>결과</th>
                                <th>코멘트</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={8} style={{ textAlign: 'center', padding: 48, color: '#9ca3af' }}>로딩 중...</td></tr>
                            ) : approvals.length === 0 ? (
                                <tr><td colSpan={8}>
                                    <div className="admin-empty-state">
                                        <div className="icon">📭</div>
                                        <div>승인 처리 내역이 없습니다.</div>
                                    </div>
                                </td></tr>
                            ) : (
                                approvals.map(a => (
                                    <tr key={a.appIdx}>
                                        <td style={{ fontWeight: 600, color: '#6366f1' }}>#{a.appIdx}</td>
                                        <td>#{a.resIdx}</td>
                                        <td>{a.user}</td>
                                        <td>{a.facility}</td>
                                        <td style={{ whiteSpace: 'nowrap' }}>{a.date}</td>
                                        <td style={{ whiteSpace: 'nowrap' }}>{a.start} ~ {a.end}</td>
                                        <td>
                                            {a.isApproved
                                                ? <span className="status-badge approved">승인</span>
                                                : <span className="status-badge rejected">반려</span>
                                            }
                                        </td>
                                        <td style={{ color: '#6b7280', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {a.comment || '-'}
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

export default AdminApprovals;
