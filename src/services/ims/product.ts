export interface Product {
  id: string;
  category: string;
  name: string;
  quantity: number;
  minQuantity: number;
  price: number;
  status: string;
  sold: number;
  barcode: string; // Added barcode field
}

const API_URL =
  "https://firestore.googleapis.com/v1/projects/nosql-demo-e5885/databases/(default)/documents/products";

// Helper to unwrap Firestore fields
const unwrapValue = (field: any) => {
  if (!field) return null;
  if (field.stringValue !== undefined) return field.stringValue;
  if (field.integerValue !== undefined) return Number(field.integerValue);
  if (field.doubleValue !== undefined) return Number(field.doubleValue);
  if (field.booleanValue !== undefined) return field.booleanValue;
  if (field.timestampValue !== undefined) return field.timestampValue;
  return null;
};

export const getProducts = async (): Promise<Product[]> => {
  try {
    const response = await fetch(API_URL);
    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status}`);
    }

    const data = await response.json();

    // Firestore list endpoint returns { documents: [...] }
    const rawList = data.documents || [];

    return rawList.map((doc: any, index: number) => {
      // 1. Extract ID from the document "name" path
      const id = doc.name ? doc.name.split("/").pop() : `temp-id-${index}`;

      // 2. Unwrap the fields
      const fields = doc.fields || {};

      // 3. Generate deterministic barcode based on ID (No DB change needed)
      // Hash the ID to create a unique 12-digit number
      let hash = 5381;
      for (let i = 0; i < id.length; i++) {
        hash = (hash * 33) ^ id.charCodeAt(i);
      }
      // Ensure positive, add base, take 12 digits
      const barcode = (Math.abs(hash) + 100000000000).toString().slice(0, 12);

      return {
        id,
        category: unwrapValue(fields.category) || "Uncategorized",
        name: unwrapValue(fields.name) || "Unnamed Product",
        quantity: unwrapValue(fields.quantity) || 0,
        minQuantity: unwrapValue(fields.minQuantity) || 0,
        price: unwrapValue(fields.price) || 0,
        status: unwrapValue(fields.status) || "Inactive",
        sold: unwrapValue(fields.sold) || 0,
        barcode: barcode,
      };
    });
  } catch (error) {
    console.error("Failed to fetch products:", error);
    throw error;
  }
};

export const updateProductStock = async (
  id: string,
  newQuantity: number,
  newSoldCount: number
): Promise<void> => {
  // Construct URL for specific document with updateMask
  const url = `${API_URL}/${id}?updateMask.fieldPaths=quantity&updateMask.fieldPaths=sold`;

  const response = await fetch(url, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fields: {
        quantity: { integerValue: String(newQuantity) },
        sold: { integerValue: String(newSoldCount) },
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to update stock: ${response.status}`);
  }
};
