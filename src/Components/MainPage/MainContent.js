import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Row, Col, Badge, Card, Button } from 'react-bootstrap';
import useLoginStatus from '../../Hooks/Status/useLoginStatus';
import useReservationStore from '../../store/reservationStore';
import './MainContent.style.css';

const MainContent = () => {
    const navigate = useNavigate();
    const { isLoggedIn } = useLoginStatus();
    const { facilities, reservations } = useReservationStore();

    // 통계 산출
    const stats = {
        available: facilities.filter((f) => f.status === 'AVAILABLE').length,
        pending: reservations.filter((r) => r.status === 'PENDING' || r.status === '대기').length,
        total: facilities.length,
    };

    // 상위 3개 시설물 미리보기용으로 추출
    const featuredFacilities = facilities.slice(0, 3);

    const handleScrollToGuide = () => {
        const guideSection = document.getElementById('guide-section');
        if (guideSection) {
            guideSection.scrollIntoView({ behavior: 'smooth' });
        }
    };

    return (
        <div className="main-content-dashboard">
            {/* 1. 히어로 섹션 */}
            <section className="hero-section">
                <div className="hero-overlay"></div>
                <Container className="hero-container text-center">
                    <span className="hero-badge">BU Integrated Reservation System</span>
                    <h1 className="hero-title animate-fade-in">
                        백석대학교 <span className="highlight">시설물 통합 예매</span>
                    </h1>
                    <p className="hero-subtitle">
                        {isLoggedIn ? (
                            <>학우님, 반갑습니다! 오늘 예약할 시설을 골라보세요.<br />실시간 시설 현황을 확인하고 빠르게 신청 가능합니다.</>
                        ) : (
                            <>야외 구장, 실내 체육관 등 교내 주요 체육 시설을<br />실시간으로 확인하고 쉽고 빠르게 예약하세요.</>
                        )}
                    </p>
                    <div className="hero-buttons d-flex justify-content-center gap-3">
                        <Button
                            className="btn-primary-custom"
                            onClick={() => navigate('/futsal')}
                        >
                            시설 예약하러 가기
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="ms-2" viewBox="0 0 16 16">
                                <path fillRule="evenodd" d="M1 8a.5.5 0 0 1 .5-.5h11.793l-3.147-3.146a.5.5 0 0 1 .708-.708l4 4a.5.5 0 0 1 0 .708l-4 4a.5.5 0 0 1-.708-.708L13.293 8.5H1.5A.5.5 0 0 1 1 8z" />
                            </svg>
                        </Button>
                        <Button
                            className="btn-outline-custom"
                            onClick={handleScrollToGuide}
                        >
                            이용 방법 가이드
                        </Button>
                    </div>
                </Container>
            </section>

            {/* 2. 대시보드 스탯 카드 섹션 */}
            <section className="stats-section">
                <Container>
                    <Row className="g-4 justify-content-center">
                        <Col xs={12} md={4}>
                            <div className="custom-stat-card">
                                <div className="stat-icon-wrapper bg-success-light">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="#198754" viewBox="0 0 16 16">
                                        <path d="M2 1a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H2zm6 4.707V10.5a.5.5 0 0 1-1 0V5.707L5.354 7.354a.5.5 0 1 1-.708-.708l2.5-2.5a.5.5 0 0 1 .708 0l2.5 2.5a.5.5 0 0 1-.708.708L8 5.707z" />
                                    </svg>
                                </div>
                                <div className="stat-info">
                                    <div className="stat-value text-success">{stats.available}</div>
                                    <div className="stat-title">예약 가능 시설</div>
                                    <div className="stat-desc">현재 바로 이용할 수 있는 시설입니다.</div>
                                </div>
                            </div>
                        </Col>
                        <Col xs={12} md={4}>
                            <div className="custom-stat-card">
                                <div className="stat-icon-wrapper bg-warning-light">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="#ffc107" viewBox="0 0 16 16">
                                        <path d="M8 3.5a.5.5 0 0 0-1 0V9a.5.5 0 0 0 .252.434l3.5 2a.5.5 0 0 0 .496-.868L8 8.71V3.5z" />
                                        <path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16zm7-8A7 7 0 1 1 1 8a7 7 0 0 1 14 0z" />
                                    </svg>
                                </div>
                                <div className="stat-info">
                                    <div className="stat-value text-warning">{stats.pending}</div>
                                    <div className="stat-title">승인 대기 건수</div>
                                    <div className="stat-desc">관리자 승인을 기다리는 예약 신청입니다.</div>
                                </div>
                            </div>
                        </Col>
                        <Col xs={12} md={4}>
                            <div className="custom-stat-card">
                                <div className="stat-icon-wrapper bg-primary-light">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="#003a78" viewBox="0 0 16 16">
                                        <path d="M1 4.5A1.5 1.5 0 0 1 2.5 3h11A1.5 1.5 0 0 1 15 4.5v7a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 1 11.5v-7zM2.5 4a.5.5 0 0 0-.5.5v7a.5.5 0 0 0 .5.5h11a.5.5 0 0 0 .5-.5v-7a.5.5 0 0 0-.5-.5h-11z" />
                                        <path d="M4 8a1 1 0 1 1 2 0 1 1 0 0 1-2 0zm5 0a1 1 0 1 1 2 0 1 1 0 0 1-2 0z" />
                                    </svg>
                                </div>
                                <div className="stat-info">
                                    <div className="stat-value text-primary">{stats.total}</div>
                                    <div className="stat-title">전체 등록 시설</div>
                                    <div className="stat-desc">본 시스템에서 예약 관리 중인 시설 총합입니다.</div>
                                </div>
                            </div>
                        </Col>
                    </Row>
                </Container>
            </section>

            {/* 3. 추천 시설 목록 섹션 */}
            <section className="featured-section py-5">
                <Container>
                    <div className="section-header text-center mb-5">
                        <h2 className="section-title">대표 시설 현황</h2>
                        <p className="section-subtitle">현재 학우들이 가장 많이 이용하는 백석대 이용 시설을 확인해보세요.</p>
                    </div>

                    <Row className="g-4">
                        {featuredFacilities.map((facility) => {
                            const isAvailable = facility.status === 'AVAILABLE';
                            const badgeBg = isAvailable ? 'success' : facility.status === 'MAINTENANCE' ? 'warning' : 'danger';
                            const badgeLabel = isAvailable ? '사용 가능' : facility.status === 'MAINTENANCE' ? '점검 중' : '사용 불가';

                            return (
                                <Col xs={12} lg={4} key={facility.id}>
                                    <Card className="facility-preview-card border-0 h-100 shadow-sm">
                                        <Card.Body className="d-flex flex-column p-4">
                                            <div className="d-flex justify-content-between align-items-center mb-3">
                                                <Badge bg={badgeBg} className="px-3 py-2 rounded-pill font-weight-500">
                                                    {badgeLabel}
                                                </Badge>
                                                <span className="facility-loc text-muted font-size-sm">
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" className="me-1 align-text-top" viewBox="0 0 16 16">
                                                        <path d="M8 16s6-5.686 6-10A6 6 0 0 0 2 6c0 4.314 6 10 6 10zm0-7a3 3 0 1 1 0-6 3 3 0 0 1 0 6z" />
                                                    </svg>
                                                    {facility.location}
                                                </span>
                                            </div>
                                            <Card.Title className="facility-name-title mb-2 font-weight-bold">
                                                {facility.name}
                                            </Card.Title>
                                            <Card.Text className="facility-description-text text-muted mb-4 flex-grow-1">
                                                {facility.description || '이 시설물에 대한 세부 설명이 등록되어 있지 않습니다.'}
                                            </Card.Text>
                                            <div className="facility-specs mb-4 p-3 bg-light rounded-3 font-size-sm">
                                                <div className="d-flex justify-content-between mb-1">
                                                    <span className="text-muted">수용 인원</span>
                                                    <strong>최대 {facility.capacity}명</strong>
                                                </div>
                                                <div className="d-flex justify-content-between">
                                                    <span className="text-muted">운영 시간</span>
                                                    <strong>{facility.open_time} ~ {facility.close_time}</strong>
                                                </div>
                                            </div>
                                            <Button
                                                variant={isAvailable ? 'primary' : 'secondary'}
                                                className={`w-100 py-2 border-0 btn-card ${!isAvailable ? 'disabled' : ''}`}
                                                disabled={!isAvailable}
                                                onClick={() => navigate('/futsal')}
                                            >
                                                {isAvailable ? '지금 예약 신청하기' : '예약 불가'}
                                            </Button>
                                        </Card.Body>
                                    </Card>
                                </Col>
                            );
                        })}
                    </Row>
                </Container>
            </section>

            {/* 4. 이용 가이드 섹션 */}
            <section id="guide-section" className="guide-section py-5 bg-white">
                <Container>
                    <div className="section-header text-center mb-5">
                        <h2 className="section-title">쉽고 편리한 이용 방법</h2>
                        <p className="section-subtitle">네 단계의 절차만 거치면 예약을 쉽고 빠르게 완료하실 수 있습니다.</p>
                    </div>

                    <Row className="g-4 step-timeline">
                        <Col xs={12} md={3} className="step-item text-center">
                            <div className="step-number-circle">01</div>
                            <h4 className="step-title mt-3">로그인 및 본인인증</h4>
                            <p className="step-desc text-muted px-2">학번 또는 교직원 메일로 로그인하여 학내 구성원 인증을 완료합니다.</p>
                        </Col>
                        <Col xs={12} md={3} className="step-item text-center">
                            <div className="step-number-circle">02</div>
                            <h4 className="step-title mt-3">시설 및 날짜 조회</h4>
                            <p className="step-desc text-muted px-2">원하는 시설의 상세 사양과 실시간 예약 가능한 타임라인을 확인합니다.</p>
                        </Col>
                        <Col xs={12} md={3} className="step-item text-center">
                            <div className="step-number-circle">03</div>
                            <h4 className="step-title mt-3">사용 정보 입력</h4>
                            <p className="step-desc text-muted px-2">사용 목적, 인원 및 신청 시간을 입력하여 예약 양식을 송신합니다.</p>
                        </Col>
                        <Col xs={12} md={3} className="step-item text-center">
                            <div className="step-number-circle">04</div>
                            <h4 className="step-title mt-3">예약 승인 및 이용</h4>
                            <p className="step-desc text-muted px-2">관리자의 최종 확인 및 승인 절차를 거쳐 예약증 발급 후 시설을 이용합니다.</p>
                        </Col>
                    </Row>
                </Container>
            </section>

            {/* 5. 공지사항 및 자주 묻는 질문 */}
            <section className="notice-faq-section py-5">
                <Container>
                    <Row className="g-5">
                        {/* 공지사항 */}
                        <Col xs={12} lg={6}>
                            <div className="section-header mb-4 d-flex justify-content-between align-items-center">
                                <h3 className="sub-section-title mb-0">공지사항</h3>
                                <span className="view-all text-primary font-size-sm" style={{ cursor: 'pointer' }} onClick={() => alert('공지사항 전체 페이지 개발 중')}>
                                    전체보기
                                    <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" fill="currentColor" className="ms-1" viewBox="0 0 16 16">
                                        <path fillRule="evenodd" d="M3.646 1.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1 0 .708l-6 6a.5.5 0 0 1-.708-.708L9.293 8 3.646 2.354a.5.5 0 0 1 0-.708z" />
                                    </svg>
                                </span>
                            </div>
                            <div className="notice-list shadow-sm rounded-4 bg-white p-2">
                                <div className="notice-item p-3 border-bottom d-flex justify-content-between align-items-center">
                                    <div className="notice-content">
                                        <Badge bg="danger" className="me-2">중요</Badge>
                                        <span className="notice-text">체육시설(A/B구장) 이용 수칙 안내 및 청결 유지 요청</span>
                                    </div>
                                    <span className="notice-date text-muted font-size-sm">2026.05.15</span>
                                </div>
                                <div className="notice-item p-3 border-bottom d-flex justify-content-between align-items-center">
                                    <div className="notice-content">
                                        <span className="notice-text">B구장 야간 LED 조명 정기 검사 일정 안내 (5/22)</span>
                                    </div>
                                    <span className="notice-date text-muted font-size-sm">2026.05.10</span>
                                </div>
                                <div className="notice-item p-3 border-bottom d-flex justify-content-between align-items-center">
                                    <div className="notice-content">
                                        <span className="notice-text">C구장(실내체육관) 바닥 샌딩 작업 완료 및 이용 재개 건</span>
                                    </div>
                                    <span className="notice-date text-muted font-size-sm">2026.05.02</span>
                                </div>
                                <div className="notice-item p-3 d-flex justify-content-between align-items-center">
                                    <div className="notice-content">
                                        <span className="notice-text">개인 예매 가능 한도 및 단체 예약 변경 규정 안내</span>
                                    </div>
                                    <span className="notice-date text-muted font-size-sm">2026.04.28</span>
                                </div>
                            </div>
                        </Col>

                        {/* FAQ/문의처 */}
                        <Col xs={12} lg={6}>
                            <div className="section-header mb-4">
                                <h3 className="sub-section-title">신속 고객 지원 및 문의</h3>
                            </div>
                            <div className="faq-contact-card shadow-sm rounded-4 bg-white p-4">
                                <h5 className="font-weight-bold mb-3">자주 발생하는 예약 문제</h5>
                                <div className="faq-item mb-3">
                                    <strong className="text-primary font-size-sm">Q. 예약을 했는데 '승인 대기' 상태는 어떻게 되나요?</strong>
                                    <p className="text-muted font-size-sm mt-1">A. 일부 시설은 관리자의 학부/팀 인증 심사가 필요합니다. 통상 영업시간 기준 2시간 이내에 처리됩니다.</p>
                                </div>
                                <div className="faq-item mb-4">
                                    <strong className="text-primary font-size-sm">Q. 예약 시간 연장은 가능한가요?</strong>
                                    <p className="text-muted font-size-sm mt-1">A. 뒷 시간대에 예약 신청 건이 없는 경우, 마이페이지에서 최대 2시간까지 추가 연장이 가능합니다.</p>
                                </div>

                                <div className="contact-details p-3 bg-light rounded-3 d-flex align-items-center gap-3">
                                    <div className="contact-icon bg-primary text-white rounded-circle p-2 d-flex justify-content-center align-items-center" style={{ width: '40px', height: '40px' }}>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
                                            <path d="M1.885.511a1.745 1.745 0 0 1 2.61.163L6.29 2.98c.329.423.445.974.315 1.494l-.547 2.19a.678.678 0 0 0 .178.643l2.457 2.457a.678.678 0 0 0 .644.178l2.189-.547a1.745 1.745 0 0 1 1.494.315l2.306 1.794c.829.645.905 1.87.163 2.611l-1.034 1.034c-.74.74-1.846 1.065-2.877.702a18.634 18.634 0 0 1-7.01-4.42 18.634 18.634 0 0 1-4.42-7.009c-.362-1.03-.037-2.137.703-2.877L1.885.511z" />
                                        </svg>
                                    </div>
                                    <div className="contact-info">
                                        <div className="font-weight-bold font-size-sm">예약 및 시설 관리팀</div>
                                        <div className="text-muted font-size-xs">Tel: 041-550-XXXX | 내선번호: XXXX</div>
                                    </div>
                                </div>
                            </div>
                        </Col>
                    </Row>
                </Container>
            </section>
        </div>
    );
};

export default MainContent;