import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RootNavigator } from './src/navigation/RootNavigator';
import { MandatoryPermissionGateModal } from './src/components/common/MandatoryPermissionGateModal';
import { useNetworkStore } from './src/store/useNetworkStore';

const queryClient = new QueryClient();

export default function App() {
  useEffect(() => {
    const unsubscribe = useNetworkStore.getState().initNetworkListener();
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <StatusBar style="auto" />
      <RootNavigator />
      <MandatoryPermissionGateModal />
    </QueryClientProvider>
  );
}
