/**
 * Declutterly - Root Index
 * Redirects to appropriate screen based on auth state
 */

import { Redirect } from 'expo-router';

export default function Index() {
  // The root layout handles routing based on user state
  // This redirect ensures we go to the tabs if user is logged in
  return <Redirect href="/(tabs)" />;
}
