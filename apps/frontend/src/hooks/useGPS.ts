
import { useState, useEffect } from 'react';

export const useGPS = (isActive: boolean) => {
    const [location, setLocation] = useState<{ lat: number, lng: number } | null>(null);

    useEffect(() => {
        if (!isActive) return;

        const reportLocation = () => {
            const newLocation = {
                lat: 41.2565 + (Math.random() - 0.5) * 0.01,
                lng: -95.9345 + (Math.random() - 0.5) * 0.01
            };
            setLocation(newLocation);
            console.log("GPS Position Reported (Simulation):", newLocation);
        };

        console.log("GPS Tracking Started...");
        reportLocation(); // Immediate report on start

        const interval = setInterval(reportLocation, 600000); // Every 10 minutes (600,000 ms)

        return () => {
            clearInterval(interval);
            console.log("GPS Tracking Stopped.");
        };
    }, [isActive]);

    return location;
};
