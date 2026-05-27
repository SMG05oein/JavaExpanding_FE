import React, { useEffect, useState, useCallback, useRef } from 'react';
import useAdminApi from '../../Hooks/Api/useAdminApi';
import useReservationApi from '../../Hooks/Api/useReservationApi';
import axios from 'axios';
import './AdminCalendar.css';

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
    const { loadFacilityCalendar } = useReservationApi();
    const baseURL = process.env.REACT_APP_API_URL;

    const [reservations, setReservations] = useState([]);
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState(null);
    const [rejectTarget, setRejectTarget] = useState(null); // resIdx to reject
    const toastTimer = useRef(null);

    const [viewMode, setViewMode] = useState('list'); // 'list' or 'calendar'
    const [selectedFacId, setSelectedFacId] = useState('');
    const [facilitiesList, setFacilitiesList] = useState([]);
    const [calendarYear, setCalendarYear] = useState(new Date().getFullYear());
    const [calendarMonth, setCalendarMonth] = useState(new Date().getMonth() + 1);
    const [monthlyReservations, setMonthlyReservations] = useState([]);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
    const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL', '대기', '승인', '거절', '취소'

    const showToast = (message, type = 'success') => {
        clearTimeout(toastTimer.current);
        setToast({ message, type });
        toastTimer.current = setTimeout(() => setToast(null), 3000);
    };

    // 시설 목록 로드
    useEffect(() => {
        const fetchFacilities = async () => {
            try {
                const response = await axios.get(`${baseURL}/api/facility/allList`);
                const data = response.data || [];
                setFacilitiesList(data);
                setSelectedFacId('all'); // 기본값을 전체 시설물로 설정
            } catch (err) {
                console.error('시설 목록 로드 실패', err);
            }
        };
        fetchFacilities();
    }, [baseURL]);

    const reloadCalendar = useCallback(async () => {
        if (selectedFacId) {
            try {
                const data = await loadFacilityCalendar(selectedFacId, calendarYear, calendarMonth);
                setMonthlyReservations(data || []);
            } catch (err) {
                console.error('캘린더 로드 실패', err);
            }
        }
    }, [selectedFacId, calendarYear, calendarMonth, loadFacilityCalendar]);

    useEffect(() => {
        reloadCalendar();
    }, [reloadCalendar]);

    /* ── 달력 일수 계산 ── */
    const getDaysInMonth = (year, month) => new Date(year, month, 0).getDate();
    const getFirstDayOfMonth = (year, month) => new Date(year, month - 1, 1).getDay();

    const daysInMonth = getDaysInMonth(calendarYear, calendarMonth);
    const firstDay = getFirstDayOfMonth(calendarYear, calendarMonth);

    const prevMonth = () => {
        if (calendarMonth === 1) {
            setCalendarYear((y) => y - 1);
            setCalendarMonth(12);
        } else {
            setCalendarMonth((m) => m - 1);
        }
    };

    const nextMonth = () => {
        if (calendarMonth === 12) {
            setCalendarYear((y) => y + 1);
            setCalendarMonth(1);
        } else {
            setCalendarMonth((m) => m + 1);
        }
    };

    const emptyCells = Array(firstDay).fill(null);
    const dayCells = Array.from({ length: daysInMonth }, (_, i) => i + 1);

    const load = useCallback(async (p = 0) => {
        setLoading(true);
        try {
            const data = await loadAllReservations(p);
            const content = data?.content ?? [];
            setReservations(content.map(r => {
                const status = (r.resStatus || '').toUpperCase();
                let normalizedStatus = '대기';
                if (status === '승인' || status === 'APPROVED' || status === 'CONFIRMED' || status === '승인완료' || status === '승인 완료') {
                    normalizedStatus = '승인';
                } else if (status === '거절' || status === 'REJECTED' || status === '반려' || status === '반려됨') {
                    normalizedStatus = '거절';
                } else if (status === '취소' || status === 'CANCELLED' || status === 'CANCEL' || status === '취소됨') {
                    normalizedStatus = '취소';
                }

                const userName = r.user?.userName || r.userName || '';
                const userId = r.user?.userId || r.userId || '';
                const userDisplay = userName && userId ? `${userName} (${userId})` : (userName || userId || '-');

                return {
                    resIdx: r.resIdx,
                    user: userDisplay,
                    facility: r.facility?.facName || r.facName || '-',
                    date: r.resDate,
                    start: formatTime(r.resStart),
                    end: formatTime(r.resEnd),
                    purpose: r.resPurpose || r.purpose || '-',
                    headcount: r.resHeadcount || r.resHead,
                    status: normalizedStatus,
                };
            }));
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
            reloadCalendar();
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
            reloadCalendar();
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
            reloadCalendar();
        } catch (e) {
            showToast(e.response?.data || '삭제 실패', 'error');
        }
    };

    const filteredReservations = reservations.filter(
        (r) => statusFilter === 'ALL' || r.status === statusFilter
    );

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

            {/* View Mode Toggle */}
            <div className="admin-view-tabs">
                <button
                    className={`admin-tab-btn ${viewMode === 'list' ? 'active' : ''}`}
                    onClick={() => setViewMode('list')}
                >
                    목록 뷰
                </button>
                <button
                    className={`admin-tab-btn ${viewMode === 'calendar' ? 'active' : ''}`}
                    onClick={() => setViewMode('calendar')}
                >
                    캘린더 뷰
                </button>
            </div>

            {viewMode === 'list' ? (
                <div className="admin-table-card">
                    <div className="admin-table-header" style={{ borderBottom: '1px solid #f3f4f6', paddingBottom: 16 }}>
                        <div>
                            <h5 style={{ margin: 0, fontWeight: 700 }}>전체 예약 목록</h5>
                            <div className="admin-status-filters" style={{ display: 'flex', gap: 6, marginTop: 12 }}>
                                <button
                                    type="button"
                                    className={`admin-tab-btn ${statusFilter === 'ALL' ? 'active' : ''}`}
                                    onClick={() => setStatusFilter('ALL')}
                                    style={{ padding: '4px 12px', fontSize: '12px' }}
                                >
                                    전체 ({reservations.length})
                                </button>
                                <button
                                    type="button"
                                    className={`admin-tab-btn ${statusFilter === '대기' ? 'active' : ''}`}
                                    onClick={() => setStatusFilter('대기')}
                                    style={{ padding: '4px 12px', fontSize: '12px' }}
                                >
                                    대기 중 ({reservations.filter(r => r.status === '대기').length})
                                </button>
                                <button
                                    type="button"
                                    className={`admin-tab-btn ${statusFilter === '승인' ? 'active' : ''}`}
                                    onClick={() => setStatusFilter('승인')}
                                    style={{ padding: '4px 12px', fontSize: '12px' }}
                                >
                                    승인 완료 ({reservations.filter(r => r.status === '승인').length})
                                </button>
                                <button
                                    type="button"
                                    className={`admin-tab-btn ${statusFilter === '거절' ? 'active' : ''}`}
                                    onClick={() => setStatusFilter('거절')}
                                    style={{ padding: '4px 12px', fontSize: '12px' }}
                                >
                                    반려됨 ({reservations.filter(r => r.status === '거절').length})
                                </button>
                                <button
                                    type="button"
                                    className={`admin-tab-btn ${statusFilter === '취소' ? 'active' : ''}`}
                                    onClick={() => setStatusFilter('취소')}
                                    style={{ padding: '4px 12px', fontSize: '12px' }}
                                >
                                    취소됨 ({reservations.filter(r => r.status === '취소').length})
                                </button>
                            </div>
                        </div>
                        <span style={{ fontSize: 13, color: '#9ca3af' }}>
                            페이지 {page + 1} / {totalPages}
                        </span>
                    </div>
                    <div className="admin-table-wrapper">
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>신청자</th>
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
                                ) : filteredReservations.length === 0 ? (
                                    <tr><td colSpan={9}>
                                        <div className="admin-empty-state" style={{ textAlign: 'center', padding: 32 }}>
                                            <div className="icon">📭</div>
                                            <div style={{ color: '#9ca3af', marginTop: 8 }}>해당 조건의 예약 내역이 없습니다.</div>
                                        </div>
                                    </td></tr>
                                ) : (
                                    filteredReservations.map(r => {
                                        const si = STATUS_INFO[r.status] ?? { cls: 'canceled', label: r.status };
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
            ) : (
                <div className="admin-calendar-container">
                    {/* Left Column: Calendar Card */}
                    <div className="admin-calendar-card">
                        <div className="admin-select-wrapper">
                             <select
                                 id="fac-select"
                                 className="admin-select"
                                 value={selectedFacId}
                                 onChange={(e) => setSelectedFacId(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                             >
                                 <option value="all">🌐 전체 시설물 보기</option>
                                 {facilitiesList.map((fac) => (
                                     <option key={fac.facIdx} value={fac.facIdx}>
                                         🏢 {fac.facName}
                                     </option>
                                 ))}
                            </select>
                        </div>
                        
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                            <h5 style={{ margin: 0, fontWeight: 700, fontSize: 16, color: '#1f2937' }}>
                                {calendarYear}년 {calendarMonth}월
                            </h5>
                            <div style={{ display: 'flex', gap: 6 }}>
                                <button type="button" className="admin-tab-btn" style={{ padding: '4px 10px' }} onClick={prevMonth}>&lt;</button>
                                <button type="button" className="admin-tab-btn" style={{ padding: '4px 10px' }} onClick={nextMonth}>&gt;</button>
                            </div>
                        </div>
                        
                        <div className="admin-calendar-grid">
                            <div style={{ fontWeight: 700, fontSize: 12, paddingBottom: 8, color: '#ef4444' }}>일</div>
                            <div style={{ fontWeight: 700, fontSize: 12, paddingBottom: 8, color: '#4b5563' }}>월</div>
                            <div style={{ fontWeight: 700, fontSize: 12, paddingBottom: 8, color: '#4b5563' }}>화</div>
                            <div style={{ fontWeight: 700, fontSize: 12, paddingBottom: 8, color: '#4b5563' }}>수</div>
                            <div style={{ fontWeight: 700, fontSize: 12, paddingBottom: 8, color: '#4b5563' }}>목</div>
                            <div style={{ fontWeight: 700, fontSize: 12, paddingBottom: 8, color: '#4b5563' }}>금</div>
                            <div style={{ fontWeight: 700, fontSize: 12, paddingBottom: 8, color: '#2563eb' }}>토</div>
                            
                            {emptyCells.map((_, i) => (
                                <div key={`empty-${i}`} className="admin-calendar-cell empty" />
                            ))}
                            {dayCells.map((day) => {
                                const dateStr = `${calendarYear}-${String(calendarMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                                const isActive = selectedDate === dateStr;
                                const isToday = new Date().toISOString().slice(0, 10) === dateStr;
                                
                                 const dayRes = monthlyReservations.filter((r) => {
                                     const status = (r.resStatus || '').toUpperCase();
                                     return r.resDate === dateStr &&
                                            status !== '취소' && status !== 'CANCELLED' && status !== 'CANCEL' &&
                                            status !== '거절' && status !== 'REJECTED';
                                 });
                                 const approvedCount = dayRes.filter((r) => {
                                     const status = (r.resStatus || '').toUpperCase();
                                     return status === '승인' || status === 'APPROVED' || status === 'CONFIRMED' || status === '승인완료' || status === '승인 완료';
                                 }).length;
                                 const waitingCount = dayRes.filter((r) => {
                                     const status = (r.resStatus || '').toUpperCase();
                                     return status === '대기' || status === 'PENDING' || status === 'WAITING' || status === '대기중' || status === '대기 중';
                                 }).length;

                                return (
                                    <div
                                        key={`day-${day}`}
                                        className={`admin-calendar-cell ${isActive ? 'active' : ''} ${isToday ? 'today' : ''}`}
                                        onClick={() => setSelectedDate(dateStr)}
                                    >
                                        <span className="day-num">{day}</span>
                                        <div className="admin-cell-pills">
                                            {approvedCount > 0 && (
                                                <span className="cell-pill approved">승인 {approvedCount}건</span>
                                            )}
                                            {waitingCount > 0 && (
                                                <span className="cell-pill waiting">대기 {waitingCount}건</span>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Right Column: Detailed reservation info */}
                    <div className="admin-detail-card">
                        <div className="admin-detail-title">
                            📅 {selectedDate} 예약 상세 현황
                        </div>
                        <div className="admin-detail-list">
                            {monthlyReservations.filter(r => r.resDate === selectedDate).length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '48px 0', color: '#9ca3af' }}>
                                    선택한 날짜에 예약이 없습니다.
                                </div>
                            ) : (
                                monthlyReservations
                                    .filter(r => r.resDate === selectedDate)
                                    .map((r) => {
                                        const status = (r.resStatus || '').toUpperCase();
                                        let matchedStatus = '대기';
                                        if (status === '승인' || status === 'APPROVED' || status === 'CONFIRMED' || status === '승인완료' || status === '승인 완료') {
                                            matchedStatus = '승인';
                                        } else if (status === '거절' || status === 'REJECTED' || status === '반려' || status === '반려됨') {
                                            matchedStatus = '거절';
                                        } else if (status === '취소' || status === 'CANCELLED' || status === 'CANCEL' || status === '취소됨') {
                                            matchedStatus = '취소';
                                        }
                                        const statusInfo = STATUS_INFO[matchedStatus] || { cls: 'waiting', label: r.resStatus || '대기' };
                                        return (
                                            <div key={r.resIdx} className="admin-detail-item">
                                                <div className="admin-detail-item-header">
                                                    <span className="admin-detail-id">#{r.resIdx}</span>
                                                    <span className={`status-badge ${statusInfo.cls}`}>
                                                        {statusInfo.label}
                                                    </span>
                                                </div>
                                                <div className="admin-detail-info">
                                                    <div><strong>시설물:</strong> {r.facName || r.facility || '-'}</div>
                                                    <div><strong>신청자:</strong> {r.userName || r.user?.userName || r.user?.userId || r.userId || r.user || '-'}</div>
                                                    <div><strong>시간:</strong> {formatTime(r.resStart)} ~ {formatTime(r.resEnd)}</div>
                                                    <div><strong>인원:</strong> {r.resHeadcount || r.resHead || r.headcount ? `${r.resHeadcount || r.resHead || r.headcount}명` : '-'}</div>
                                                    <div><strong>목적:</strong> {r.resPurpose || r.purpose || '-'}</div>
                                                </div>
                                                <div className="admin-detail-actions">
                                                    {matchedStatus !== '승인' && matchedStatus !== '취소' && (
                                                        <button
                                                            className="admin-action-btn approve"
                                                            onClick={() => handleApprove(r.resIdx)}
                                                        >
                                                            승인
                                                        </button>
                                                    )}
                                                    {matchedStatus !== '거절' && matchedStatus !== '취소' && (
                                                        <button
                                                            className="admin-action-btn reject"
                                                            onClick={() => handleReject(r.resIdx)}
                                                        >
                                                            반려
                                                        </button>
                                                    )}
                                                    <button
                                                        className="admin-action-btn delete"
                                                        onClick={() => handleDelete(r.resIdx)}
                                                    >
                                                        삭제
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminReservations;
