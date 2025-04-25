import { Link, NavLink } from "react-router";
import { useAuth } from '../contexts/AuthContext';
import LogoutButton from "./LogoutButton";
import { useExtraInfo } from "../contexts/BackEndContext";
import ShowCoursesPopUp from "./ShowCoursesPopUp";
import { useState } from "react";

const Nav = () => {
  const { user } = useAuth(); // To check if user is logged in
  const { extraInfo } = useExtraInfo(); // To check if extra info is available
  const isAuth = user && extraInfo; // If both aren't null, the user is authorized
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const isAdmin = extraInfo?.role === "admin";

  // Enhanced styling for active and inactive nav items with better colors
  const activeClassName = "bg-primary-dark text-white font-semibold shadow-md transform scale-105";
  const inactiveClassName = "text-white hover:bg-primary-light hover:text-white transition-all duration-300 hover:shadow-md";

  return (
    <>
      <nav className="bg-gradient-to-r from-primary to-primary-dark shadow-lg border-b-2 border-secondary sticky top-0 z-40">
        <div className="container mx-auto flex items-center justify-between px-6 py-4">
          {/* Left Side - Logo and Main Navigation */}
          <div className="flex items-center">
            {/* Only show Portal title when logged in */}
            {isAuth && (
              <div className="text-white font-bold text-xl mr-6">
                {isAdmin ? "Admin Portal" : "Student Portal"}
              </div>
            )}
            
            {/* Main Navigation Links */}
            <ul className="flex items-center space-x-1 md:space-x-2">
              {isAuth ? (
                <>
                  {isAdmin ? (
                    <>
                      <li>
                        <NavLink
                          to="/AdminHomePage"
                          className={({ isActive }) =>
                            `rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200 ${isActive ? activeClassName : inactiveClassName}`
                          }
                        >
                          Dashboard
                        </NavLink>
                      </li>
                      <li>
                        <NavLink
                          to="/AdminStudyPlansPage"
                          className={({ isActive }) =>
                            `rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200 ${isActive ? activeClassName : inactiveClassName}`
                          }
                        >
                          Study Plans
                        </NavLink>
                      </li>
                      <li>
                        <button
                          className={`rounded-lg px-4 py-2 text-sm font-medium ${inactiveClassName}`}
                          onClick={() => setIsPopupOpen(true)}
                        >
                          Courses
                        </button>
                      </li>
                    </>
                  ) : (
                    <>
                      <li>
                        <NavLink
                          to="/StudentHomePage"
                          className={({ isActive }) =>
                            `rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200 ${isActive ? activeClassName : inactiveClassName}`
                          }
                        >
                          Dashboard
                        </NavLink>
                      </li>
                      <li>
                        <NavLink
                          to="/AvailableForms"
                          className={({ isActive }) =>
                            `rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200 ${isActive ? activeClassName : inactiveClassName}`
                          }
                        >
                          Available Forms
                        </NavLink>
                      </li>
                    </>
                  )}
                </>
              ) : (
                <li>
                  <NavLink
                    to="/"
                    className={({ isActive }) =>
                      `rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200 ${isActive ? activeClassName : inactiveClassName}`
                    }
                  >
                    Login
                  </NavLink>
                </li>
              )}
              
              {/* About link - always visible for all users, positioned at the end of the left navigation */}
              <li>
                <NavLink
                  to="/about"
                  className={({ isActive }) =>
                    `rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200 ${isActive ? activeClassName : inactiveClassName}`
                  }
                >
                  About
                </NavLink>
              </li>
              
              {/* Terms link - only visible when logged in, positioned after About */}
              {isAuth && (
                <li>
                  <NavLink
                    to="/terms"
                    className={({ isActive }) =>
                      `rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200 ${isActive ? activeClassName : inactiveClassName}`
                    }
                  >
                    Terms
                  </NavLink>
                </li>
              )}
            </ul>
          </div>

          {/* Right Side - LogoutButton only with white text */}
          {isAuth && (
            <div className="text-white">
              <LogoutButton />
            </div>
          )}
        </div>
      </nav>
      
      {/* Popup for Courses */}
      {(isPopupOpen && isAdmin && user?.emailVerified) && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm transition-all duration-300"
          onClick={() => setIsPopupOpen(false)}
        >
          <div
            className="rounded-xl shadow-2xl transform transition-all duration-300 animate-fadeIn"
            onClick={(e) => e.stopPropagation()}
          >
            <ShowCoursesPopUp />
          </div>
        </div>
      )}
    </>
  );
};

export default Nav;