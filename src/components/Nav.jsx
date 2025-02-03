import { Link } from "react-router-dom";
import { useAuth } from '../contexts/AuthContext';
const Nav = ()=>{
const { user } =  useAuth()
const isAuth = user
const isStudent= true;
    return(
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
    )
}

export default Nav