import { Link } from "react-router-dom";
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

  return (
    <>
      <nav className="bg-gray-800 p-4 shadow-md">
        <div className="flex justify-between items-center">
          {/* Left Side - Links */}
          <ul className="flex space-x-6 text-white">
            {isAuth ? (
              <>
                {isAdmin ? (
                  <>
                    <li className="text-gray-300">
                      <Link
                        to="/AdminHomePage"
                        className="hover:text-gray-300 transition duration-300"
                      >
                        HomePage
                      </Link>
                    </li>
                    <li className="text-gray-300">
                      <Link
                        to="/AdminStudyPlansPage"
                        className="hover:text-gray-300 transition duration-300"
                      >
                        Study Plans
                      </Link>
                    </li>
                    <li className="text-gray-300">
                      <button
                        className="hover:text-gray-300 transition duration-300"
                        onClick={() => setIsPopupOpen(true)}
                      >
                        Courses
                      </button>
                    </li>
                  </>
                ) : (
                  <>
                    <li>
                      <Link
                        to="/StudentHomePage"
                        className="hover:text-gray-300 transition duration-300"
                      >
                        HomePage
                      </Link>
                    </li>
                    <li>
                      <Link
                        to="/AvailableForms"
                        className="hover:text-gray-300 transition duration-300"
                      >
                        Available Forms
                      </Link>
                    </li>
                  </>
                )}
              </>
            ) : (
              <li>
                <Link
                  to="/"
                  className="hover:text-gray-300 transition duration-300"
                >
                  LoginPage
                </Link>
              </li>
            )}
          </ul>

          {/* Right Side - Logout Button */}
          {isAuth && (
            <div className="text-white">
              <LogoutButton />
            </div>
          )}
        </div>
      </nav>
      {(isPopupOpen && isAdmin) && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center"
          onClick={() => setIsPopupOpen(false)}
        >
          <div
            className="bg-white p-4 rounded"
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