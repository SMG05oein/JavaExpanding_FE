import React, { useEffect, useState, useCallback } from 'react';
import useAdminApi from '../../Hooks/Api/useAdminApi';

const STAT_CARDS = [
    { key: 'total',    label: '전체 예약',      icon: '📋', color: '#eef2ff', iconColor: '#6366f1' },
    { key: 'waiting',  label: '승인 대기',      icon: '⏳', color: '#fef9c3', iconColor: '#ca8a04' },
    { key: 'approved', label: '승인 완료',      icon: '✅', color: '#dcfce7', iconColor: '#16a34a' },
    { key: 'facilities',label: '등록 시설물 수', icon: '🏢', color: '#f0fdf4', iconColor: '#15803d' },
];

const AdminDashboard = () => {
    const { loadAllReservations, loadFacilitiesAdmin } = useAdminApi();
    const [stats, setStats] = useState({ total: 0, waiting: 0, approved: 0, facilities: 0 });
    const [recentReservations, setRecentReservations] = useState([]);
    const [loading, setLoading] = useState(true);

    const formatTime = (time) => {
        if (!time) return '';
        if (typeof time === 'string') return time.slice(0, 5);
        const h = String(time.hour ?? 0).padStart(2, '0');
        const m = String(time.minute ?? 0).padStart(2, '0');
        return `${h}:${m}`;
    };

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const [resData, facData] = await Promise.all([
                loadAllReservations(0),
                loadFacilitiesAdmin(0),
            ]);

            const content = resData?.content ?? [];
            const waiting  = content.filter(r => r.resStatus === '대기').length;
            const approved = content.filter(r => r.resStatus === '승인').length;
            const facCount = facData?.totalElements ?? facData?.content?.length ?? 0;

            setStats({
                total: resData?.totalElements ?? content.length,
                waiting,
                approved,
                facilities: facCount,
            });

            setRecentReservations(content.slice(0, 5).map(r => ({
                id: r.resIdx,
                user: r.user?.userId || r.userId || '-',
                facility: r.facility?.facName || '-',
                date: r.resDate,
                start: formatTime(r.resStart),
                end: formatTime(r.resEnd),
                status: r.resStatus || '대기',
            })));
        } catch (e) {
            console.error('대시보드 로딩 실패', e);
        } finally {
            setLoading(false);
        }
    }, [loadAllReservations, loadFacilitiesAdmin]);

    useEffect(() => { load(); }, [load]);

    const STATUS_INFO = {
        '대기': { cls: 'waiting',  label: '승인 대기' },
        '승인': { cls: 'approved', label: '승인 완료' },
        '거절': { cls: 'rejected', label: '반려됨'    },
        '취소': { cls: 'canceled', label: '취소됨'    },
    };

    return (
        <div>
            {/* 페이지 헤더 */}
            <div style={{ marginBottom: 24 }}>
                <h2 style={{ fontSize: 22, fontWeight: 800, color: '#111827', margin: 0 }}>
                    관리자 대시보드
                </h2>
                <p style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>
                    예약 현황 및 시설물 정보를 한눈에 확인하세요.
                </p>
            </div>

            {/* 통계 카드 */}
            <div className="admin-stat-grid">
                {STAT_CARDS.map(({ key, label, icon, color, iconColor }) => (
                    <div className="admin-stat-card" key={key}>
                        <div className="admin-stat-icon" style={{ background: color }}>
                            <span style={{ fontSize: 22 }}>{icon}</span>
                        </div>
                        <div className="admin-stat-info">
                            <h3>{loading ? '...' : stats[key]}</h3>
                            <p>{label}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* 최근 예약 목록 */}
            <div className="admin-table-card">
                <div className="admin-table-header">
                    <h5>최근 예약 현황</h5>
                    <a href="/admin/reservations" style={{ fontSize: 13, color: '#6366f1', textDecoration: 'none' }}>
                        전체 보기 →
                    </a>
                </div>
                <div className="admin-table-wrapper">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>예약 ID</th>
                                <th>예약자</th>
                                <th>시설</th>
                                <th>날짜</th>
                                <th>시간</th>
                                <th>상태</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40, color: '#9ca3af' }}>로딩 중...</td></tr>
                            ) : recentReservations.length === 0 ? (
                                <tr><td colSpan={6}>
                                    <div className="admin-empty-state">
                                        <div className="icon">📭</div>
                                        <div>예약 내역이 없습니다.</div>
                                    </div>
                                </td></tr>
                            ) : (
                                recentReservations.map(r => {
                                    const si = STATUS_INFO[r.status] ?? { cls: 'canceled', label: r.status };
                                    return (
                                        <tr key={r.id}>
                                            <td style={{ fontWeight: 600, color: '#6366f1' }}>#{r.id}</td>
                                            <td>{r.user}</td>
                                            <td>{r.facility}</td>
                                            <td>{r.date}</td>
                                            <td>{r.start} ~ {r.end}</td>
                                            <td><span className={`status-badge ${si.cls}`}>{si.label}</span></td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
