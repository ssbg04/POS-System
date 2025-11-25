// api/categories.js
const BASE_URL = import.meta.env.VITE_API_URL_CATEGORIES;

export const fetchCategories = async () => {
    try {
        const response = await fetch(BASE_URL);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data.map(cat => cat.name); // return array of category names
    } catch (err) {
        console.error('Error fetching categories:', err);
        throw err;
    }
};
