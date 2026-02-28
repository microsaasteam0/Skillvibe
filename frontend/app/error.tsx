'use client';

import { useEffect } from 'react';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Log the error to an error reporting service
        console.error('Next.js Page Error:', error);
    }, [error]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-white dark:bg-black text-black dark:text-white pb-20">
            <div className="text-center p-8 bg-red-50 dark:bg-red-900/10 rounded-3xl border border-red-100 dark:border-red-900/30 max-w-2xl">
                <h2 className="text-2xl font-bold mb-4">Something went wrong!</h2>
                <p className="text-muted-foreground mb-4">
                    {error.message}
                </p>
                <button
                    onClick={
                        // Attempt to recover by trying to re-render the segment
                        () => reset()
                    }
                    className="px-6 py-3 bg-red-600 text-white rounded-xl shadow-lg hover:bg-red-700 transition"
                >
                    Try again
                </button>
            </div>
        </div>
    );
}
