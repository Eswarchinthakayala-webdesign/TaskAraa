import { Github, Twitter, Linkedin } from "lucide-react";
import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="bg-black text-white py-10 px-4 md:px-10 lg:px-20 relative overflow-hidden">
      {/* Glowing Background Blobs */}
      <div className="absolute top-0 left-0 w-32 h-32 md:w-40 md:h-40 bg-purple-700 rounded-full opacity-20 blur-2xl pointer-events-none"></div>
      <div className="absolute bottom-0 right-0 w-32 h-32 md:w-40 md:h-40 bg-indigo-500 rounded-full opacity-20 blur-2xl pointer-events-none"></div>

      

      {/* Divider and Copyright */}
      <div className="border-t border-gray-800 mt-8 pt-4 text-center text-gray-500 text-xs z-10 relative">
        © {new Date().getFullYear()}{" "}
        <Link to="/" className="text-purple-400 hover:text-purple-300 transition">
          TaskAra
        </Link>{" "}
        · All rights reserved.
      </div>
    </footer>
  );
}
