// ... existing imports and interfaces ...
export interface SaleItem {
  product_name: string;
  quantity: number;
  price: number;
  total: number;
}

export interface Sale {
  id?: string; // Make sure ID is optional in interface
  customer_name: string | null;
  amount_tendered: number;
  user_name: string;
  tax_amount: number;
  refund_reason: string | null;
  total_amount: number;
  discount_amount: number;
  change_due: number;
  refunded_at: string | null;
  payment_type: string;
  items: SaleItem[];
  sale_date: string;
  status: string;
  discount_type: string;
}

const API_URL = "https://firestore.googleapis.com/v1/projects/pos-system-22c92/databases/(default)/documents/sales";

// Helper to unwrap Firestore values
const unwrapValue = (field: any) => {
  if (!field) return null;
  if (field.stringValue !== undefined) return field.stringValue;
  if (field.integerValue !== undefined) return Number(field.integerValue);
  if (field.doubleValue !== undefined) return Number(field.doubleValue);
  if (field.booleanValue !== undefined) return field.booleanValue;
  if (field.timestampValue !== undefined) return field.timestampValue;
  if (field.nullValue !== undefined) return null;
  return null;
};

export const getSales = async (): Promise<Sale[]> => {
  let sales: Sale[] = [];
  let nextPageToken: string | null = null;

  do {
    try {
      const queryParams = new URLSearchParams({ pageSize: '300' });
      if (nextPageToken) queryParams.append('pageToken', nextPageToken);

      const response = await fetch(`${API_URL}?${queryParams.toString()}`);
      if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
      
      const data = await response.json();
      nextPageToken = data.nextPageToken || null;
      const rawList = data.documents || [];

      const batch = rawList.map((doc: any) => {
        const id = doc.name ? doc.name.split('/').pop() : 'unknown';
        const fields = doc.fields || {};
        
        const itemsWrapper = fields.items?.arrayValue?.values || [];
        const items: SaleItem[] = itemsWrapper.map((item: any) => ({
          product_name: unwrapValue(item.mapValue.fields.product_name),
          quantity: unwrapValue(item.mapValue.fields.quantity),
          price: unwrapValue(item.mapValue.fields.price),
          total: unwrapValue(item.mapValue.fields.total),
        }));

        return {
          id,
          customer_name: unwrapValue(fields.customer_name),
          amount_tendered: unwrapValue(fields.amount_tendered) || 0,
          user_name: unwrapValue(fields.user_name) || 'Unknown',
          tax_amount: unwrapValue(fields.tax_amount) || 0,
          refund_reason: unwrapValue(fields.refund_reason),
          total_amount: unwrapValue(fields.total_amount) || 0,
          discount_amount: unwrapValue(fields.discount_amount) || 0,
          change_due: unwrapValue(fields.change_due) || 0,
          refunded_at: unwrapValue(fields.refunded_at),
          payment_type: unwrapValue(fields.payment_type) || 'Cash',
          items,
          sale_date: unwrapValue(fields.sale_date),
          status: unwrapValue(fields.status) || 'completed',
          discount_type: unwrapValue(fields.discount_type) || 'None'
        };
      });

      sales = [...sales, ...batch];

    } catch (error) {
      console.error("Failed to fetch sales page:", error);
      throw error;
    }
  } while (nextPageToken);

  return sales;
};

export const updateSaleStatus = async (id: string, status: 'void' | 'refunded', reason: string): Promise<void> => {
  const url = `${API_URL}/${id}?updateMask.fieldPaths=status&updateMask.fieldPaths=refund_reason&updateMask.fieldPaths=refunded_at`;
  const now = new Date().toISOString();

  const response = await fetch(url, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fields: {
        status: { stringValue: status },
        refund_reason: { stringValue: reason },
        refunded_at: { timestampValue: now }
      }
    })
  });

  if (!response.ok) throw new Error(`Failed to update sale status: ${response.status}`);
};

// Updated to return string (The new ID)
export const createSale = async (sale: Sale): Promise<string> => {
  const payload = {
    fields: {
      customer_name: sale.customer_name ? { stringValue: sale.customer_name } : { nullValue: null },
      amount_tendered: { doubleValue: sale.amount_tendered },
      user_name: { stringValue: sale.user_name },
      tax_amount: { doubleValue: sale.tax_amount },
      refund_reason: { nullValue: null },
      total_amount: { doubleValue: sale.total_amount },
      discount_amount: { doubleValue: sale.discount_amount },
      change_due: { doubleValue: sale.change_due },
      refunded_at: { nullValue: null },
      payment_type: { stringValue: sale.payment_type },
      sale_date: { timestampValue: sale.sale_date },
      status: { stringValue: sale.status },
      discount_type: { stringValue: sale.discount_type },
      items: {
        arrayValue: {
          values: sale.items.map(item => ({
            mapValue: {
              fields: {
                product_name: { stringValue: item.product_name },
                quantity: { integerValue: String(item.quantity) },
                price: { doubleValue: item.price },
                total: { doubleValue: item.total }
              }
            }
          }))
        }
      }
    }
  };

  const response = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    // @ts-ignore
    const errText = await response.text();
    throw new Error(`Failed to create sale: ${response.status}`);
  }

  // Parse response to get the ID
  const data = await response.json();
  // data.name is like "projects/.../documents/sales/DOCUMENT_ID"
  const newId = data.name.split('/').pop();
  
  return newId;
};

