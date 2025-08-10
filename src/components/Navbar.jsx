import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [session, setSession] = useState(null);

  const location = useLocation();
  const navigate = useNavigate();

  // Scroll blur effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close menu on route change
  useEffect(() => {
    setMenuOpen(false);
  }, [location]);

  // Check user session
  useEffect(() => {
    const fetchSession = async () => {
      const { data } = await supabase.auth.getSession();
      setSession(data.session);
    };
    fetchSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Handle logout
  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null);
    navigate("/");
  };

  // Handle login/signup logic
  const handleLoginClick = () => {
    if (session) {
      navigate("/dashboard");
    } else {
      navigate("/signup"); // First go to signup, user can choose Google or Email
    }
  };

  return (
    <motion.nav
      initial={{ opacity: 0, y: -30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7 }}
      className={`fixed top-0 left-0 w-full z-50 px-6 py-4 transition-all duration-500 ${
        isScrolled ? "bg-gray-700/50 backdrop-blur-lg shadow-xl border-b-2 border-purple-400" : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        {/* Logo */}
        <Link
          to="/"
          className="text-3xl flex font-bold bg-gradient-to-r from-purple-400 via-pink-500 to-indigo-500 text-transparent bg-clip-text"
        >
            <img src="/logo.png" alt="" width="35px" height="25px" />
          TaskAraa
        </Link>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-6">
          <Link to="/" className="text-white hover:text-purple-300 transition duration-200">Home</Link>
          <Link to="/features" className="text-white hover:text-purple-300 transition duration-200">Features</Link>
          <Link to="/pricing" className="text-white hover:text-purple-300 transition duration-200">Pricing</Link>

          {session ? (
            <Button
              onClick={handleLogout}
              className="border-purple-500 bg-red-600 text-white hover:bg-red-700 cursor-pointer"
            >
              Logout
            </Button>
          ) : (
            <Button
              onClick={handleLoginClick} 
              className="border-purple-500 bg-purple-600 text-white hover:bg-purple-500 cursor-pointer"
            >
              Login
            </Button>
          )}
        </div>

        {/* Mobile Menu Toggle */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="md:hidden text-white"
          aria-label="Toggle menu"
        >
          {menuOpen ? <X size={28} className="cursor-pointer text-purple-400" /> : <Menu size={28}  className="cursor-pointer text-purple-400" />}
        </button>
      </div>

      {/* Mobile Dropdown */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={menuOpen ? { opacity: 1, y: 0 } : { opacity: 0, y: -20 }}
        transition={{ duration: 0.1 }}
        className={`md:hidden overflow-hidden transition-all duration-500 ease-in-out ${
          menuOpen ? "max-h-[300px]" : "max-h-0"
        }`}
      >
        <div className="mt-4 rounded-xl bg-black/30 backdrop-blur-xl p-6 mx-4 border border-purple-500 flex flex-col gap-4">
          <Link to="/" className="text-white hover:text-purple-300 transition-all border-b-2 border-gray-400 pb-1 hover:border-purple-400">Home</Link>
          <Link to="/features" className="text-white hover:text-purple-300 transition-all border-b-2 border-gray-400 pb-1 hover:border-purple-400">Features</Link>
          <Link to="/tasks" className="text-white hover:text-purple-300 transition-all border-b-2 border-gray-400 pb-1 hover:border-purple-400">Tasks</Link>
           <Link to="/dashboard" className="text-white hover:text-purple-300 transition-all border-b-2 border-gray-400 pb-1 hover:border-purple-400">Dashboard</Link>

          {session ? (
            <Button
              onClick={handleLogout}
              className="border-purple-500 bg-red-600 text-white hover:bg-red-700 w-full cursor-pointer"
            >
              Logout
            </Button>
          ) : (
            <Button
              onClick={handleLoginClick}
              className="border-purple-500 bg-purple-600 text-white hover:bg-purple-500 w-full cursor-pointer"
            >
              Login
            </Button>
          )}
        </div>
      </motion.div>
    </motion.nav>
  );
}