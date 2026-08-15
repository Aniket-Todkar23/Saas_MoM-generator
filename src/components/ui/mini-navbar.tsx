"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from 'next-themes';
import { Sun, Moon, Loader2 } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';

import { signIn, signOut, useSession } from 'next-auth/react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const sectionToPath: Record<string, string> = {
  home: '/',
  'how-it-works': '/how-it-works',
  pricing: '/pricing',
  about: '/about',
  contact: '/#contact',
  record: '/record',
  'past-meets': '/past-meets',
  analytics: '/analytics',
}

const scrollableHomeSections = new Set(['home', 'how-it-works', 'pricing', 'about', 'contact']);

type Router = ReturnType<typeof useRouter>;

function isLinkActive(sectionId: string, pathname: string) {
  const targetPath = sectionToPath[sectionId];

  if (!targetPath) return false;
  if (sectionId === 'home') return pathname === '/';
  if (targetPath.startsWith('/#')) return false;

  return pathname === targetPath;
}

// Smooth-scroll to a section by its id.
// If on the homepage, scrolls in-place (Lenis compatible).
// If on a sub-page, navigates to the dedicated route.
function handleNavigation(id: string, router: Router) {
  const targetPath = sectionToPath[id] || `/#${id}`;
  const canScrollOnHome = window.location.pathname === '/' && scrollableHomeSections.has(id);

  if (canScrollOnHome) {
    if (id === 'home') {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  } else {
    router.push(targetPath)
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
      className="p-1.5 sm:p-2 cursor-pointer flex items-center justify-center bg-transparent text-muted-foreground hover:text-foreground hover:bg-black/10 dark:hover:bg-white/10 rounded-full transition-colors focus:outline-none"
      aria-label="Toggle theme"
    >
      {currentTheme === 'dark' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
    </button>
  );
};

const AnimatedNavLink = ({ sectionId, children, router, isActive }: { sectionId: string; children: React.ReactNode; router: Router; isActive: boolean }) => (
  <button
    onClick={() => handleNavigation(sectionId, router)}
    className={`group relative inline-flex overflow-hidden cursor-pointer focus:outline-none ${
      isActive
        ? 'after:absolute after:left-0 after:-bottom-1 after:h-[2px] after:w-full after:rounded-full after:bg-gradient-to-r after:from-indigo-500 after:to-purple-600'
        : ''
    }`}
    aria-current={isActive ? 'page' : undefined}
    style={{ height: '1.25rem' }}
  >
    <div className={`flex flex-col transition-transform duration-[400ms] ease-out ${isActive ? '' : 'group-hover:-translate-y-5'}`}>
      <span className={`block h-5 text-sm leading-5 ${isActive ? 'text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-600 font-semibold' : 'text-muted-foreground'}`}>{children}</span>
      <span className={`block h-5 text-sm leading-5 ${isActive ? 'text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-600 font-semibold' : 'text-foreground'}`}>{children}</span>
    </div>
  </button>
);

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isManualLoginOpen, setIsManualLoginOpen] = useState(false);
  const [manualEmail, setManualEmail] = useState('');
  const [manualPassword, setManualPassword] = useState('');
  const [manualError, setManualError] = useState<string | null>(null);
  const [isManualLoginLoading, setIsManualLoginLoading] = useState(false);
  const [headerShapeClass, setHeaderShapeClass] = useState('rounded-full');
  const shapeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const router = useRouter();
  const pathname = usePathname();
  
  const { status } = useSession();
  const isLoggedIn = status === "authenticated";
  const isAuthBusy = isLoggingIn || isLoggingOut || isManualLoginLoading;

  const toggleMenu = () => setIsOpen(!isOpen);

  const handleGoogleLogin = () => {
    if (isAuthBusy) return;

    setIsLoggingIn(true);
    signIn('google', { callbackUrl: '/record' });
  };

  const handleOpenManualLogin = () => {
    if (isAuthBusy) return;
    setManualError(null);
    setIsManualLoginOpen(true);
  };

  const handleManualLoginSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isAuthBusy) return;

    const email = manualEmail.trim().toLowerCase();
    const password = manualPassword;

    if (!email || !password) {
      setManualError('Please enter both email and password.');
      return;
    }

    setIsManualLoginLoading(true);
    setManualError(null);

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
        callbackUrl: '/record',
      });

      if (result?.error) {
        setManualError('Invalid email or password.');
        return;
      }

      setIsManualLoginOpen(false);
      setManualPassword('');
      router.push('/record');
      router.refresh();
    } finally {
      setIsManualLoginLoading(false);
    }
  };

  const handleLogout = async () => {
    if (isAuthBusy) return;

    setIsLoggingOut(true);

    try {
      await signOut({ redirect: false, callbackUrl: '/' });
      router.push('/');
      router.refresh();
    } finally {
      setIsLoggingOut(false);
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

  const publicLinks = [
    { label: 'Home',         sectionId: 'home' },
    { label: 'How it works', sectionId: 'how-it-works' },
    { label: 'Pricing',      sectionId: 'pricing' },
    { label: 'About',        sectionId: 'about' },
    { label: 'Contact',      sectionId: 'contact' },
  ];

  const privateLinks = [
    { label: 'Record',       sectionId: 'record' },
    { label: 'Past Meets',   sectionId: 'past-meets' },
    { label: 'Analytics',    sectionId: 'analytics' },
  ];

  const navLinksData = isLoggedIn ? privateLinks : publicLinks;

  const logoElement = (
    <button onClick={() => handleNavigation('home', router)} className="focus:outline-none cursor-pointer flex items-center justify-center transition-transform hover:scale-[1.02] gap-2.5" aria-label="Go to top">
      <svg
        viewBox="0 0 151 135"
        preserveAspectRatio="xMinYMid meet"
        className="h-7 sm:h-8 md:h-9 w-auto"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="logo-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#9333ea" />
          </linearGradient>
        </defs>
        <g fill="url(#logo-gradient)">
          <path d="M37.3524 89.0743L23.6203 112.818L33.4952 129.894L50.2361 100.953L66.9771 71.9976H33.4952H0L9.87491 89.0743H37.3524Z"/>
          <path d="M37.7103 45.3177H10.2328L0.35791 62.3944H33.8398H67.335L50.594 33.4394L33.8398 4.49756L23.9649 21.5743L37.7103 45.3177Z"/>
          <path d="M75.858 23.7434L62.1126 0H42.3628L59.1038 28.9418L75.858 57.8836L92.5989 28.9418L109.34 0H89.59L75.858 23.7434Z"/>
          <path d="M113.648 45.9261L127.393 22.1827L117.518 5.10596L100.764 34.061L84.0229 63.0028H117.518H151L141.125 45.9261H113.648Z"/>
          <path d="M113.29 89.6826H140.767L150.655 72.6191H117.16H83.665L100.419 101.561L117.16 130.503L127.035 113.426L113.29 89.6826Z"/>
          <path d="M75.1421 111.256L88.8874 135H108.637L91.8963 106.058L75.1421 77.1162L58.4011 106.058L41.6602 135H61.41L75.1421 111.256Z"/>
        </g>
      </svg>
      <span className="text-xl sm:text-2xl font-extrabold tracking-tight text-foreground pt-0.5">
        MinuteFlow
      </span>
    </button>
  );

  const loginButtonElement = (
    <button
      onClick={handleOpenManualLogin}
      disabled={isAuthBusy}
      className="cursor-pointer px-4 py-2 sm:px-3 text-xs sm:text-sm border border-border bg-background/50 text-muted-foreground rounded-full hover:border-foreground/50 hover:text-foreground transition-colors duration-200 w-full sm:w-auto sm:whitespace-nowrap sm:shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isManualLoginLoading ? 'Logging in...' : 'Log In'}
    </button>
  );

  const signupButtonElement = (
    <div className="relative group w-full sm:w-auto sm:shrink-0">
      <div className="absolute inset-0 -m-2 rounded-full hidden sm:block bg-gradient-to-r from-indigo-500 to-purple-500 opacity-20 filter blur-lg pointer-events-none transition-all duration-300 ease-out group-hover:opacity-40 group-hover:blur-xl group-hover:-m-3" />
      <button
        onClick={handleGoogleLogin}
        disabled={isAuthBusy}
        className="relative z-10 cursor-pointer px-4 py-2 sm:px-3 text-xs sm:text-sm font-semibold text-white bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full hover:opacity-90 transition-all duration-200 w-full sm:w-auto sm:whitespace-nowrap sm:shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoggingIn ? 'Redirecting...' : 'Sign Up with Google'}
      </button>
    </div>
  );

  const logoutButtonElement = (
    <button
      onClick={handleLogout}
      disabled={isAuthBusy}
      className="cursor-pointer px-4 py-2 sm:px-3 text-xs sm:text-sm border border-red-500 bg-red-500/10 text-red-500 rounded-full hover:bg-red-500/20 transition-colors duration-200 w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isLoggingOut ? 'Logging out...' : 'Log Out'}
    </button>
  );

  return (
    <>
      <Dialog open={isManualLoginOpen} onOpenChange={setIsManualLoginOpen}>
        <DialogContent className="max-w-md border-border/70 bg-background/95 backdrop-blur-md">
          <DialogHeader>
            <DialogTitle>Log In</DialogTitle>
            <DialogDescription>
              Use your email and password to access your meetings.
            </DialogDescription>
          </DialogHeader>

          <form className="space-y-4" onSubmit={handleManualLoginSubmit}>
            <div className="space-y-2">
              <Label htmlFor="manual-login-email">Email</Label>
              <Input
                id="manual-login-email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={manualEmail}
                onChange={(event) => setManualEmail(event.target.value)}
                disabled={isManualLoginLoading}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="manual-login-password">Password</Label>
              <Input
                id="manual-login-password"
                type="password"
                autoComplete="current-password"
                placeholder="Enter your password"
                value={manualPassword}
                onChange={(event) => setManualPassword(event.target.value)}
                disabled={isManualLoginLoading}
                required
              />
            </div>

            {manualError && (
              <p className="text-sm text-red-500" role="alert">
                {manualError}
              </p>
            )}

            <button
              type="submit"
              disabled={isManualLoginLoading}
              className="w-full h-10 inline-flex items-center justify-center rounded-md bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-sm font-semibold hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed transition"
            >
              {isManualLoginLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>
        </DialogContent>
      </Dialog>

      <header className={`fixed top-6 left-1/2 -translate-x-1/2 z-50
                       flex flex-col items-center
                       px-4 sm:px-6 py-2 sm:py-2.5 backdrop-blur-md
                       ${headerShapeClass}
                       border border-border bg-background/50
                       w-[calc(100%-0.75rem)] sm:w-[min(980px,calc(100%-1rem))]
                       transition-[border-radius] duration-300 ease-in-out`}>

      <div className="flex items-center justify-between w-full gap-x-3 sm:gap-x-8">
        <div className="flex items-center shrink-0">{logoElement}</div>

        {/* Desktop nav */}
        <nav className="hidden sm:flex items-center space-x-3 md:space-x-4 lg:space-x-6 text-sm">
          {navLinksData.map((link) => {
            const active = isLinkActive(link.sectionId, pathname);

            return (
              <AnimatedNavLink key={link.sectionId} sectionId={link.sectionId} router={router} isActive={active}>
                {link.label}
              </AnimatedNavLink>
            );
          })}
        </nav>

        <div className="hidden sm:flex items-center gap-2 md:gap-3 shrink-0">
          <ThemeToggle />
          {isLoggedIn ? (
            logoutButtonElement
          ) : (
            <>
              {loginButtonElement}
              {signupButtonElement}
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <div className="sm:hidden flex items-center justify-center gap-2">
          <ThemeToggle />
          <button
            className="flex items-center justify-center w-8 h-8 text-foreground cursor-pointer focus:outline-none"
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
          {navLinksData.map((link) => {
            const active = isLinkActive(link.sectionId, pathname);

            return (
              <button
                key={link.sectionId}
                onClick={() => { handleNavigation(link.sectionId, router); setIsOpen(false); }}
                className={`cursor-pointer transition-colors w-full text-center ${
                  active
                    ? 'text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-600 font-semibold underline decoration-indigo-500/80 underline-offset-4'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                aria-current={active ? 'page' : undefined}
              >
                {link.label}
              </button>
            );
          })}
          <div className="w-full flex flex-col gap-3 pb-2 pt-2">
            {isLoggedIn ? (
              logoutButtonElement
            ) : (
              <>
                {loginButtonElement}
                {signupButtonElement}
              </>
            )}
          </div>
        </nav>
      </div>
      </header>
    </>
  );
}
     
