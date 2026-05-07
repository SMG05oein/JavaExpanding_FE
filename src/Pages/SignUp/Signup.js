import React from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import '../Login/Login.style.css';
import SignUpContent from "../../Components/Signup/SignUpContent";

const Signup = () => {
    return (
        <div className="login-page-wrapper">
            <Container fluid>
                <Row className="justify-content-center align-items-center">
                    <Col xs={12} sm={8} md={6} lg={4}>
                        <div className="login-card-container">
                            <SignUpContent/>
                        </div>
                    </Col>
                </Row>
            </Container>
        </div>
    );
};

export default Signup;