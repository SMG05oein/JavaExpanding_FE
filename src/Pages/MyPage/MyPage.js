import React, { useEffect } from 'react';
import { Container, Row, Col, Card, Badge, Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import useLoginStatus from '../../Hooks/Status/useLoginStatus';
import useReservationStore from '../../store/reservationStore';
import MyReservations from '../../Components/FacilityList/MyReservations';
import './MyPage.style.css';

const MyPage = () => {
    const navigate = useNavigate();
    const { isLoggedIn, user, fetchUser } = useLoginStatus();
    const { reservations, loadMyReservations, loadFacilities } = useReservationStore();

    useEffect(() => {
        if (!isLoggedIn) {
            alert('로그인이 필요한 페이지입니다. 로그인 페이지로 이동합니다.');
            navigate('/login');
            return;
        }

        // 유저 정보 및 예약 목록 최신화
        fetchUser();
        loadFacilities();
        loadMyReservations();
    }, [isLoggedIn, navigate, fetchUser, loadFacilities, loadMyReservations]);

    if (!isLoggedIn || !user) {
        return (
            <div className="mypage-loading d-flex justify-content-center align-items-center" style={{ minHeight: '80vh' }}>
                <Spinner animation="border" variant="primary" />
                <span className="ms-3 text-muted">사용자 정보를 불러오는 중...</span>
            </div>
        );
    }

    // 통계 정보 계산
    const userReservations = reservations;
    const stats = {
        total: userReservations.length,
        pending: userReservations.filter((r) => r.status === 'PENDING').length,
        approved: userReservations.filter((r) => r.status === 'APPROVED').length,
        cancelled: userReservations.filter((r) => r.status === 'CANCELLED' || r.status === 'REJECTED').length,
    };

    return (
        <div className="mypage-wrapper py-5">
            <Container>
                {/* 헤더 타이틀 */}
                <div className="mypage-header mb-5">
                    <h2 className="mypage-title">마이페이지</h2>
                    <p className="mypage-subtitle text-muted">내 예약 현황 및 회원 정보를 확인하고 관리할 수 있습니다.</p>
                </div>

                <Row className="g-4">
                    {/* 좌측: 회원 프로필 카드 */}
                    <Col xs={12} lg={4}>
                        <Card className="profile-card border-0 shadow-sm overflow-hidden mb-4">
                            <div className="profile-card-header text-center py-4">
                                <div className="profile-avatar mb-3">
                                    {user.name ? user.name[0] : 'U'}
                                </div>
                                <h4 className="profile-name mb-1">{user.name} 학우님</h4>
                                <Badge bg="primary" className="profile-badge px-3 py-2 rounded-pill">
                                    {user.role === 'ADMIN' ? '관리자' : '학내 구성원 (학생)'}
                                </Badge>
                            </div>
                            <Card.Body className="p-4 bg-white">
                                <h5 className="section-small-title mb-3">내 정보</h5>
                                <div className="info-list">
                                    <div className="info-item d-flex justify-content-between mb-3 border-bottom pb-2">
                                        <span className="text-muted">학번/아이디</span>
                                        <strong>{user.id}</strong>
                                    </div>
                                    <div className="info-item d-flex justify-content-between mb-3 border-bottom pb-2">
                                        <span className="text-muted">이메일</span>
                                        <strong>{user.email || '미등록'}</strong>
                                    </div>
                                    <div className="info-item d-flex justify-content-between pb-1">
                                        <span className="text-muted">소속 대학</span>
                                        <strong>백석대학교</strong>
                                    </div>
                                </div>
                            </Card.Body>
                        </Card>

                        {/* 통계 요약 카드 */}
                        <Card className="stats-summary-card border-0 shadow-sm p-4 bg-white">
                            <h5 className="section-small-title mb-4">예약 요약</h5>
                            <Row className="g-3 text-center">
                                <Col xs={6}>
                                    <div className="stat-box p-3 bg-light rounded-3">
                                        <div className="stat-count text-primary">{stats.total}</div>
                                        <div className="stat-label text-muted font-size-sm">총 신청 건수</div>
                                    </div>
                                </Col>
                                <Col xs={6}>
                                    <div className="stat-box p-3 bg-light rounded-3">
                                        <div className="stat-count text-warning">{stats.pending}</div>
                                        <div className="stat-label text-muted font-size-sm">승인 대기</div>
                                    </div>
                                </Col>
                                <Col xs={6}>
                                    <div className="stat-box p-3 bg-light rounded-3">
                                        <div className="stat-count text-success">{stats.approved}</div>
                                        <div className="stat-label text-muted font-size-sm">이용/승인 완료</div>
                                    </div>
                                </Col>
                                <Col xs={6}>
                                    <div className="stat-box p-3 bg-light rounded-3">
                                        <div className="stat-count text-secondary">{stats.cancelled}</div>
                                        <div className="stat-label text-muted font-size-sm">취소/반려</div>
                                    </div>
                                </Col>
                            </Row>
                        </Card>
                    </Col>

                    {/* 우측: 내 예약 리스트 */}
                    <Col xs={12} lg={8}>
                        <Card className="reservations-list-card border-0 shadow-sm p-4 bg-white">
                            <h4 className="section-medium-title mb-4">내 예약 내역</h4>
                            <MyReservations userId={user.id} />
                        </Card>
                    </Col>
                </Row>
            </Container>
        </div>
    );
};

export default MyPage;
