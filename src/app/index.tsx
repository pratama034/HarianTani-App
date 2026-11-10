import React, { useEffect, useState } from "react";
import { Redirect } from "expo-router";
import { useAuth } from "../context/AuthContext";
import { SplashScreenView } from "../components/SplashScreenView";
import { hasCompletedOnboarding } from "../services/authStorage";

export default function Index() {
  const { isAuthenticated, isLoading } = useAuth();
  const [onboardingChecked, setOnboardingChecked] = useState(false);
  const [isOnboardingCompleted, setIsOnboardingCompleted] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function checkOnboardingStatus() {
      try {
        const completed = await hasCompletedOnboarding();
        if (isMounted) {
          setIsOnboardingCompleted(completed);
        }
      } catch {
        if (isMounted) {
          setIsOnboardingCompleted(false);
        }
      } finally {
        if (isMounted) {
          setOnboardingChecked(true);
        }
      }
    }
    checkOnboardingStatus();
    return () => {
      isMounted = false;
    };
  }, []);

  // Display Splash screen during auth session loading or onboarding check
  if (isLoading || !onboardingChecked) {
    return <SplashScreenView />;
  }

  // If user is already authenticated, go to tabs
  if (isAuthenticated) {
    return <Redirect href="/(tabs)" />;
  }

  // If first time user hasn't seen onboarding, navigate to onboarding
  if (!isOnboardingCompleted) {
    return <Redirect href={"/onboarding" as any} />;
  }

  // Otherwise, go directly to login
  return <Redirect href="/(auth)/login" />;
}
