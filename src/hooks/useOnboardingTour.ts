import { useEffect, useCallback } from 'react';
import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';
import { useNavigate } from 'react-router-dom';

const TOUR_STORAGE_KEY = 'byod-onboarding-complete';

export function useOnboardingTour() {
  const navigate = useNavigate();

  const hasCompletedTour = useCallback(() => {
    return localStorage.getItem(TOUR_STORAGE_KEY) === 'true';
  }, []);

  const markTourComplete = useCallback(() => {
    localStorage.setItem(TOUR_STORAGE_KEY, 'true');
  }, []);

  const resetTour = useCallback(() => {
    localStorage.removeItem(TOUR_STORAGE_KEY);
  }, []);

  const startTour = useCallback(() => {
    const driverObj = driver({
      showProgress: true,
      animate: true,
      overlayColor: 'hsl(var(--background) / 0.75)',
      stagePadding: 8,
      stageRadius: 12,
      popoverClass: 'byod-tour-popover',
      steps: [
        {
          element: '[data-tour="sidebar-logo"]',
          popover: {
            title: '👋 Welcome to BYD!',
            description: 'Bring Your Data — your complete data studio for uploading, editing, visualizing, and validating data. Let us show you around!',
            side: 'right',
            align: 'start',
          },
        },
        {
          element: '[data-tour="nav-home"]',
          popover: {
            title: '🏠 Home Dashboard',
            description: 'Your landing page with usage stats, feature overview, and quick access to all tools.',
            side: 'right',
            align: 'start',
          },
        },
        {
          element: '[data-tour="nav-data-studio"]',
          popover: {
            title: '✨ Data Studio',
            description: 'Upload files (CSV, Excel, JSON, GeoJSON, and more), choose sample datasets, edit data inline, view charts, and explore maps.',
            side: 'right',
            align: 'start',
          },
        },
        {
          element: '[data-tour="nav-templates"]',
          popover: {
            title: '📄 Templates',
            description: 'Browse and manage reusable data templates to speed up your workflow.',
            side: 'right',
            align: 'start',
          },
        },
        {
          element: '[data-tour="nav-documentation"]',
          popover: {
            title: '📖 Documentation',
            description: 'Find quick start guides, feature details, and FAQs all in one place.',
            side: 'right',
            align: 'start',
          },
        },
        {
          element: '[data-tour="user-menu"]',
          popover: {
            title: '👤 Your Profile',
            description: 'Access your profile settings, switch roles, toggle dark/light mode, and log out.',
            side: 'top',
            align: 'center',
          },
        },
        {
          element: '[data-tour="hero-cta"]',
          popover: {
            title: '🚀 Get Started!',
            description: 'Click "Open Data Studio" to begin uploading and working with your data. Enjoy BYD!',
            side: 'bottom',
            align: 'center',
          },
        },
      ],
      onDestroyStarted: () => {
        markTourComplete();
        driverObj.destroy();
      },
    });

    driverObj.drive();
  }, [markTourComplete]);

  // Auto-start tour for new users on home page
  const autoStartTour = useCallback(() => {
    if (!hasCompletedTour()) {
      // Small delay to let the page render
      const timer = setTimeout(() => {
        startTour();
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [hasCompletedTour, startTour]);

  return { startTour, autoStartTour, hasCompletedTour, resetTour, markTourComplete };
}
