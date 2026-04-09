"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from 'next-themes';
import { Sun, Moon } from 'lucide-react';
import { useRouter } from 'next/navigation';

const sectionToPath: Record<string, string> = {
  home: '/',
  'how-it-works': '/how-it-works',
  pricing: '/pricing',
  about: '/about',
  contact: '/#contact',
}

// Smooth-scroll to a section by its id.
// If on the homepage, scrolls in-place (Lenis compatible).
// If on a sub-page, navigates to the dedicated route.
function handleNavigation(id: string, router: any) {
  if (window.location.pathname === '/') {
    if (id === 'home') {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  } else {
    router.push(sectionToPath[id] || `/#${id}`)
  }
}

const ThemeToggle = () => {
  const { theme, setTheme, systemTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return <div className="w-8 h-8" />;
  const currentTheme = theme === 'system' ? systemTheme : theme;
  return (
    <button
      onClick={() => setTheme(currentTheme === 'dark' ? 'light' : 'dark')}
      className="p-1.5 sm:p-2 flex items-center justify-center bg-transparent text-muted-foreground hover:text-foreground hover:bg-black/10 dark:hover:bg-white/10 rounded-full transition-colors focus:outline-none"
      aria-label="Toggle theme"
    >
      {currentTheme === 'dark' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
    </button>
  );
};

const AnimatedNavLink = ({ sectionId, children, router }: { sectionId: string; children: React.ReactNode; router: any }) => (
  <button
    onClick={() => handleNavigation(sectionId, router)}
    className="group relative inline-flex overflow-hidden cursor-pointer focus:outline-none"
    style={{ height: '1.25rem' }}
  >
    <div className="flex flex-col transition-transform duration-[400ms] ease-out group-hover:-translate-y-5">
      <span className="block h-5 text-sm text-muted-foreground leading-5">{children}</span>
      <span className="block h-5 text-sm text-foreground leading-5">{children}</span>
    </div>
  </button>
);

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [headerShapeClass, setHeaderShapeClass] = useState('rounded-full');
  const shapeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const router = useRouter();

  const toggleMenu = () => setIsOpen(!isOpen);

  const handleLogin = async () => {
    if (isLoggingIn) return;

    try {
      setIsLoggingIn(true);
      const response = await fetch('/api/auth/login', { method: 'POST' });
      if (!response.ok) return;
      router.refresh();
      router.push('/record');
    } finally {
      setIsLoggingIn(false);
    }
  };

  useEffect(() => {
    if (shapeTimeoutRef.current) clearTimeout(shapeTimeoutRef.current);
    if (isOpen) {
      setHeaderShapeClass('rounded-xl');
    } else {
      shapeTimeoutRef.current = setTimeout(() => setHeaderShapeClass('rounded-full'), 300);
    }
    return () => { if (shapeTimeoutRef.current) clearTimeout(shapeTimeoutRef.current); };
  }, [isOpen]);

  const navLinksData = [
    { label: 'Home',         sectionId: 'home' },
    { label: 'How it works', sectionId: 'how-it-works' },
    { label: 'Pricing',      sectionId: 'pricing' },
    { label: 'About',        sectionId: 'about' },
    { label: 'Contact',      sectionId: 'contact' },
  ];

  const logoElement = (
    <button onClick={() => handleNavigation('home', router)} className="focus:outline-none" aria-label="Go to top">
      <div className="relative w-5 h-5 flex items-center justify-center">
        <span className="absolute w-1.5 h-1.5 rounded-full bg-foreground top-0 left-1/2 -translate-x-1/2 opacity-80" />
        <span className="absolute w-1.5 h-1.5 rounded-full bg-foreground left-0 top-1/2 -translate-y-1/2 opacity-80" />
        <span className="absolute w-1.5 h-1.5 rounded-full bg-foreground right-0 top-1/2 -translate-y-1/2 opacity-80" />
        <span className="absolute w-1.5 h-1.5 rounded-full bg-foreground bottom-0 left-1/2 -translate-x-1/2 opacity-80" />
      </div>
    </button>
  );

  const loginButtonElement = (
    <button
      onClick={handleLogin}
      disabled={isLoggingIn}
      className="px-4 py-2 sm:px-3 text-xs sm:text-sm border border-border bg-background/50 text-muted-foreground rounded-full hover:border-foreground/50 hover:text-foreground transition-colors duration-200 w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isLoggingIn ? 'Logging In...' : 'LogIn'}
    </button>
  );

  const signupButtonElement = (
    <div className="relative group w-full sm:w-auto">
      <div className="absolute inset-0 -m-2 rounded-full hidden sm:block bg-gradient-to-r from-indigo-500 to-purple-500 opacity-20 filter blur-lg pointer-events-none transition-all duration-300 ease-out group-hover:opacity-40 group-hover:blur-xl group-hover:-m-3" />
      <button
        onClick={() => router.push('/record')}
        className="relative z-10 px-4 py-2 sm:px-3 text-xs sm:text-sm font-semibold text-white bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full hover:opacity-90 transition-all duration-200 w-full sm:w-auto"
      >
        Start Recording
      </button>
    </div>
  );

  return (
    <header className={`fixed top-6 left-1/2 -translate-x-1/2 z-50
                       flex flex-col items-center
                       pl-6 pr-6 py-3 backdrop-blur-md
                       ${headerShapeClass}
                       border border-border bg-background/50
                       w-[calc(100%-2rem)] sm:w-auto
                       transition-[border-radius] duration-300 ease-in-out`}>

      <div className="flex items-center justify-between w-full gap-x-6 sm:gap-x-8">
        <div className="flex items-center">{logoElement}</div>

        {/* Desktop nav */}
        <nav className="hidden sm:flex items-center space-x-4 sm:space-x-6 text-sm">
          {navLinksData.map((link) => (
            <AnimatedNavLink key={link.sectionId} sectionId={link.sectionId} router={router}>
              {link.label}
            </AnimatedNavLink>
          ))}
        </nav>

        <div className="hidden sm:flex items-center gap-2 sm:gap-3">
          <ThemeToggle />
          {loginButtonElement}
          {signupButtonElement}
        </div>

        {/* Mobile hamburger */}
        <div className="sm:hidden flex items-center justify-center gap-2">
          <ThemeToggle />
          <button
            className="flex items-center justify-center w-8 h-8 text-foreground focus:outline-none"
            onClick={toggleMenu}
            aria-label={isOpen ? 'Close Menu' : 'Open Menu'}
          >
            {isOpen ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      <div className={`sm:hidden flex flex-col items-center w-full transition-all ease-in-out duration-300 overflow-hidden
                       ${isOpen ? 'max-h-[1000px] opacity-100 pt-4' : 'max-h-0 opacity-0 pt-0 pointer-events-none'}`}>
        <nav className="flex flex-col items-center space-y-4 text-base w-full">
          {navLinksData.map((link) => (
            <button
              key={link.sectionId}
              onClick={() => { handleNavigation(link.sectionId, router); setIsOpen(false); }}
              className="text-muted-foreground hover:text-foreground transition-colors w-full text-center"
            >
              {link.label}
            </button>
          ))}
        </nav>
        <div className="flex flex-col items-center space-y-4 mt-4 w-full">
          {loginButtonElement}
          {signupButtonElement}
        </div>
      </div>
    </header>
  );
}
