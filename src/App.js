import './App.css';
import LoginPage from './pages/LoginPages/LoginPage';
import ForgetPassPage from './pages/LoginPages/ForgetPassPage';
import ProfileCompletionPage from './pages/LoginPages/ProfileCompletionPage'
import StudentHomePage from './pages/StudnetPages/StudentHomePage';
import Nav from "./components/Nav";
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './contexts/ProtectedRoute';

import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import AvailableForms from './pages/StudnetPages/AvailableForms';

const App = () => {
  const isAuth = true;
  const isStudent = true;
  return (
    <BrowserRouter>
    <AuthProvider>
      <Nav/>
      <Routes>
        <Route path="/*" element={<LoginPage />} />
        <Route path="/ForgetPassPage" element={<ForgetPassPage />} />
        <Route path="/ProfileCompletionPage" element={<ProfileCompletionPage />} />
        <Route path="/StudentHomePage" element={
                        <ProtectedRoute>
                        <StudentHomePage /> 
                        {/* here we are wrapping up the StudentHomePage to Protect it  */}
                      </ProtectedRoute>
          } />
                  <Route path="/AvailableForms" element={
                        <ProtectedRoute>
                        <AvailableForms />  
                        {/* here we are wrapping up the route to Protect it  */}
                      </ProtectedRoute>
          } /> 
        {/*<Route path="*" element={<NotFound />} /> */}
      </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
export default App;