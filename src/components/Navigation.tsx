
import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Sun, Moon, User, LogOut } from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";
import { useAuth } from "@/components/AuthProvider";
import { Button } from "@/components/ui/button";

export default function Navigation() {
  const { theme, setTheme } = useTheme();
  const { user, signOut } = useAuth();
  const location = useLocation();

  const navItems = [
    { name: "Community", href: "/community" },
    { name: "About", href: "/about" },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/10">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Link to="/" className="text-brand text-xl font-bold">
            <span className="text-gradient">ohmedit</span>
          </Link>
        </motion.div>

        {/* Navigation Links */}
        <div className="hidden md:flex items-center space-x-8">
          {navItems.map((item) => (
            <Link
              key={item.name}
              to={item.href}
              className={`relative text-sm font-medium transition-colors duration-200 ${
                location.pathname === item.href
                  ? "text-ohmedit-red"
                  : "text-foreground/70 hover:text-foreground"
              }`}
            >
              {item.name}
              {location.pathname === item.href && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute -bottom-1 left-0 right-0 h-0.5 bg-ohmedit-red"
                  initial={false}
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
            </Link>
          ))}
        </div>

        {/* Right side actions */}
        <div className="flex items-center space-x-4">
          {/* Theme toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="h-9 w-9 p-0"
          >
            {theme === "dark" ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </Button>

          {/* Auth */}
          {user ? (
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
                <User className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={signOut} className="h-9 w-9 p-0">
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <Link to="/auth">
              <Button variant="ghost" size="sm">
                Login
              </Button>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
