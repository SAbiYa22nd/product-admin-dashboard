"use client";

import { useEffect, useState } from "react";

export default function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);

  const [search, setSearch] = useState("");
  const [searchText, setSearchText] = useState("");

  const [categories, setCategories] = useState([]);
  const [category, setCategory] = useState("");

  const [sortBy, setSortBy] = useState("");
  const [sortOrder, setSortOrder] = useState("asc");

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const response = await fetch(
          "https://dummyjson.com/products/categories"
        );
        const data = await response.json();
        setCategories(data);
      } catch (error) {
        console.error(error);
      }
    };

    loadCategories();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchText);
      setPage(1);
    }, 400);

    return () => clearTimeout(timer);
  }, [searchText]);

  useEffect(() => {
    fetchProducts();
  }, [page, pageSize, search, category, sortBy, sortOrder]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError("");

      const skip = (page - 1) * pageSize;

      let url = "";

      if (search.trim()) {
        url = `https://dummyjson.com/products/search?q=${encodeURIComponent(
          search
        )}&limit=${pageSize}&skip=${skip}`;
      } else if (category) {
        url = `https://dummyjson.com/products/category/${category}?limit=${pageSize}&skip=${skip}`;
      } else {
        url = `https://dummyjson.com/products?limit=${pageSize}&skip=${skip}`;
      }

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error("Failed to fetch products");
      }

      const data = await response.json();

      let result = [...data.products];

      if (sortBy) {
        result.sort((a, b) => {
          let valueA = a[sortBy];
          let valueB = b[sortBy];

          if (sortBy === "title") {
            valueA = valueA.toLowerCase();
            valueB = valueB.toLowerCase();
          }

          if (valueA < valueB) {
            return sortOrder === "asc" ? -1 : 1;
          }

          if (valueA > valueB) {
            return sortOrder === "asc" ? 1 : -1;
          }

          return 0;
        });
      }

      setProducts(result);
      setTotal(data.total);
    } catch (error) {
      console.error(error);
      setError("Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  const totalPages = Math.ceil(total / pageSize);

  const startItem = total === 0 ? 0 : (page - 1) * pageSize + 1;

  const endItem = Math.min(page * pageSize, total);

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-lg">Loading products...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-red-600">{error}</p>

        <button
          onClick={fetchProducts}
          className="bg-blue-600 text-white px-5 py-2 rounded-lg"
        >
          Retry
        </button>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-100 p-6">
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4 mb-6">
        <h1 className="text-3xl font-bold text-gray-800">
          Product Admin Dashboard
        </h1>

        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="Search products..."
            className="border border-gray-300 rounded-lg px-4 py-2 bg-white outline-none focus:ring-2 focus:ring-blue-500"
          />

          <select
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              setPage(1);
            }}
            className="border border-gray-300 rounded-lg px-3 py-2 bg-white"
          >
            <option value="">All Categories</option>

            {categories.map((item) => (
              <option key={item.slug} value={item.slug}>
                {item.name}
              </option>
            ))}
          </select>

          <select
            value={sortBy}
            onChange={(e) => {
              setSortBy(e.target.value);
              setPage(1);
            }}
            className="border border-gray-300 rounded-lg px-3 py-2 bg-white"
          >
            <option value="">Sort by</option>
            <option value="title">Title</option>
            <option value="price">Price</option>
            <option value="rating">Rating</option>
          </select>

          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 bg-white"
          >
            <option value="asc">Ascending</option>
            <option value="desc">Descending</option>
          </select>

          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setPage(1);
            }}
            className="border border-gray-300 rounded-lg px-3 py-2 bg-white"
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-4">Image</th>
              <th className="p-4">Title</th>
              <th className="p-4">Category</th>
              <th className="p-4">Price</th>
              <th className="p-4">Rating</th>
              <th className="p-4">Stock</th>
            </tr>
          </thead>

          <tbody>
            {products.map((product) => (
              <tr key={product.id} className="border-t">
                <td className="p-4">
                  <img
                    src={product.thumbnail}
                    alt={product.title}
                    className="w-16 h-16 object-cover rounded"
                  />
                </td>

                <td className="p-4 font-medium">{product.title}</td>
                <td className="p-4">{product.category}</td>
                <td className="p-4">${product.price}</td>
                <td className="p-4">⭐ {product.rating}</td>
                <td className="p-4">{product.stock}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {products.length === 0 && (
        <div className="bg-white mt-4 p-8 rounded-xl text-center">
          <p className="text-gray-500">No products found.</p>
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-6">
        <p className="text-gray-600">
          Showing {startItem}–{endItem} of {total}
        </p>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setPage(page - 1)}
            disabled={page === 1}
            className="px-4 py-2 border rounded-lg bg-white disabled:opacity-50"
          >
            Previous
          </button>

          {Array.from({ length: totalPages }, (_, index) => index + 1).map(
            (pageNumber) => (
              <button
                key={pageNumber}
                onClick={() => setPage(pageNumber)}
                className={`px-3 py-2 rounded-lg ${
                  page === pageNumber
                    ? "bg-blue-600 text-white"
                    : "bg-white border"
                }`}
              >
                {pageNumber}
              </button>
            )
          )}

          <button
            onClick={() => setPage(page + 1)}
            disabled={page === totalPages}
            className="px-4 py-2 border rounded-lg bg-white disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </main>
  );
}