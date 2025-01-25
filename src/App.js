import './App.css';
import LoginPage from './pages/LoginPage';
import StudentHomePage from './pages/StudnetPages/StudentHomePage';
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
const App = () => {

  const isAuth = true;
  const isStudent = true;
  return (
    <BrowserRouter>
      <nav>
        <ul>

          {isAuth ? ( //here we first check if its logged in or not
          //now we need other type of checker to check if is it a student or an admin
          <>
            {isStudent ? (
              <li><Link to="/StudentHomePage">StudentHomePage</Link></li>
            ): (
              <li>this will be the link to admin home page and other nav staff</li>
            )
            }
            
          </>

          ) : //if not logged in (isAuth) then show the login in nav bar
          (
            <>
            <li><Link to="/">LoginPage</Link></li> 
          </>

          )}

        </ul>
      </nav>
      <Routes>
        <Route path="/*" element={<LoginPage />} />
        <Route path="/StudentHomePage" element={<StudentHomePage />} />
        {/*<Route path="*" element={<NotFound />} /> */}
      </Routes>
    </BrowserRouter>
  );
}
export default App;