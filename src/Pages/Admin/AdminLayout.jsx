import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import useLoginStatus from '../../Hooks/Status/useLoginStatus';
import './Admin.style.css';

const NAV_ITEMS = [
    { to: '/admin',              label: '대시보드',    icon: '📊', end: true },
    { to: '/admin/reservations', label: '예약 관리',   icon: '📋' },
    { to: '/admin/facilities',   label: '시설물 관리', icon: '🏢' },
];

const AdminLayout = () => {
    const { logout } = useLoginStatus();
    const navigate   = useNavigate();

    const handleLogout = () => {
        if (window.confirm('로그아웃 하시겠습니까?')) {
            logout();
            navigate('/login');
        }
    };

    return (
        <div className="admin-wrapper">
            {/* ── Sidebar ── */}
            <aside className="admin-sidebar">
                <div className="admin-sidebar-header">
                    <img src="/Mp7qkImU.ico" alt="로고" className="admin-sidebar-logo" />
                    <div>
                        <div className="admin-sidebar-title">통합 예매 시스템</div>
                        <div className="admin-sidebar-subtitle">관리자 콘솔</div>
                    </div>
                </div>

                <nav className="admin-sidebar-nav">
                    {NAV_ITEMS.map(({ to, label, icon, end }) => (
                        <NavLink
                            key={to}
                            to={to}
                            end={!!end}
                            className={({ isActive }) =>
                                'admin-nav-item' + (isActive ? ' active' : '')
                            }
                        >
                            <span className="admin-nav-icon">{icon}</span>
                            {label}
                        </NavLink>
                    ))}
                </nav>

                <div className="admin-sidebar-footer">
                    <button className="admin-logout-btn" onClick={handleLogout}>
                        <span className="admin-nav-icon">🚪</span>
                        로그아웃
                    </button>
                </div>
            </aside>

            {/* ── Main ── */}
            <main className="admin-main">
                <div className="admin-content">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default AdminLayout;
