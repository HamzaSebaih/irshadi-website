import { Link, NavLink } from "react-router-dom";
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

  const activeClassName = "bg-accent-dark text-black";
  const inactiveClassName = "text-black hover:bg-accent-light hover:text-black"; // Using black text for contrast on default accent bg

  return (
    <>
      <nav className="bg-accent shadow-md border-b border-accent-dark">
        <div className="container mx-auto flex items-center justify-between px-4 py-3">
          {/* Left Side */}
          <ul className="flex items-center space-x-4 md:space-x-6">
            {isAuth ? (
              <>
                {isAdmin ? (
                  <>
                    <li>
                      <NavLink
                        to="/AdminHomePage"
                        className={({ isActive }) =>
                            `rounded-md px-3 py-2 text-sm font-medium transition-colors duration-150 ${isActive ? activeClassName : inactiveClassName}`
                        }
                      >
                        Home
                      </NavLink>
                    </li>
                    <li>
                       <NavLink
                        to="/AdminStudyPlansPage"
                         className={({ isActive }) =>
                            `rounded-md px-3 py-2 text-sm font-medium transition-colors duration-150 ${isActive ? activeClassName : inactiveClassName}`
                        }
                      >
                        Study Plans
                      </NavLink>
                    </li>
                    <li>
                      <button
                         className={`rounded-md px-3 py-2 text-sm font-medium transition-colors duration-150 ${inactiveClassName}`} // Styled like a NavLink
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
                            `rounded-md px-3 py-2 text-sm font-medium transition-colors duration-150 ${isActive ? activeClassName : inactiveClassName}`
                        }
                      >
                        Home
                      </NavLink>
                    </li>
                    <li>
                      <NavLink
                        to="/AvailableForms"
                         className={({ isActive }) =>
                            `rounded-md px-3 py-2 text-sm font-medium transition-colors duration-150 ${isActive ? activeClassName : inactiveClassName}`
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
                      `rounded-md px-3 py-2 text-sm font-medium transition-colors duration-150 ${isActive ? activeClassName : inactiveClassName}`
                   }
                >
                  Login
                </NavLink>
              </li>
            )}
          </ul>

          {/* Right Side - Logout Button */}
          {isAuth && (
            <div>
              <LogoutButton />
            </div>
          )}
        </div>
      </nav>
      {(isPopupOpen && isAdmin) && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={() => setIsPopupOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
          >
            <ShowCoursesPopUp/>
          </div>
        </div>
      )}
    </>
  );
};

export default Nav;