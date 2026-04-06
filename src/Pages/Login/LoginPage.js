import React from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import LoginContent from '../../Components/Login/LoginContent';
// import './LoginPage.css';

const LoginPage = () => {
    return (
        <div className="login-page-wrapper">
            <Container>
                <Row className="justify-content-center align-items-center min-vh-100">
                    <Col xs={12} sm={8} md={6} lg={4}>
                        <div className="login-card-container">
                            <LoginContent />
                        </div>
                    </Col>
                </Row>
            </Container>
        </div>
    );
};

export default LoginPage;