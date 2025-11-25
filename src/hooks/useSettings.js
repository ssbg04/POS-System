import { useState, useEffect } from 'react';
import { settingsAPI } from '../api/settings';

export const useSettings = () => {
    const [settings, setSettings] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchSettings = async () => {
        try {
            setLoading(true);
            setError(null);
            const settingsData = await settingsAPI.getSettings();

            console.log('Raw API response:', settingsData);
            console.log('Type of response:', typeof settingsData);
            console.log('Is array?', Array.isArray(settingsData));

            // Handle both array and object responses
            let finalSettings;
            if (Array.isArray(settingsData)) {
                // If it's an array, take the first element
                finalSettings = settingsData[0] || {};
                console.log('Extracted from array:', finalSettings);
            } else {
                // If it's already an object, use it directly
                finalSettings = settingsData || {};
                console.log('Using object directly:', finalSettings);
            }

            console.log('Final settings:', finalSettings);
            console.log('Store name:', finalSettings.store_name);
            console.log('Address:', finalSettings.address);
            console.log('Contact:', finalSettings.contact);

            setSettings(finalSettings);
        } catch (err) {
            setError(err.message);
            console.error('Error fetching settings:', err);
        } finally {
            setLoading(false);
        }
    };

    const updateSettings = async (newSettings) => {
        try {
            setLoading(true);
            setError(null);

            const updatedSettings = await settingsAPI.updateSettings(newSettings);

            // Handle both array and object responses for update as well
            let finalUpdatedSettings;
            if (Array.isArray(updatedSettings)) {
                finalUpdatedSettings = updatedSettings[0] || {};
            } else {
                finalUpdatedSettings = updatedSettings || {};
            }

            setSettings(finalUpdatedSettings);
            return finalUpdatedSettings;
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSettings();
    }, []);

    return {
        settings,
        loading,
        error,
        fetchSettings,
        updateSettings
    };
};