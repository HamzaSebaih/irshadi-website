import { Link } from "react-router-dom";
import { useAuth } from '../contexts/AuthContext';
import LogoutButton from "./LogoutButton";
import { useExtraInfo } from "../contexts/BackEndContext";

const Nav = () => {
  const { user } = useAuth(); //to check if user is logged in
  const { extraInfo } = useExtraInfo(); //to check if the extra info is avaliable
  const isAuth = user && extraInfo; //if both isn't null then the user is authratized to use the nav

  const isAdmin = extraInfo?.role === "admin"

  return (
    <nav className="bg-gray-800 p-4 shadow-md">
      <div className="flex justify-between items-center">

        {/* Left Side - Links */}
        <ul className="flex space-x-6 text-white">
          {isAuth ? (
            <>
              {isAdmin ? (
                <li className="text-gray-300">
                                      <Link
                      to="/AdminHomePage"
                      className="hover:text-gray-300 transition duration-300"
                    >
                      HomePage
                    </Link>
                </li>
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
  );
};

export default Nav;
