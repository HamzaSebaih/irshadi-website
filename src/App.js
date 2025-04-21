import './App.css';
import LoginPage from './pages/LoginPages/LoginPage';
import ForgetPassPage from './pages/LoginPages/ForgetPassPage';
import ProfileCompletionPage from './pages/LoginPages/ProfileCompletionPage'
import StudentHomePage from './pages/StudnetPages/StudentHomePage';
import Nav from "./components/Nav";
import { AuthProvider } from './contexts/AuthContext';
import { ExtraInfoProvider } from './contexts/BackEndContext';
import { AdminRoute,StudentRoute,UserRoute } from './contexts/ProtectedRoute';
import { BrowserRouter, Routes, Route } from "react-router-dom";
import AvailableForms from './pages/StudnetPages/AvailableForms';
import StudentImportRecordPage from './pages/StudnetPages/StudentImportRecordPage';
import FillFormPage from './pages/StudnetPages/FillFormPage';
import AdminHomePage from './pages/AdminPages/AdminHomePage';
import LoadingPage from './pages/LoginPages/LoadingPage';
import Unauthorized from './pages/LoginPages/Unauthorized';
import AdminStudyPlansPage from './pages/AdminPages/AdminStudyPlansPage';
import PlanDetailsPage from './pages/AdminPages/PlanDetailsPage';
import AboutPage from './pages/About&Terms/AboutPage'
import TermsPage from './pages/About&Terms/TermsPage'
import SignUpPage from './pages/LoginPages/SignupPage';
import Unverified from './pages/LoginPages/Unverified';


const App = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ExtraInfoProvider>
        <Nav />
        <Routes>
          <Route path="/*" element={
            <UserRoute> {/*here we are wrapping this so that if a user is logged in he can't be in login page also we might change * WIP */}
            <LoginPage />
            </UserRoute>
            } />
          <Route path="/SignupPage" element={<SignUpPage />} />
          <Route path="/ForgetPassPage" element={<ForgetPassPage />} />
          <Route path="/unauthorized" element={<Unauthorized />} />
          <Route path="/Loading" element={<LoadingPage />} />
          <Route path="/About" element={<AboutPage />} />
          <Route path="/Terms" element={<TermsPage />} />
          <Route path="/ProfileCompletionPage" element={<ProfileCompletionPage />} />
          <Route path="/Unverified" element={<Unverified />} />

        

          <Route path="/StudentImportRecordPage" element={
            <StudentRoute> {/* here we are wrapping up the route to Protect it  */}
              <StudentImportRecordPage />
            </StudentRoute>
          } />

          <Route path="/FillFormPage" element={
            <StudentRoute>
              <FillFormPage />
            </StudentRoute>} />


          <Route path="/StudentHomePage" element={
            <StudentRoute>
              <StudentHomePage />
              {/* here we are wrapping up the StudentHomePage to Protect it  */}
            </StudentRoute>
          } />

          <Route path="/AvailableForms" element={
            <StudentRoute>
              <AvailableForms />
              {/* here we are wrapping up the route to Protect it  */}
            </StudentRoute>
          } />

         <Route path="/AdminHomePage" element={
            <AdminRoute>
              <AdminHomePage />
              {/* here we are wrapping up the route to Protect it  */}
            </AdminRoute>
          } />

          <Route path="/AdminStudyPlansPage" element={
            <AdminRoute>
              <AdminStudyPlansPage />
              {/* here we are wrapping up the route to Protect it  */}
            </AdminRoute>
          } />

          <Route path="/editPlan" element={
            <AdminRoute>
              <PlanDetailsPage />
              {/* here we are wrapping up the route to Protect it  */}
            </AdminRoute>
          } />

          {/*<Route path="*" element={<NotFound />} /> */}

        </Routes>
        </ExtraInfoProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
export default App;