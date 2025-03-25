import './App.css';
import LoginPage from './pages/LoginPages/LoginPage';
import ForgetPassPage from './pages/LoginPages/ForgetPassPage';
import ProfileCompletionPage from './pages/LoginPages/ProfileCompletionPage'
import StudentHomePage from './pages/StudnetPages/StudentHomePage';
import Nav from "./components/Nav";
import { AuthProvider } from './contexts/AuthContext';
import { AdminRoute, UserRoute } from './contexts/ProtectedRoute';

import { BrowserRouter, Routes, Route } from "react-router-dom";
import AvailableForms from './pages/StudnetPages/AvailableForms';
import StudentImportRecordPage from './pages/StudnetPages/StudentImportRecordPage';
import FillFormPage from './pages/StudnetPages/FillFormPage';
import AdminHomePage from './pages/AdminPages/AdminHomePage';
import LoadingPage from './pages/LoginPages/LoadingPage';

const App = () => {

  return (
    <BrowserRouter>
      <AuthProvider>
        <Nav />
        <Routes>
          <Route path="/*" element={<LoginPage />} />
          <Route path="/ForgetPassPage" element={<ForgetPassPage />} />
          <Route path="/Loading" element={<LoadingPage />} />

          <Route path="/ProfileCompletionPage" element={
            <UserRoute>  {/* here we are wrapping up the route to Protect it  */}
              <ProfileCompletionPage />
            </UserRoute>} />

          <Route path="/StudentImportRecordPage" element={
            <UserRoute> {/* here we are wrapping up the route to Protect it  */}
              <StudentImportRecordPage />
            </UserRoute>
          } />

          <Route path="/FillFormPage" element={
            <UserRoute>
              <FillFormPage />
            </UserRoute>} />


          <Route path="/StudentHomePage" element={
            <UserRoute>
              <StudentHomePage />
              {/* here we are wrapping up the StudentHomePage to Protect it  */}
            </UserRoute>
          } />

          <Route path="/AvailableForms" element={
            <UserRoute>
              <AvailableForms />
              {/* here we are wrapping up the route to Protect it  */}
            </UserRoute>
          } />

         <Route path="/AdminHomePage" element={
            <AdminRoute>
              <AdminHomePage />
              {/* here we are wrapping up the route to Protect it  */}
            </AdminRoute>
          } />

          {/*<Route path="*" element={<NotFound />} /> */}
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
export default App;