import { Link } from "react-router-dom";
import { useAuth } from '../contexts/AuthContext';
import LogoutButton from "./LogoutButton";

const Nav = () => {
  const { user } = useAuth();
  const isAuth = user;
  const isStudent = true; // we will change this logic

  return (
    <nav className="bg-gray-800 p-4 shadow-md">
      <div className="flex justify-between items-center">

        {/* Left Side - Links */}
        <ul className="flex space-x-6 text-white">
          {isAuth ? (
            <>
              {isStudent ? (
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
              ) : (
                <li className="text-gray-300">
                  Admin HomePage and other admin links go here
                </li>
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
