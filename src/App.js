import './App.css';
import LoginPage from './pages/LoginPage';
import StudentHomePage from './pages/StudnetPages/StudentHomePage';
import Nav from "./components/Nav";
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './contexts/ProtectedRoute';

import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
const App = () => {
  const isAuth = true;
  const isStudent = true;
  return (
    <BrowserRouter>
    <AuthProvider>
      <Nav isAuth={isAuth} isStudent={isStudent}/>
      <Routes>
        <Route path="/*" element={<LoginPage />} />
        <Route path="/StudentHomePage" element={
                        <ProtectedRoute>
                        <StudentHomePage /> 
                        {/* here we are wrapping up the StudentHomePage to Protect it  */}
                      </ProtectedRoute>
          } /> 
        {/*<Route path="*" element={<NotFound />} /> */}
      </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
export default App;