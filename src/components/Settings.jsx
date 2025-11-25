// components/Settings.jsx (Fixed to match backend fields)
import React, { useState, useEffect } from "react";
import { useSettings } from "../hooks/useSettings";
import { useTheme } from "../hooks/useTheme";

const Settings = () => {
    const { updateTheme } = useTheme();
    const { settings, loading, error, updateSettings } = useSettings();
    const [formData, setFormData] = useState({});
    const [saving, setSaving] = useState(false);
    const [saveMessage, setSaveMessage] = useState("");
    const [logoPreview, setLogoPreview] = useState("");

    // Initialize form data from database
    useEffect(() => {
        if (settings) {
            const settingData = Array.isArray(settings) ? settings[0] : settings;
            const initialData = {
                store_name: settingData.store_name || '',
                address: settingData.address || '',
                contact: settingData.contact || '',
                tax_rate: settingData.tax_rate || 0.12,
                pwd_discount_rate: settingData.pwd_discount_rate || 0.20,
                senior_discount_rate: settingData.senior_discount_rate || 0.20,
                dark_mode: settingData.dark_mode || 'system', // Changed from theme_mode to dark_mode
                fullscreen_mode: settingData.fullscreen_mode || 'auto',
                store_logo_url: settingData.store_logo_url || '',
                business_hours: settingData.business_hours || '',
                receipt_footer: settingData.receipt_footer || ''
            };

            setFormData(initialData);

            if (settingData.store_logo_url) {
                setLogoPreview(settingData.store_logo_url);
            }
        }
    }, [settings]);

    // Sync theme with localStorage on mount
    useEffect(() => {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme && settings) {
            setFormData(prev => ({ ...prev, dark_mode: savedTheme })); // Changed from theme_mode to dark_mode
        }
    }, [settings]);

    const handleInputChange = (e) => {
        const { name, value, type, files } = e.target;

        if (type === 'file' && files && files[0]) {
            const file = files[0];
            const reader = new FileReader();
            reader.onload = (e) => {
                const logoUrl = e.target.result;
                setLogoPreview(logoUrl);
                setFormData(prev => ({ ...prev, [name]: logoUrl }));
            };
            reader.readAsDataURL(file);
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }

        if (name === 'dark_mode') { // Changed from theme_mode to dark_mode
            updateTheme(value);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setSaveMessage("");

        try {
            await updateSettings(formData);
            setSaveMessage("Settings saved successfully! 💾");
            setTimeout(() => setSaveMessage(""), 3000);
        } catch (err) {
            setSaveMessage("❌ Failed to save settings: " + err.message);
        } finally {
            setSaving(false);
        }
    };

    const removeLogo = () => {
        setLogoPreview("");
        setFormData(prev => ({ ...prev, store_logo_url: '' }));
    };

    const businessHoursOptions = [
        { value: '24/7', label: '24/7 Open' },
        { value: '9AM-6PM', label: '9:00 AM - 6:00 PM' },
        { value: '8AM-8PM', label: '8:00 AM - 8:00 PM' },
        { value: '10AM-10PM', label: '10:00 AM - 10:00 PM' },
        { value: 'custom', label: 'Custom Hours' }
    ];

    if (loading) return (
        <div className="d-flex justify-content-center align-items-center vh-100 bg-body">
            <div className="text-center text-body">
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
                <p className="mt-3">Loading settings...</p>
            </div>
        </div>
    );

    if (error) return (
        <div className="d-flex justify-content-center align-items-center vh-100 bg-body">
            <div className="alert alert-danger shadow-lg" role="alert">
                <strong>Error:</strong> {error}
            </div>
        </div>
    );

    return (
        <div className="container-fluid p-4 bg-body h-100 d-flex flex-column">
            <div className="row justify-content-center flex-grow-1 min-h-0">
                <div className="col-12 col-lg-10 col-xl-8 h-100 d-flex flex-column">
                    {saveMessage && (
                        <div className={`alert rounded-3 mb-4 ${saveMessage.includes('Failed')
                            ? 'alert-danger'
                            : 'alert-success'
                            }`} role="alert">
                            {saveMessage}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">

                        {/* Store Information */}
                        <div className="bg-body-tertiary rounded-3 p-4">
                            <h5 className="text-primary mb-4">Store Information</h5>
                            <div className="row g-3">
                                <div className="col-12 col-md-6">
                                    <label htmlFor="store_name" className="form-label">Store Name</label>
                                    <input
                                        type="text"
                                        id="store_name"
                                        name="store_name"
                                        value={formData.store_name || ''}
                                        onChange={handleInputChange}
                                        className="form-control"
                                        placeholder="Enter store name"
                                    />
                                </div>
                                <div className="col-12 col-md-6">
                                    <label htmlFor="contact" className="form-label">Contact Number</label>
                                    <input
                                        type="text"
                                        id="contact"
                                        name="contact"
                                        value={formData.contact || ''}
                                        onChange={handleInputChange}
                                        className="form-control"
                                        placeholder="Enter contact number"
                                    />
                                </div>
                                <div className="col-12">
                                    <label htmlFor="address" className="form-label">Address</label>
                                    <textarea
                                        id="address"
                                        name="address"
                                        value={formData.address || ''}
                                        onChange={handleInputChange}
                                        rows={2}
                                        className="form-control"
                                        placeholder="Enter store address"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Store Logo */}
                        <div className="bg-body-tertiary rounded-3 p-4">
                            <h5 className="text-primary mb-4">Store Logo</h5>
                            <div className="row g-3 align-items-start">
                                <div className="col-12 col-md-8">
                                    <label htmlFor="store_logo_url" className="form-label">Upload Store Logo</label>
                                    <input
                                        type="file"
                                        id="store_logo_url"
                                        name="store_logo_url"
                                        onChange={handleInputChange}
                                        accept="image/*"
                                        className="form-control"
                                    />
                                    <div className="form-text">
                                        Recommended: Square image, PNG or JPG, max 2MB
                                    </div>
                                </div>
                                <div className="col-12 col-md-4 d-flex flex-column align-items-center">
                                    <div className="p-2 border border-dashed rounded-3 bg-light d-flex align-items-center justify-content-center" style={{ width: '80px', height: '80px' }}>
                                        {logoPreview ? (
                                            <img
                                                src={logoPreview}
                                                alt="Store Logo Preview"
                                                className="img-fluid rounded-2"
                                                style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }}
                                            />
                                        ) : (
                                            <span className="text-muted small">No Logo</span>
                                        )}
                                    </div>
                                    {logoPreview && (
                                        <button
                                            type="button"
                                            onClick={removeLogo}
                                            className="btn btn-sm btn-outline-danger mt-2"
                                        >
                                            Remove
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Business Hours & Receipt Footer */}
                        <div className="row g-3">
                            <div className="col-12 col-md-6">
                                <div className="bg-body-tertiary rounded-3 p-4 h-100">
                                    <h5 className="text-primary mb-4">Business Hours</h5>
                                    <label htmlFor="business_hours" className="form-label">Operating Hours</label>
                                    <select
                                        id="business_hours"
                                        name="business_hours"
                                        value={formData.business_hours || ''}
                                        onChange={handleInputChange}
                                        className="form-select"
                                    >
                                        <option value="">Select business hours</option>
                                        {businessHoursOptions.map(option => (
                                            <option key={option.value} value={option.value}>
                                                {option.label}
                                            </option>
                                        ))}
                                    </select>
                                    {formData.business_hours === 'custom' && (
                                        <div className="mt-3">
                                            <label htmlFor="business_hours_custom" className="form-label">Custom Business Hours</label>
                                            <input
                                                type="text"
                                                id="business_hours_custom"
                                                name="business_hours_custom"
                                                value={formData.business_hours_custom || ''}
                                                onChange={handleInputChange}
                                                className="form-control"
                                                placeholder="e.g., Mon-Fri 9AM-6PM, Sat 10AM-4PM"
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="col-12 col-md-6">
                                <div className="bg-body-tertiary rounded-3 p-4 h-100">
                                    <h5 className="text-primary mb-4">Receipt Settings</h5>
                                    <label htmlFor="receipt_footer" className="form-label">Receipt Footer Message</label>
                                    <textarea
                                        id="receipt_footer"
                                        name="receipt_footer"
                                        value={formData.receipt_footer || ''}
                                        onChange={handleInputChange}
                                        rows={2}
                                        className="form-control"
                                        placeholder="Thank you for your purchase! Visit us again..."
                                    />
                                    <div className="form-text">
                                        This message will appear at the bottom of all receipts
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Tax & Discount Rates */}
                        <div className="bg-body-tertiary rounded-3 p-4">
                            <h5 className="text-primary mb-4">Tax & Discount Rates</h5>
                            <div className="row g-3">
                                <div className="col-12 col-md-4">
                                    <label htmlFor="tax_rate" className="form-label">Tax Rate (%)</label>
                                    <input
                                        type="number"
                                        id="tax_rate"
                                        name="tax_rate"
                                        value={formData.tax_rate ? (formData.tax_rate * 100) : ''}
                                        onChange={(e) => setFormData(prev => ({ ...prev, tax_rate: (parseFloat(e.target.value) || 0) / 100 }))}
                                        step="0.1"
                                        min="0"
                                        max="100"
                                        className="form-control"
                                    />
                                    <div className="form-text">
                                        Current: {(formData.tax_rate * 100).toFixed(1)}%
                                    </div>
                                </div>
                                <div className="col-12 col-md-4">
                                    <label htmlFor="pwd_discount_rate" className="form-label">PWD Discount (%)</label>
                                    <input
                                        type="number"
                                        id="pwd_discount_rate"
                                        name="pwd_discount_rate"
                                        value={formData.pwd_discount_rate ? (formData.pwd_discount_rate * 100) : ''}
                                        onChange={(e) => setFormData(prev => ({ ...prev, pwd_discount_rate: (parseFloat(e.target.value) || 0) / 100 }))}
                                        step="0.1"
                                        min="0"
                                        max="100"
                                        className="form-control"
                                    />
                                    <div className="form-text">
                                        Current: {(formData.pwd_discount_rate * 100).toFixed(1)}%
                                    </div>
                                </div>
                                <div className="col-12 col-md-4">
                                    <label htmlFor="senior_discount_rate" className="form-label">Senior Discount (%)</label>
                                    <input
                                        type="number"
                                        id="senior_discount_rate"
                                        name="senior_discount_rate"
                                        value={formData.senior_discount_rate ? (formData.senior_discount_rate * 100) : ''}
                                        onChange={(e) => setFormData(prev => ({ ...prev, senior_discount_rate: (parseFloat(e.target.value) || 0) / 100 }))}
                                        step="0.1"
                                        min="0"
                                        max="100"
                                        className="form-control"
                                    />
                                    <div className="form-text">
                                        Current: {(formData.senior_discount_rate * 100).toFixed(1)}%
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Display & Interface */}
                        <div className="bg-body-tertiary rounded-3 p-4">
                            <h5 className="text-primary mb-4">Display & Interface</h5>
                            <div className="row g-3">
                                <div className="col-12 col-md-6">
                                    <label htmlFor="dark_mode" className="form-label">Theme Mode</label>
                                    <select
                                        id="dark_mode"
                                        name="dark_mode"
                                        value={formData.dark_mode || 'system'}
                                        onChange={handleInputChange}
                                        className="form-select"
                                    >
                                        <option value="system">System Default</option>
                                        <option value="light">Light Mode</option>
                                        <option value="dark">Dark Mode</option>
                                    </select>
                                    <div className="form-text">
                                        Override system theme preference
                                    </div>
                                </div>
                                <div className="col-12 col-md-6">
                                    <label htmlFor="fullscreen_mode" className="form-label">Fullscreen Mode</label>
                                    <select
                                        id="fullscreen_mode"
                                        name="fullscreen_mode"
                                        value={formData.fullscreen_mode || 'auto'}
                                        onChange={handleInputChange}
                                        className="form-select"
                                    >
                                        <option value="auto">Auto (Tablet Only)</option>
                                        <option value="on">Always On</option>
                                        <option value="off">Always Off</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Save Button */}
                        <div className="d-flex justify-content-end mt-4">
                            <button
                                type="submit"
                                disabled={saving}
                                className="btn btn-primary btn-lg px-4"
                            >
                                {saving ? (
                                    <>
                                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                        Saving...
                                    </>
                                ) : 'Save Settings'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Settings;