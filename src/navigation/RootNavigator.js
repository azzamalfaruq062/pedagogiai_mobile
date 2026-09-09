import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Animated,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '../hooks/useTheme';
import { useAuth } from '../hooks/useAuth';
import { ROUTES } from '../constants/routes';

import AppHeader from '../components/layout/AppHeader';
import DevScreenSwitcher from '../components/common/DevScreenSwitcher';
import BottomTabBar from '../components/navigation/BottomTabBar';

import OnboardingScreen from '../screens/onboarding/OnboardingScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import CanteenMenuScreen from '../screens/canteen/CanteenMenuScreen';
import CanteenWalletScreen from '../screens/canteen/CanteenWalletScreen';
import CanteenHistoryScreen from '../screens/canteen/CanteenHistoryScreen';
import DashboardScreen from '../screens/dashboard/DashboardScreen';
import ProfileSettingsScreen from '../screens/profile/ProfileSettingsScreen';
import CourseListScreen from '../screens/course/CourseListScreen';
import CourseDetailScreen from '../screens/course/CourseDetailScreen';
import LessonScreen from '../screens/course/LessonScreen';
import QuizAttemptScreen from '../screens/course/QuizAttemptScreen';
import QuizResultScreen from '../screens/course/QuizResultScreen';
import AttendanceJournalScreen from '../screens/attendance/AttendanceJournalScreen';
import EkskulAttendanceScreen from '../screens/ekskul/EkskulAttendanceScreen';
import LocationAttendanceScreen from '../screens/attendance/LocationAttendanceScreen';
import NotificationScreen from '../screens/notification/NotificationScreen';
import NotificationDetailScreen from '../screens/notification/NotificationDetailScreen';
import SchoolBillingScreen from '../screens/billing/SchoolBillingScreen';

function AnimatedScreenContainer({ routeKey, children }) {
  const fadeAnim = useRef(new Animated.Value(0.15)).current;
  const translateYAnim = useRef(new Animated.Value(6)).current;

  useEffect(() => {
    fadeAnim.setValue(0.15);
    translateYAnim.setValue(6);
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(translateYAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, [routeKey]);

  return (
    <Animated.View
      style={[
        styles.screenWrapper,
        {
          opacity: fadeAnim,
          transform: [{ translateY: translateYAnim }],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}

export default function RootNavigator() {
  const { theme, isDark } = useTheme();
  const { isAuthenticated, isLoading } = useAuth();

  // Initial route: Login when unauthenticated, Dashboard when authenticated
  const [currentRoute, setCurrentRoute] = useState(
    isAuthenticated ? ROUTES.MAIN.DASHBOARD : ROUTES.AUTH.LOGIN
  );
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [selectedSubChapter, setSelectedSubChapter] = useState(null);
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [selectedQuizResult, setSelectedQuizResult] = useState(null);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [selectedNotification, setSelectedNotification] = useState(null);

  // Strictly enforce authentication navigation state
  useEffect(() => {
    if (isAuthenticated) {
      // If currently on an auth screen, transition to dashboard
      if (
        currentRoute === ROUTES.AUTH.LOGIN ||
        currentRoute === ROUTES.AUTH.REGISTER ||
        currentRoute === ROUTES.AUTH.ONBOARDING
      ) {
        setCurrentRoute(ROUTES.MAIN.DASHBOARD);
      }
    } else {
      // If not authenticated and on a protected screen, force to Login
      if (
        currentRoute !== ROUTES.AUTH.LOGIN &&
        currentRoute !== ROUTES.AUTH.REGISTER &&
        currentRoute !== ROUTES.AUTH.ONBOARDING
      ) {
        setCurrentRoute(ROUTES.AUTH.LOGIN);
      }
    }
  }, [isAuthenticated]);

  const handleNotificationPress = () => {
    setCurrentRoute(ROUTES.MAIN.NOTIFICATIONS);
  };

  const isAuthScreen =
    currentRoute === ROUTES.AUTH.LOGIN ||
    currentRoute === ROUTES.AUTH.REGISTER ||
    currentRoute === ROUTES.AUTH.ONBOARDING;

  const isImmersionScreen =
    currentRoute === ROUTES.MAIN.COURSE_DETAIL ||
    currentRoute === ROUTES.MAIN.LESSON ||
    currentRoute === ROUTES.MAIN.QUIZ_ATTEMPT ||
    currentRoute === ROUTES.MAIN.QUIZ_RESULT ||
    currentRoute === ROUTES.MAIN.ATTENDANCE ||
    currentRoute === ROUTES.MAIN.NOTIFICATIONS ||
    currentRoute === ROUTES.MAIN.NOTIFICATION_DETAIL ||
    currentRoute === ROUTES.MAIN.EKSKUL_ATTENDANCE ||
    currentRoute === ROUTES.MAIN.LOCATION_ATTENDANCE ||
    currentRoute === ROUTES.MAIN.SCHOOL_BILLING;

  const showAppHeader =
    isAuthenticated &&
    !isAuthScreen &&
    !isImmersionScreen &&
    currentRoute !== ROUTES.MAIN.COURSE_LIST;

  const showBottomBar = isAuthenticated && !isAuthScreen && !isImmersionScreen;

  const handleSelectRoute = (route) => {
    if (
      !isAuthenticated &&
      route !== ROUTES.AUTH.LOGIN &&
      route !== ROUTES.AUTH.REGISTER &&
      route !== ROUTES.AUTH.ONBOARDING
    ) {
      Alert.alert(
        'Akses Dibatasi',
        'Silakan login terlebih dahulu untuk mengakses menu ini.'
      );
      setCurrentRoute(ROUTES.AUTH.LOGIN);
      return;
    }
    setCurrentRoute(route);
  };

  const renderActiveScreen = () => {
    switch (currentRoute) {
      case ROUTES.AUTH.ONBOARDING:
        return (
          <OnboardingScreen
            onFinish={() => setCurrentRoute(ROUTES.AUTH.LOGIN)}
            onNavigateToLogin={() => setCurrentRoute(ROUTES.AUTH.LOGIN)}
          />
        );
      case ROUTES.AUTH.LOGIN:
        return (
          <LoginScreen
            onNavigateToRegister={() => setCurrentRoute(ROUTES.AUTH.REGISTER)}
            onLoginSuccess={() => setCurrentRoute(ROUTES.MAIN.DASHBOARD)}
          />
        );
      case ROUTES.AUTH.REGISTER:
        return (
          <RegisterScreen
            onNavigateToLogin={() => setCurrentRoute(ROUTES.AUTH.LOGIN)}
          />
        );
      case ROUTES.MAIN.CANTEEN_MENU:
        return (
          <CanteenMenuScreen
            onNavigateToWallet={() => setCurrentRoute(ROUTES.MAIN.CANTEEN_WALLET)}
          />
        );
      case ROUTES.MAIN.CANTEEN_WALLET:
        return (
          <CanteenWalletScreen
            onNavigateToMenu={() => setCurrentRoute(ROUTES.MAIN.CANTEEN_MENU)}
            onNavigateToHistory={() =>
              setCurrentRoute(ROUTES.MAIN.CANTEEN_HISTORY)
            }
          />
        );
      case ROUTES.MAIN.CANTEEN_HISTORY:
        return <CanteenHistoryScreen />;
      case ROUTES.MAIN.PROFILE:
        return (
          <ProfileSettingsScreen
            onNavigateToCanteen={() => setCurrentRoute(ROUTES.MAIN.CANTEEN_MENU)}
            onNavigateToWallet={() =>
              setCurrentRoute(ROUTES.MAIN.CANTEEN_WALLET)
            }
          />
        );
      case ROUTES.MAIN.COURSE_LIST:
        return (
          <CourseListScreen
            onNavigateToCourseDetail={(course) => {
              setSelectedCourse(course);
              setCurrentRoute(ROUTES.MAIN.COURSE_DETAIL);
            }}
            onBack={() => setCurrentRoute(ROUTES.MAIN.DASHBOARD)}
          />
        );
      case ROUTES.MAIN.COURSE_DETAIL:
        return (
          <CourseDetailScreen
            course={selectedCourse}
            onBack={() => setCurrentRoute(ROUTES.MAIN.COURSE_LIST)}
            onStartLesson={(course, subChapter) => {
              if (course) setSelectedCourse(course);
              if (subChapter) setSelectedSubChapter(subChapter);
              setCurrentRoute(ROUTES.MAIN.LESSON);
            }}
          />
        );
      case ROUTES.MAIN.LESSON:
        return (
          <LessonScreen
            course={selectedCourse}
            subChapter={selectedSubChapter}
            onBack={() => setCurrentRoute(ROUTES.MAIN.COURSE_DETAIL)}
            onStartQuiz={(quizData) => {
              setSelectedQuiz(quizData);
              setCurrentRoute(ROUTES.MAIN.QUIZ_ATTEMPT);
            }}
            onNavigateToNext={(nextSub) => {
              if (nextSub) {
                setSelectedSubChapter(nextSub);
              } else {
                setCurrentRoute(ROUTES.MAIN.COURSE_DETAIL);
              }
            }}
            onSelectSubChapter={(sub) => {
              setSelectedSubChapter(sub);
            }}
          />
        );
      case ROUTES.MAIN.QUIZ_ATTEMPT:
        return (
          <QuizAttemptScreen
            quiz={selectedQuiz}
            course={selectedCourse}
            subChapter={selectedSubChapter}
            onBack={() => setCurrentRoute(ROUTES.MAIN.LESSON)}
            onSubmit={(resultData) => {
              setSelectedQuizResult(resultData);
              setCurrentRoute(ROUTES.MAIN.QUIZ_RESULT);
            }}
          />
        );
      case ROUTES.MAIN.QUIZ_RESULT:
        return (
          <QuizResultScreen
            result={selectedQuizResult}
            onBack={() => setCurrentRoute(ROUTES.MAIN.LESSON)}
            onRetry={() => setCurrentRoute(ROUTES.MAIN.QUIZ_ATTEMPT)}
            onContinue={() => setCurrentRoute(ROUTES.MAIN.LESSON)}
          />
        );
      case ROUTES.MAIN.ATTENDANCE:
        return (
          <AttendanceJournalScreen
            onBack={() => {
              setSelectedSchedule(null);
              setCurrentRoute(ROUTES.MAIN.DASHBOARD);
            }}
            schedule={selectedSchedule}
          />
        );
      case ROUTES.MAIN.EKSKUL_ATTENDANCE:
        return (
          <EkskulAttendanceScreen
            onBack={() => setCurrentRoute(ROUTES.MAIN.DASHBOARD)}
            schedule={selectedSchedule}
          />
        );
      case ROUTES.MAIN.LOCATION_ATTENDANCE:
        return (
          <LocationAttendanceScreen
            onBack={() => setCurrentRoute(ROUTES.MAIN.DASHBOARD)}
          />
        );
      case ROUTES.MAIN.NOTIFICATIONS:
        return (
          <NotificationScreen
            onBack={() => setCurrentRoute(ROUTES.MAIN.DASHBOARD)}
            onOpenDetail={(notif) => {
              setSelectedNotification(notif);
              setCurrentRoute(ROUTES.MAIN.NOTIFICATION_DETAIL);
            }}
          />
        );
      case ROUTES.MAIN.NOTIFICATION_DETAIL:
        return (
          <NotificationDetailScreen
            notification={selectedNotification}
            onBack={() => setCurrentRoute(ROUTES.MAIN.NOTIFICATIONS)}
          />
        );
      case ROUTES.MAIN.SCHOOL_BILLING:
        return (
          <SchoolBillingScreen
            onBack={() => setCurrentRoute(ROUTES.MAIN.DASHBOARD)}
            onNavigateToWallet={() => setCurrentRoute(ROUTES.MAIN.CANTEEN_WALLET)}
          />
        );
      case ROUTES.MAIN.DASHBOARD:
      default:
        return (
          <DashboardScreen
            onNavigateToBilling={() =>
              setCurrentRoute(ROUTES.MAIN.SCHOOL_BILLING)
            }
            onNavigateToCanteen={() => setCurrentRoute(ROUTES.MAIN.CANTEEN_MENU)}
            onNavigateToWallet={() =>
              setCurrentRoute(ROUTES.MAIN.CANTEEN_WALLET)
            }
            onNavigateToProfile={() => setCurrentRoute(ROUTES.MAIN.PROFILE)}
            onNavigateToCourseList={() => setCurrentRoute(ROUTES.MAIN.COURSE_LIST)}
            onNavigateToCourseDetail={(course) => {
              setSelectedCourse(course);
              setCurrentRoute(ROUTES.MAIN.COURSE_DETAIL);
            }}
            onNavigateToAttendance={(sch) => {
              setSelectedSchedule(sch || null);
              if (sch?.type === 'ekskul') {
                setCurrentRoute(ROUTES.MAIN.EKSKUL_ATTENDANCE);
              } else if (sch?.type === 'location') {
                setCurrentRoute(ROUTES.MAIN.LOCATION_ATTENDANCE);
              } else {
                setCurrentRoute(ROUTES.MAIN.ATTENDANCE);
              }
            }}
            onNavigateToLocationAttendance={() =>
              setCurrentRoute(ROUTES.MAIN.LOCATION_ATTENDANCE)
            }
          />
        );
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <StatusBar
        style={isDark ? 'light' : 'dark'}
        backgroundColor={theme.background}
      />

      {/* MAIN SCREEN BODY - Spans full height underneath floating bars */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardContainer}
      >
        <AnimatedScreenContainer routeKey={currentRoute}>
          {renderActiveScreen()}
        </AnimatedScreenContainer>
      </KeyboardAvoidingView>

      {/* FLOATING TOP GLOBAL SEARCH HEADER */}
      {showAppHeader && (
        <AppHeader
          onNotificationPress={handleNotificationPress}
          onSearchFocus={() => {
            if (currentRoute !== ROUTES.MAIN.CANTEEN_MENU) {
              setCurrentRoute(ROUTES.MAIN.CANTEEN_MENU);
            }
          }}
        />
      )}

      {/* FLOATING GLASSMORPHIC BOTTOM TAB BAR */}
      {showBottomBar && (
        <BottomTabBar
          currentRoute={currentRoute}
          onSelectRoute={(route) => handleSelectRoute(route)}
        />
      )}

      {/* FLOATING DEV TEST SWITCHER */}
      <DevScreenSwitcher
        currentRoute={currentRoute}
        onSelectRoute={(route) => handleSelectRoute(route)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  keyboardContainer: {
    flex: 1,
  },
  screenWrapper: {
    flex: 1,
  },
});
