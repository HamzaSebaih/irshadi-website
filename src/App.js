import './App.css';
import LoginPage from './pages/LoginPage';
import StudentHomePage from './pages/StudnetPages/StudentHomePage';
import Nav from "./components/Nav";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
const App = () => {
  const isAuth = true;
  const isStudent = true;
  return (
    <BrowserRouter>
      <Nav isAuth={isAuth} isStudent={isStudent}/>
      <Routes>
        <Route path="/*" element={<LoginPage />} />
        <Route path="/StudentHomePage" element={<StudentHomePage />} />
        {/*<Route path="*" element={<NotFound />} /> */}
      </Routes>
    </BrowserRouter>
  );
}
export default App;