// components/Inventory.jsx
import { useState } from "react";
import { useInventory } from "../hooks/useInventory";
import { useProducts } from "../hooks/useProducts";
import { useCategories } from "../hooks/useCategories";
import { useAuthContext } from "../context/AuthContext";
import InventoryModal from "./InventoryModal";

const Inventory = () => {
  const { user } = useAuthContext();
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [inventoryModalOpen, setInventoryModalOpen] = useState(false);
  const [inventoryAction, setInventoryAction] = useState(null);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const itemsPerPage = 8;

  const { categories, loading: categoriesLoading } = useCategories();
  const { products, loading: productsLoading } = useProducts(
    search,
    selectedCategory
  );
  const { addLog } = useInventory();

  // Sorting function
  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  // Sort products
  const sortedProducts = [...products].sort((a, b) => {
    if (!sortConfig.key) return 0;

    let aValue = a[sortConfig.key];
    let bValue = b[sortConfig.key];

    // Handle nested objects and special cases
    if (sortConfig.key === "category") {
      aValue = a.category || "Uncategorized";
      bValue = b.category || "Uncategorized";
    }

    // Handle numeric values
    if (sortConfig.key === "price" || sortConfig.key === "stock") {
      aValue = parseFloat(aValue) || 0;
      bValue = parseFloat(bValue) || 0;
    }

    // Handle string values
    if (typeof aValue === "string") {
      aValue = aValue.toLowerCase();
      bValue = bValue.toLowerCase();
    }

    if (aValue < bValue) {
      return sortConfig.direction === "asc" ? -1 : 1;
    }
    if (aValue > bValue) {
      return sortConfig.direction === "asc" ? 1 : -1;
    }
    return 0;
  });

  // Pagination
  const totalPages = Math.ceil(sortedProducts.length / itemsPerPage);
  const paginatedProducts = sortedProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePrev = () => setCurrentPage((p) => Math.max(1, p - 1));
  const handleNext = () => setCurrentPage((p) => Math.min(totalPages, p + 1));

  // Sort indicator component
  const SortIndicator = ({ columnKey }) => {
    if (sortConfig.key !== columnKey) {
      return <span className="text-muted ms-1">↕</span>;
    }
    return (
      <span className="ms-1">{sortConfig.direction === "asc" ? "↑" : "↓"}</span>
    );
  };

  const openInventoryModal = (product, action) => {
    setSelectedProduct(product);
    setInventoryAction(action);
    setInventoryModalOpen(true);
  };

  const closeInventoryModal = () => {
    setSelectedProduct(null);
    setInventoryAction(null);
    setInventoryModalOpen(false);
  };

  const handleConfirmAction = async (quantity, remarks) => {
    try {
      await addLog({
        product_id: selectedProduct.product_id,
        action: inventoryAction,
        quantity,
        remarks,
      });
      closeInventoryModal();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="d-flex flex-column bg-body text-body">
      {/* Filters */}
      <div className="d-flex flex-column flex-sm-row gap-2 p-3 pb-2">
        <input
          type="text"
          className="form-control flex-grow-1"
          placeholder="Search products..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ minWidth: "200px" }}
        />
        <select
          className="form-select flex-shrink-0 mt-2 mt-sm-0"
          style={{ width: "auto", minWidth: "180px" }}
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
        >
          <option value="all">All Categories</option>
          {categoriesLoading ? (
            <option>Loading...</option>
          ) : (
            categories
              .filter((cat) => cat !== "all")
              .map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))
          )}
        </select>
      </div>

      {/* Table Container */}
      <div
        className="card flex-grow-1 mx-3 mb-3 d-flex flex-column"
        style={{ minHeight: "400px", maxHeight: "calc(100vh - 200px)" }}
      >
        {productsLoading ? (
          <div className="d-flex justify-content-center align-items-center h-100 p-5">
            <div className="text-center">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="mt-2 mb-0">Loading products...</p>
            </div>
          </div>
        ) : sortedProducts.length === 0 ? (
          <div className="d-flex justify-content-center align-items-center h-100 p-5">
            <div className="text-center">
              <i className="bi bi-inbox fs-1 text-muted"></i>
              <p className="mt-2 mb-0">No products found.</p>
            </div>
          </div>
        ) : (
          <div
            className="table-responsive flex-grow-1 "
            style={{ maxHeight: "100%", overflow: "auto" }}
          >
            <table className="table table-hover mb-0 align-middle">
              {/* Table Headers with responsive classes */}
              <thead
                className="table-light position-sticky"
                style={{ top: 0, zIndex: 1 }}
              >
                <tr>
                  <th
                    scope="col"
                    className="d-none d-md-table-cell"
                    onClick={() => handleSort("name")}
                    style={{ cursor: "pointer" }}
                  >
                    Name <SortIndicator columnKey="name" />
                  </th>
                  <th
                    scope="col"
                    className="d-table-cell"
                    onClick={() => handleSort("category")}
                    style={{ cursor: "pointer" }}
                  >
                    Category <SortIndicator columnKey="category" />
                  </th>
                  <th
                    scope="col"
                    className="d-table-cell"
                    onClick={() => handleSort("price")}
                    style={{ cursor: "pointer" }}
                  >
                    Price <SortIndicator columnKey="price" />
                  </th>
                  <th
                    scope="col"
                    className="d-table-cell"
                    onClick={() => handleSort("stock")}
                    style={{ cursor: "pointer" }}
                  >
                    Stock <SortIndicator columnKey="stock" />
                  </th>
                  <th scope="col" className="d-table-cell">
                    Actions
                  </th>
                </tr>
              </thead>

              {/* Table Rows with responsive classes */}
              <tbody>
                {paginatedProducts.map((product) => (
                  <tr key={product.product_id}>
                    <td className="d-none d-md-table-cell fw-medium">
                      {product.name}
                    </td>
                    <td className="d-table-cell">
                      <span className="badge bg-secondary">
                        {product.category || "Uncategorized"}
                      </span>
                    </td>
                    <td className="d-table-cell fw-bold text-success">
                      ₱{parseFloat(product.price).toFixed(2)}
                    </td>
                    <td className="d-table-cell">
                      <span
                        className={`badge ${
                          product.stock > 10
                            ? "bg-success"
                            : product.stock > 0
                            ? "bg-warning"
                            : "bg-danger"
                        }`}
                      >
                        {product.stock}
                      </span>
                    </td>
                    <td className="d-table-cell">
                      <div className="dropdown">
                        <button
                          className="btn btn-primary btn-sm dropdown-toggle"
                          type="button"
                          id={`actionDropdown-${product.product_id}`}
                          data-bs-toggle="dropdown"
                          aria-expanded="false"
                        >
                          Action
                        </button>
                        <ul
                          className="dropdown-menu"
                          aria-labelledby={`actionDropdown-${product.product_id}`}
                        >
                          {["add", "remove", "adjust", "sale"].map((action) => (
                            <li key={action}>
                              <button
                                className="dropdown-item text-capitalize"
                                onClick={() =>
                                  openInventoryModal(product, action)
                                }
                              >
                                {action}
                              </button>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination Controls */}
      {sortedProducts.length > itemsPerPage && (
        <div className="d-flex flex-column flex-sm-row justify-content-between align-items-center p-3 pt-0 gap-2">
          <button
            className="btn btn-outline-primary order-2 order-sm-1"
            onClick={handlePrev}
            disabled={currentPage === 1}
          >
            Previous
          </button>
          <span className="order-1 order-sm-2 text-center">
            Page {currentPage} of {totalPages}
          </span>
          <button
            className="btn btn-outline-primary order-3"
            onClick={handleNext}
            disabled={currentPage === totalPages}
          >
            Next
          </button>
        </div>
      )}

      {/* Inventory Modal */}
      {inventoryModalOpen && selectedProduct && (
        <InventoryModal
          product={selectedProduct}
          action={inventoryAction}
          onClose={closeInventoryModal}
          user={user}
          onInventoryUpdated={() => handleConfirmAction(0, "")}
        />
      )}
    </div>
  );
};

export default Inventory;
