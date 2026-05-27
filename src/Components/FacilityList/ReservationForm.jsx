import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Form, Button, Alert, Row, Col } from 'react-bootstrap';
import { useSearchParams, useNavigate } from 'react-router-dom';
import useReservationStore from '../../store/reservationStore';
import useReservationApi from '../../Hooks/Api/useReservationApi';
import './ReservationForm.style.css';
import './ReservationCalendar.css';

    const ReservationForm = ({ preSelectedFacilityId = '' }) => {
    const allFacilities = useReservationStore((s) => s.allFacilities);
    const reservations = useReservationStore((s) => s.reservations);
    const { loadAllFacilities, createReservation, loadFacilityCalendar, loadMyReservations, updateReservation } = useReservationApi();
    
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const editResId = searchParams.get('edit') || '';
    const editRes = editResId ? reservations.find(r => r.id === editResId || r.id === `res-${editResId}`) : null;

    const [form, setForm] = useState({
        facilityId: preSelectedFacilityId,
        date: new Date().toISOString().slice(0, 10),
        startTime: '09:00',
        endTime: '10:00',
        purpose: '',
        headcount: 1,
    });
    
    const [alert, setAlert] = useState(null); // { type: 'success'|'danger', message }
    const [searchTerm, setSearchTerm] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const [displayVal, setDisplayVal] = useState('');
    const dropdownRef = useRef(null);
    
    // 캘린더용 상태
    const [monthlyReservations, setMonthlyReservations] = useState([]);
    const [timeSelectStep, setTimeSelectStep] = useState(0); // 0: reset, 1: start clicked, 2: end clicked

    useEffect(() => {
        if (editRes) {
            setTimeSelectStep(2);
        } else {
            setTimeSelectStep(0);
        }
    }, [editRes, form.date, form.facilityId]);
    
    // 날짜 스트링 분해 헬퍼
    const getYearMonthDay = (dateStr) => {
        if (!dateStr) return { year: new Date().getFullYear(), month: new Date().getMonth() + 1, day: new Date().getDate() };
        const parts = dateStr.split('-');
        return {
            year: parseInt(parts[0]),
            month: parseInt(parts[1]),
            day: parseInt(parts[2]),
        };
    };

    const { year: formYear, month: formMonth, day: formDay } = getYearMonthDay(form.date);
    
    const [calendarYear, setCalendarYear] = useState(formYear);
    const [calendarMonth, setCalendarMonth] = useState(formMonth);



    useEffect(() => {
        loadMyReservations();
    }, [loadMyReservations]);

    useEffect(() => {
        if (editRes) {
            setForm({
                facilityId: editRes.facility_id,
                date: editRes.reservation_date,
                startTime: editRes.start_time,
                endTime: editRes.end_time,
                purpose: editRes.purpose || '',
                headcount: editRes.headcount || 1,
            });
        }
    }, [editRes]);

    useEffect(() => {
        loadAllFacilities();
    }, [loadAllFacilities]);

    // preSelectedFacilityId 동기화
    useEffect(() => {
        if (preSelectedFacilityId) {
            const formattedId = preSelectedFacilityId.toString().startsWith('fac-')
                ? preSelectedFacilityId
                : `fac-${preSelectedFacilityId}`;
            setForm((prev) => ({ ...prev, facilityId: formattedId }));
        }
    }, [preSelectedFacilityId]);

    // 드롭다운 바깥 클릭 감지
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // 폼 날짜가 바뀌면 달력 연/월도 자동 동기화
    useEffect(() => {
        const { year, month } = getYearMonthDay(form.date);
        setCalendarYear(year);
        setCalendarMonth(month);
    }, [form.date]);

    // 시설물, 달력 연도/월이 변경되면 해당 시설물의 캘린더 데이터 로드
    useEffect(() => {
        const fetchCalendar = async () => {
            if (form.facilityId) {
                const facIdx = parseInt(form.facilityId.replace('fac-', ''));
                if (!isNaN(facIdx)) {
                    const data = await loadFacilityCalendar(facIdx, calendarYear, calendarMonth);
                    setMonthlyReservations(data);
                }
            } else {
                setMonthlyReservations([]);
            }
        };
        fetchCalendar();
    }, [form.facilityId, calendarYear, calendarMonth, loadFacilityCalendar]);

    const filteredFacilities = allFacilities.filter((f) =>
        f.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    const selectedFacility = allFacilities.find((f) => f.id === form.facilityId) || null;

    useEffect(() => {
        if (!isOpen) {
            setDisplayVal(selectedFacility ? selectedFacility.name : '');
        }
    }, [isOpen, selectedFacility]);

    // 경고창(Alert) 발생 시 3초 뒤 자동 소멸
    useEffect(() => {
        if (alert) {
            const timer = setTimeout(() => {
                setAlert(null);
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [alert]);

    const today = new Date().toISOString().slice(0, 10);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setAlert(null);

        const { facilityId, date, startTime, endTime, purpose, headcount } = form;

        if (!facilityId || !date || !startTime || !endTime || !purpose) {
            setAlert({ type: 'danger', message: '모든 항목을 입력해 주세요.' });
            return;
        }
        if (startTime >= endTime) {
            setAlert({ type: 'danger', message: '종료 시간이 시작 시간보다 늦어야 합니다.' });
            return;
        }
        if (selectedFacility) {
            if (startTime < selectedFacility.open_time || endTime > selectedFacility.close_time) {
                setAlert({
                    type: 'danger',
                    message: `운영 시간(${selectedFacility.open_time} ~ ${selectedFacility.close_time}) 내에서만 예약 가능합니다.`,
                });
                return;
            }
        }

        let result;
        if (editRes) {
            result = await updateReservation(editRes.id, {
                facilityId,
                date,
                startTime,
                endTime,
                purpose,
                headcount: Number(headcount),
            });
        } else {
            result = await createReservation({
                facilityId,
                date,
                startTime,
                endTime,
                purpose,
                headcount: Number(headcount),
            });
        }

        setAlert({ type: result.success ? 'success' : 'danger', message: result.message });

        if (result.success) {
            if (editRes) {
                setTimeout(() => {
                    navigate('/mypage');
                }, 1500);
            } else {
                setForm({ facilityId: form.facilityId, date: form.date, startTime: '09:00', endTime: '10:00', purpose: '', headcount: 1 });
                // 예약이 성공적으로 생성되었으므로 달력 데이터 재로드
                const facIdx = parseInt(form.facilityId.replace('fac-', ''));
                if (!isNaN(facIdx)) {
                    const data = await loadFacilityCalendar(facIdx, calendarYear, calendarMonth);
                    setMonthlyReservations(data);
                }
            }
        }
    };

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

    /* ── 타임 슬롯 스케줄링 ── */
    // 시설물 요일별 운영 가능 여부와 상태 확인
    const getSelectedDateStatus = () => {
        if (!selectedFacility) return { isAvailable: false, reason: '시설을 먼저 선택해 주세요.' };
        
        // 1. 운영 시간 등록 여부 검사
        if (!selectedFacility.facility_times || selectedFacility.facility_times.length === 0) {
            return { isAvailable: false, reason: '운영 시간이 등록되지 않은 시설물입니다. 예약이 불가능합니다.' };
        }
        
        // 2. 선택일 요일 구하기
        const daysOfWeek = ['일', '월', '화', '수', '목', '금', '토'];
        const dateObj = new Date(form.date);
        const dayName = daysOfWeek[dateObj.getDay()]; // '월', '화', '수' 등
        
        // 3. 해당 요일의 운영 시간 설정 찾기
        const dayTimeInfo = selectedFacility.facility_times.find(t => t.day === dayName);
        if (!dayTimeInfo) {
            return { isAvailable: false, reason: `선택하신 요일(${dayName}요일)은 운영 정보가 등록되지 않아 예약이 불가능합니다.` };
        }
        
        if (dayTimeInfo.status === '예약불가' || dayTimeInfo.status === '점검중') {
            return { isAvailable: false, reason: `선택하신 날짜는 시설 ${dayTimeInfo.status} 상태입니다. 예약이 불가능합니다.` };
        }
        
        return { isAvailable: true, open: dayTimeInfo.open, close: dayTimeInfo.close };
    };

    const isDateAvailable = (dateStr) => {
        if (!selectedFacility) return false;
        if (!selectedFacility.facility_times || selectedFacility.facility_times.length === 0) return false;
        
        const daysOfWeek = ['일', '월', '화', '수', '목', '금', '토'];
        const dateObj = new Date(dateStr);
        const dayName = daysOfWeek[dateObj.getDay()];
        
        const dayTimeInfo = selectedFacility.facility_times.find(t => t.day === dayName);
        if (!dayTimeInfo) return false;
        
        return dayTimeInfo.status !== '예약불가' && dayTimeInfo.status !== '점검중';
    };

    const statusInfo = getSelectedDateStatus();

    const getHourlySlots = (openTime, closeTime) => {
        let startHour = 9;
        let endHour = 22;
        if (openTime) startHour = parseInt(openTime.split(':')[0]);
        if (closeTime) endHour = parseInt(closeTime.split(':')[0]);
        
        const slots = [];
        for (let h = startHour; h < endHour; h++) {
            const timeStr = `${String(h).padStart(2, '0')}:00`;
            const nextTimeStr = `${String(h + 1).padStart(2, '0')}:00`;
            slots.push({ start: timeStr, end: nextTimeStr });
        }
        return slots;
    };

    const slots = statusInfo.isAvailable ? getHourlySlots(statusInfo.open, statusInfo.close) : [];
    const dayReservations = monthlyReservations.filter((r) => {
        // 현재 수정 중인 예약인 경우 목록에서 제외하여 본인 시간 슬롯을 자유롭게 다시 클릭할 수 있도록 함
        const isEditingThisRes = editRes && (
            r.resIdx?.toString() === editRes.id.replace('res-', '') ||
            r.resIdx?.toString() === editResId.replace('res-', '')
        );
        if (isEditingThisRes) return false;
        
        const status = (r.resStatus || '').toUpperCase();
        return r.resDate === form.date &&
               status !== '취소' && status !== 'CANCELLED' && status !== 'CANCEL' &&
               status !== '거절' && status !== 'REJECTED';
    });

    const getSlotStatus = (slot) => {
        // 1. 해당 슬롯과 겹치는 예약들을 모두 찾음
        const overlappingRes = dayReservations.filter((r) => {
            const rStart = r.resStart.slice(0, 5);
            const rEnd = r.resEnd.slice(0, 5);
            return rStart < slot.end && rEnd > slot.start;
        });

        if (overlappingRes.length > 0) {
            // 승인된 예약이 하나라도 있으면 무조건 'approved' (예약 완료)
            const hasApproved = overlappingRes.some((r) => {
                const status = (r.resStatus || '').toUpperCase();
                return status === '승인' || status === 'APPROVED' || status === 'CONFIRMED' || status === '승인완료' || status === '승인 완료';
            });

            if (hasApproved) {
                return {
                    status: 'approved',
                    label: '예약 완료',
                    purpose: overlappingRes.find(r => {
                        const status = (r.resStatus || '').toUpperCase();
                        return status === '승인' || status === 'APPROVED' || status === 'CONFIRMED' || status === '승인완료' || status === '승인 완료';
                    })?.resPurpose
                };
            }

            // 승인된 것은 없고 대기만 있는 경우
            // 내 예약 목록의 resIdx 목록 세트 생성
            const myResIdxSet = new Set(reservations.map(r => r.id.replace('res-', '').toString()));
            
            // 내 대기 중 예약이 포함되어 있는지 확인
            const hasMyWaiting = overlappingRes.some((r) => myResIdxSet.has(r.resIdx?.toString()));

            if (hasMyWaiting) {
                // 본인의 대기 중 신청이 있는 경우 -> 예약 선택 불가
                return {
                    status: 'waiting-mine',
                    label: '내 예약 대기',
                    purpose: overlappingRes.find(r => myResIdxSet.has(r.resIdx?.toString()))?.resPurpose
                };
            } else {
                // 타인의 대기 중 신청만 있는 경우 -> 중복 예약 선택 가능!
                return {
                    status: 'waiting-others',
                    label: '승인 대기',
                    purpose: overlappingRes[0].resPurpose
                };
            }
        }

        return { status: 'available', label: '예약 가능' };
    };

    const isSlotSelected = (slot) => {
        if (timeSelectStep === 1) {
            return slot.start === form.startTime;
        }
        if (timeSelectStep === 2) {
            return slot.start >= form.startTime && slot.end <= form.endTime;
        }
        return false;
    };

    const handleSlotClick = (slot, status) => {
        if (status !== 'available' && status !== 'waiting-others') return;
        
        if (timeSelectStep === 0 || timeSelectStep === 2) {
            setForm((prev) => ({
                ...prev,
                startTime: slot.start,
                endTime: slot.end,
            }));
            setTimeSelectStep(1);
        } else if (timeSelectStep === 1) {
            if (slot.start > form.startTime) {
                // 시작 시간과 클릭한 종료 시간 사이에 이미 예약된 슬롯이 있는지 확인
                const hasOverlap = slots.some(s => {
                    if (s.start >= form.startTime && s.end <= slot.end) {
                        const sStatus = getSlotStatus(s).status;
                        return sStatus !== 'available' && sStatus !== 'waiting-others';
                    }
                    return false;
                });

                if (hasOverlap){
                    setAlert({ type: 'warning', message: '선택한 범위 내에 이미 예약된 시간이 포함되어 있습니다.'});
                    return;
                }

                setForm((prev) => ({
                    ...prev,
                    endTime: slot.end,
                }));
                setTimeSelectStep(2);
            } else {
                setForm((prev) => ({
                    ...prev,
                    startTime: slot.start,
                    endTime: slot.end,
                }));
                setTimeSelectStep(1);
            }
        }
    };

    const emptyCells = Array(firstDay).fill(null);
    const dayCells = Array.from({ length: daysInMonth }, (_, i) => i + 1);

    return (
        <div className="reservation-page-container">
            {alert && createPortal(
                <div className="fixed-top-alert">
                    <Alert variant={alert.type.toLowerCase()} onClose={() => setAlert(null)} dismissible>
                        {alert.message}
                    </Alert>
                </div>,
                document.body
            )}

            {/* 왼쪽: 예약 신청서 폼 */}
            <div className="reservation-card">
                <div className="section-title">{editRes ? '✍️ 예약 정보 수정' : '✍️ 예약 신청서 작성'}</div>

                <Form onSubmit={handleSubmit}>
                    {/* 시설 선택 */}
                    <Form.Group className="mb-3">
                        <Form.Label className="fw-semibold">시설 선택</Form.Label>
                        <div ref={dropdownRef} className="position-relative">
                            <Form.Control
                                type="text"
                                placeholder="🔍 시설을 선택하거나 검색하세요..."
                                value={displayVal}
                                onChange={(e) => {
                                    setSearchTerm(e.target.value);
                                    setDisplayVal(e.target.value);
                                    setIsOpen(true);
                                }}
                                onFocus={() => {
                                    setIsOpen(true);
                                    setSearchTerm('');
                                    setDisplayVal('');
                                }}
                            />
                            {isOpen && (
                                <div className="dropdown-menu show w-100" style={{
                                    maxHeight: '200px',
                                    overflowY: 'auto',
                                    boxShadow: '0 4px 15px rgba(0,0,0,0.08)',
                                    zIndex: 10
                                }}>
                                    {filteredFacilities.length === 0 ? (
                                        <div className="dropdown-item text-muted">검색 결과가 없습니다.</div>
                                    ) : (
                                        filteredFacilities.map((f) => (
                                            <button
                                                key={f.id}
                                                type="button"
                                                className="dropdown-item text-start py-2"
                                                onClick={() => {
                                                    setForm((prev) => ({ ...prev, facilityId: f.id }));
                                                    setIsOpen(false);
                                                }}
                                            >
                                                {f.name}
                                            </button>
                                        ))
                                    )}
                                </div>
                            )}
                        </div>
                    </Form.Group>

                    {/* 날짜 */}
                    <Form.Group className="mb-3">
                        <Form.Label className="fw-semibold">예약 날짜</Form.Label>
                        <Form.Control
                            type="date"
                            name="date"
                            value={form.date}
                            min={today}
                            onChange={handleChange}
                        />
                    </Form.Group>

                    {/* 시간 */}
                    <Row className="mb-3">
                        <Col>
                            <Form.Group>
                                <Form.Label className="fw-semibold">시작 시간</Form.Label>
                                <Form.Control
                                    type="time"
                                    name="startTime"
                                    value={form.startTime}
                                    step={1800}
                                    onChange={handleChange}
                                />
                            </Form.Group>
                        </Col>
                        <Col>
                            <Form.Group>
                                <Form.Label className="fw-semibold">종료 시간</Form.Label>
                                <Form.Control
                                    type="time"
                                    name="endTime"
                                    value={form.endTime}
                                    step={1800}
                                    onChange={handleChange}
                                />
                            </Form.Group>
                        </Col>
                    </Row>

                    {/* 목적 */}
                    <Form.Group className="mb-3">
                        <Form.Label className="fw-semibold">사용 목적</Form.Label>
                        <Form.Control
                            type="text"
                            name="purpose"
                            value={form.purpose}
                            placeholder="예) 체육 수업, 동아리 경기"
                            onChange={handleChange}
                        />
                    </Form.Group>

                    {/* 인원 */}
                    <Form.Group className="mb-4">
                        <Form.Label className="fw-semibold">참가 인원</Form.Label>
                        <Form.Control
                            type="number"
                            name="headcount"
                            value={form.headcount}
                            min={1}
                            max={99}
                            onChange={handleChange}
                        />
                    </Form.Group>

                    <Button type="submit" className="submit-btn w-100 py-2.5 rounded-3">
                        {editRes ? '수정 완료' : '예약 신청하기'}
                    </Button>
                </Form>
            </div>

            {/* 오른쪽: 실시간 예약 현황 스케줄러 */}
            <div className="reservation-card">
                <div className="section-title">📅 실시간 예약 현황</div>
                {selectedFacility ? (
                    <>
                        <div className="calendar-wrapper">
                            <div className="calendar-header">
                                <h5>{calendarYear}년 {calendarMonth}월</h5>
                                <div className="d-flex gap-1">
                                    <button type="button" className="calendar-nav-btn" onClick={prevMonth}>&lt;</button>
                                    <button type="button" className="calendar-nav-btn" onClick={nextMonth}>&gt;</button>
                                </div>
                            </div>
                            
                            <div className="calendar-grid">
                                <div className="calendar-day-label">일</div>
                                <div className="calendar-day-label">월</div>
                                <div className="calendar-day-label">화</div>
                                <div className="calendar-day-label">수</div>
                                <div className="calendar-day-label">목</div>
                                <div className="calendar-day-label">금</div>
                                <div className="calendar-day-label">토</div>
                                
                                {emptyCells.map((_, i) => (
                                    <div key={`empty-${i}`} className="calendar-cell empty" />
                                ))}
                                 {dayCells.map((day) => {
                                    const isSelected = formYear === calendarYear && formMonth === calendarMonth && formDay === day;
                                    const dateStr = `${calendarYear}-${String(calendarMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                                    const dRes = monthlyReservations.filter((r) => {
                                        const status = (r.resStatus || '').toUpperCase();
                                        return r.resDate === dateStr &&
                                               status !== '취소' && status !== 'CANCELLED' && status !== 'CANCEL' &&
                                               status !== '거절' && status !== 'REJECTED';
                                    });
                                    const hasApproved = dRes.some((r) => {
                                        const status = (r.resStatus || '').toUpperCase();
                                        return status === '승인' || status === 'APPROVED' || status === 'CONFIRMED' || status === '승인완료' || status === '승인 완료';
                                    });
                                    const hasWaiting = dRes.some((r) => {
                                        const status = (r.resStatus || '').toUpperCase();
                                        return status === '대기' || status === 'PENDING' || status === 'WAITING' || status === '대기중' || status === '대기 중';
                                    });
                                    const isSelectable = isDateAvailable(dateStr);

                                    return (
                                        <button
                                            key={`day-${day}`}
                                            type="button"
                                            className={`calendar-cell ${isSelected ? 'active' : ''} ${!isSelectable ? 'unavailable' : ''}`}
                                            onClick={() => {
                                                setForm((prev) => ({ ...prev, date: dateStr }));
                                            }}
                                        >
                                            {day}
                                            <div className="dot-container">
                                                {hasApproved && <span className="dot-badge approved" />}
                                                {hasWaiting && <span className="dot-badge waiting" />}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="scheduler-timetable">
                            {!statusInfo.isAvailable ? (
                                <div className="text-center py-4 text-danger fw-semibold" style={{ fontSize: 14 }}>
                                    ⚠️ {statusInfo.reason}
                                </div>
                            ) : (
                                <>
                                    <div className="timetable-title">
                                        🕒 {form.date} 시간대별 스케줄 (운영시간: {statusInfo.open} ~ {statusInfo.close})
                                    </div>
                                    
                                    <div className="timetable-grid">
                                        {slots.map((slot, idx) => {
                                            const info = getSlotStatus(slot);
                                            const isSelected = isSlotSelected(slot);
                                            return (
                                                <div
                                                    key={`slot-${idx}`}
                                                    className={`time-slot-block ${info.status} ${isSelected ? 'selected' : ''}`}
                                                    onClick={() => handleSlotClick(slot, info.status)}
                                                    title={info.purpose ? `신청 목적: ${info.purpose}` : undefined}
                                                >
                                                    <div>{slot.start}</div>
                                                    <div className="time-slot-status-text">{info.label}</div>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    <div className="timetable-legend">
                                        <div className="legend-item">
                                            <div className="legend-color available" />
                                            <span>예약 가능</span>
                                        </div>
                                        <div className="legend-item">
                                            <div className="legend-color waiting-mine" />
                                            <span>내 예약 대기</span>
                                        </div>
                                        <div className="legend-item">
                                            <div className="legend-color waiting-others" />
                                            <span>승인 대기</span>
                                        </div>
                                        <div className="legend-item">
                                            <div className="legend-color approved" />
                                            <span>예약 완료</span>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </>
                ) : (
                    <div className="text-center py-5 text-muted">
                        <p className="mb-0">🔍 좌측에서 예약할 시설물을 먼저 선택해 주세요.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ReservationForm;
