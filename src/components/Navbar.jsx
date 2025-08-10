import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, X, Home, LayoutDashboard, ListTodo, Star, CreditCard } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";

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
    toast.success("Logged out successfully");
    navigate("/");
  };

  // Handle login/signup logic
  const handleLoginClick = () => {
    if (session) {
      navigate("/dashboard");
    } else {
      navigate("/signup");
    }
  };

  const navLinks = [
    { to: "/", label: "Home", icon: <Home size={18} /> },
    { to: "/features", label: "Features", icon: <Star size={18} /> },
    { to: "/tasks", label: "Tasks", icon: <ListTodo size={18} /> },
    { to: "/dashboard", label: "Dashboard", icon: <LayoutDashboard size={18} /> },
  ];

  return (
    <motion.nav
      initial={{ opacity: 0, y: -30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7 }}
      className={`fixed top-0 left-0 w-full z-50 px-6 pt-4 lg:pb-4 transition-all duration-500 ${
        isScrolled
          ? "bg-gray-700/50 backdrop-blur-lg shadow-xl border-b border-purple-400/40"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        {/* Logo */}
        <Link
          to="/"
          className="flex items-center gap-2 font-bold bg-gradient-to-r from-purple-400 via-pink-500 to-indigo-500 text-transparent bg-clip-text"
        >
          <img
            src="/logo.png"
            alt="TaskAraa Logo"
            className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 object-contain"
          />
          <span className="text-2xl ml-[-6px] sm:text-3xl md:text-3xl">TaskAraa</span>
        </Link>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-6">
          {navLinks.slice(0, 2).map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="flex items-center gap-1 text-white hover:text-purple-300 transition duration-200"
            >
              {link.icon}
              {link.label}
            </Link>
          ))}

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
          {menuOpen ? (
            <X size={28} className="cursor-pointer text-purple-400" />
          ) : (
            <Menu size={28} className="cursor-pointer text-purple-400" />
          )}
        </button>
      </div>

      {/* Mobile Dropdown */}
    {/* Mobile Dropdown */}
<motion.div
  initial={{ opacity: 0, height: 0 }}
  animate={menuOpen ? { opacity: 1, height: "auto" } : { opacity: 0, height: 0 }}
  transition={{ duration: 0.3, ease: "easeInOut" }}
  className="md:hidden overflow-hidden pb-5"
>
  <div className="mt-3 rounded-b-xl bg-[#0f0f1e]/95 backdrop-blur-xl p-4 border-t border-purple-500/40 shadow-lg">
    {navLinks.map((link) => (
      <Link
        key={link.to}
        to={link.to}
        className="flex items-center gap-2 text-white px-3 py-2 rounded-lg hover:bg-purple-600/30 transition-all"
      >
        {link.icon}
        {link.label}
      </Link>
    ))}

    <div className="mt-4">
      {session ? (
        <Button
          onClick={handleLogout}
          className="w-full border-purple-500 bg-red-600 text-white hover:bg-red-700 cursor-pointer"
        >
          Logout
        </Button>
      ) : (
        <Button
          onClick={handleLoginClick}
          className="w-full border-purple-500 bg-purple-600 text-white hover:bg-purple-500 cursor-pointer"
        >
          Login
        </Button>
      )}
    </div>
  </div>
</motion.div>

    </motion.nav>
  );
}
