import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ShellLayout } from '../ui/layout/ShellLayout';
import { AppRoutes } from './routes';

const queryClient = new QueryClient();

export const App: React.FC = () => {
    return (
        <QueryClientProvider client={queryClient}>
            <ShellLayout>
                <AppRoutes />
            </ShellLayout>
        </QueryClientProvider>
    );
};
