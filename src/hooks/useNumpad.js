// hooks/useNumpad.js
import { useState, useCallback } from 'react';

export const useNumpad = () => {
    const [showNumpad, setShowNumpad] = useState(false);
    const [numpadValue, setNumpadValue] = useState('');
    const [numpadTarget, setNumpadTarget] = useState(null);
    const [numpadConfig, setNumpadConfig] = useState({
        title: 'Enter Amount',
        allowDecimal: true,
        maxLength: 10
    });

    const openNumpad = useCallback((target, initialValue = '', config = {}) => {
        setNumpadTarget(target);
        setNumpadValue(initialValue.toString().replace(/^0+(?=\d)/, '') || '0');
        setNumpadConfig(prev => ({ ...prev, ...config }));
        setShowNumpad(true);
    }, []);

    const closeNumpad = useCallback(() => {
        setShowNumpad(false);
        setTimeout(() => {
            setNumpadValue('');
            setNumpadTarget(null);
            setNumpadConfig({
                title: 'Enter Amount',
                allowDecimal: true,
                maxLength: 10
            });
        }, 300);
    }, []);

    const handleNumpadInput = useCallback((input) => {
        setNumpadValue(prev => {
            let newValue = prev;

            if (input === 'clear') {
                return '0';
            } else if (input === 'backspace') {
                newValue = prev.slice(0, -1);
                return newValue === '' ? '0' : newValue;
            } else if (input === '.') {
                if (numpadConfig.allowDecimal && !prev.includes('.')) {
                    newValue = prev === '0' ? '0.' : prev + '.';
                }
            } else {
                // Handle numbers
                if (prev === '0') {
                    newValue = input;
                } else if (prev.length < numpadConfig.maxLength) {
                    newValue = prev + input;
                }
            }

            return newValue;
        });
    }, [numpadConfig.allowDecimal, numpadConfig.maxLength]);

    const applyNumpadValue = useCallback(() => {
        closeNumpad();
    }, [closeNumpad]);

    return {
        showNumpad,
        numpadValue,
        numpadTarget,
        numpadConfig,
        openNumpad,
        handleNumpadInput,
        applyNumpadValue,
        closeNumpad
    };
};