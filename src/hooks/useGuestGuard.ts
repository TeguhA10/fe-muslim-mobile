import { useAuthStore } from '../store/useAuthStore';

/**
 * useGuestGuard — wraps actions that require a logged-in user.
 * If the user is a guest, shows the GuestGuardModal and on confirm
 * calls store.requestRegister() which transitions RootNavigator to Register screen.
 *
 * Usage:
 *   const { guardAction, isGuest } = useGuestGuard();
 *   <TouchableOpacity onPress={guardAction(() => doProtectedAction(), showModal)} />
 */
export function useGuestGuard() {
  const { isGuest, isAuthenticated, requestRegister } = useAuthStore();

  /**
   * Call this when a guest taps a protected action.
   * If guest → calls openGuardModal callback.
   * If authenticated → runs the action directly.
   */
  const guardAction = (action: () => void, openGuardModal: () => void) => () => {
    if (isGuest || !isAuthenticated) {
      openGuardModal();
      return;
    }
    action();
  };

  return { guardAction, isGuest, isAuthenticated, requestRegister };
}
