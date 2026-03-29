import { useState, useEffect } from "react";
import axios from "axios";

export const GlobalLoader = () => {
    const [loading, setLoading] = useState(false);
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        let timer;
        let activeRequests = 0;
        
        const startLoading = () => {
            activeRequests++;
            if (activeRequests === 1) {
                setLoading(true);
                setProgress(15);
                timer = setInterval(() => {
                    setProgress((prev) => {
                        if (prev >= 90) return 90;
                        return prev + 2;
                    });
                }, 300);
            }
        };

        const stopLoading = () => {
            activeRequests--;
            if (activeRequests <= 0) {
                activeRequests = 0;
                clearInterval(timer);
                setProgress(100);
                setTimeout(() => {
                    setLoading(false);
                    setProgress(0);
                }, 400);
            }
        };

        // Intercept requests
        const requestInterceptor = axios.interceptors.request.use((config) => {
            startLoading();
            return config;
        });

        // Intercept responses
        const responseInterceptor = axios.interceptors.response.use(
            (response) => {
                stopLoading();
                return response;
            },
            (error) => {
                stopLoading();
                return Promise.reject(error);
            }
        );

        return () => {
            axios.interceptors.request.eject(requestInterceptor);
            axios.interceptors.response.eject(responseInterceptor);
            clearInterval(timer);
        };
    }, []);

    if (!loading && progress === 0) return null;

    return (
        <div className="fixed top-0 left-0 right-0 z-[99999] pointer-events-none transition-all duration-300">
            {/* Smooth top progress bar */}
            <div 
                className="h-[4px] bg-gradient-to-r from-lime-400 via-green-500 to-emerald-600 transition-all duration-300 ease-out shadow-[0_0_15px_rgba(163,230,53,0.8)]"
                style={{ width: `${progress}%` }}
            />
        </div>
    );
};

export default GlobalLoader;
