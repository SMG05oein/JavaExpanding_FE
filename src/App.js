import logo from './logo.svg';
import './App.css';
import {Route, Routes} from "react-router-dom";
import MainPage from "./Pages/MainPage/MainPage";
import GNB from "./GNB/GNB";
import 'bootstrap/dist/css/bootstrap.min.css';
import LoginContent from "./Components/Login/LoginContent";
import LoginPage from "./Pages/Login/LoginPage";
import FutsalReservationPage from "./Pages/FutsalReservationPage/FutsalReservationPage";
import Signup from "./Pages/SignUp/Signup";

function App() {
    return (
        <Routes>
            <Route path="/"  element={<><GNB/></>} >
                <Route index element={<MainPage/>} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/futsal" element={<FutsalReservationPage />} />
            </Route>
        </Routes>
    );
}

export default App;
