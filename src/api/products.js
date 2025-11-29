export const productsAPI = {
  getProducts: async (search = "", category = "all") => {
    try {
      let BASE_URL = import.meta.env.VITE_API_URL_PRODUCTS;
      const params = new URLSearchParams();

      if (search) params.append("search", search);
      if (category && category !== "all") params.append("category", category);

      if (params.toString()) BASE_URL += `?${params.toString()}`;

      const response = await fetch(BASE_URL);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("API Error:", error);
      throw error;
    }
  },
};