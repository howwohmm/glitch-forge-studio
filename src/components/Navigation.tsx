
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '../lib/utils';
import { Button } from './ui/button';
import { Palette, Home, Edit, Users, Sparkles } from 'lucide-react';

const Navigation: React.FC = () => {
  const location = useLocation();

  const navItems = [
    { href: '/home', label: 'Home', icon: Home },
    { href: '/shaders', label: 'Working Shaders', icon: Sparkles },
    { href: '/editor', label: 'Editor', icon: Edit },
    { href: '/community', label: 'Community', icon: Users },
  ];

  return (
    <nav className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center space-x-6">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2">
              <Palette className="h-6 w-6 text-primary" />
              <span className="font-bold text-xl">Glitch Forge Studio</span>
            </Link>

            {/* Navigation Links */}
            <div className="hidden md:flex items-center space-x-1">
              {navItems.map(({ href, label, icon: Icon }) => (
                <Link key={href} to={href}>
                  <Button
                    variant={location.pathname === href ? 'default' : 'ghost'}
                    size="sm"
                    className="flex items-center space-x-2"
                  >
                    <Icon className="h-4 w-4" />
                    <span>{label}</span>
                  </Button>
                </Link>
              ))}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Link to="/auth">
              <Button variant="outline" size="sm">
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
