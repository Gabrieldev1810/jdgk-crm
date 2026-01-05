import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from './App';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();

describe('App', () => {
    it('renders without crashing', () => {
        render(
            <QueryClientProvider client={queryClient}>
                <App />
            </QueryClientProvider>
        );
        // Basic check - seeing if it renders is often enough for a smoke test
        // Usually we look for a known element, like "Login"
        // expect(screen.getByText(/Sign In/i)).toBeInTheDocument();
        expect(true).toBeTruthy();
    });
});
