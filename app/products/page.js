"use client";

import { useEffect, useState } from "react";
import api from "@/app/services/api";

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
        const response = await api.get("/products/categories");
        setCategories(response.data);
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

  useEffect(() => {
    const handleFocus = () => {
      fetchProducts();
    };

    window.addEventListener("focus", handleFocus);

    return () => {
      window.removeEventListener("focus", handleFocus);
    };
  }, []);

  const getLocalProducts = () => {
    try {
      const storedProducts = JSON.parse(
        localStorage.getItem("addedProducts") || "[]"
      );

      if (!Array.isArray(storedProducts)) {
        return [];
      }

      const uniqueProducts = [];
      const seen = new Set();

      storedProducts.forEach((product) => {
        const key = `${String(product.id)}-${String(
          product.title
        ).toLowerCase()}`;

        if (!seen.has(key)) {
          seen.add(key);
          uniqueProducts.push(product);
        }
      });

      if (uniqueProducts.length !== storedProducts.length) {
        localStorage.setItem(
          "addedProducts",
          JSON.stringify(uniqueProducts)
        );
      }

      return uniqueProducts;
    } catch {
      return [];
    }
  };

  const getEditedProducts = () => {
    try {
      const editedProducts = JSON.parse(
        localStorage.getItem("editedProducts") || "[]"
      );

      return Array.isArray(editedProducts)
        ? editedProducts
        : [];
    } catch {
      return [];
    }
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError("");

      const skip = (page - 1) * pageSize;

      let response;

      if (search.trim()) {
        response = await api.get("/products/search", {
          params: {
            q: search,
            limit: pageSize,
            skip,
          },
        });
      } else if (category) {
        response = await api.get(
          `/products/category/${encodeURIComponent(category)}`,
          {
            params: {
              limit: pageSize,
              skip,
            },
          }
        );
      } else {
        response = await api.get("/products", {
          params: {
            limit: pageSize,
            skip,
          },
        });
      }

      const data = response.data;

      const editedProducts = getEditedProducts();

      const apiProducts = data.products.map((product) => {
        const editedProduct = editedProducts.find(
          (item) => String(item.id) === String(product.id)
        );

        return {
          ...product,
          ...(editedProduct || {}),
          isLocal: false,
        };
      });

      let localProducts = getLocalProducts();

      if (search.trim()) {
        localProducts = localProducts.filter((product) =>
          String(product.title)
            .toLowerCase()
            .includes(search.toLowerCase())
        );
      }

      if (category) {
        localProducts = localProducts.filter(
          (product) => product.category === category
        );
      }

      const localProductsWithFlag = localProducts.map((product) => ({
        ...product,
        isLocal: true,
      }));

      let result = [
        ...apiProducts,
        ...localProductsWithFlag,
      ];

      if (sortBy) {
        result.sort((a, b) => {
          let valueA = a[sortBy];
          let valueB = b[sortBy];

          if (sortBy === "title") {
            valueA = String(valueA).toLowerCase();
            valueB = String(valueB).toLowerCase();
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
      setTotal(data.total + localProducts.length);
    } catch (error) {
      console.error(error);
      setError("Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  const getProductLink = (product) => {
    if (!product.isLocal) {
      return `/product/${product.id}`;
    }

    if (String(product.id).startsWith("local-")) {
      return `/product/${product.id}`;
    }

    return `/product/local-${product.id}`;
  };

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const startItem =
    total === 0 ? 0 : (page - 1) * pageSize + 1;

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

        <a
          href="/product/add"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-center"
        >
          + Add Product
        </a>

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

      <div className="hidden md:block bg-white rounded-xl shadow overflow-x-auto">

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
            {products.map((product, index) => (
              <tr
                key={`${product.isLocal ? "local" : "api"}-${product.id}-${product.title}-${index}`}
                className="border-t"
              >
                <td className="p-4">
                  <img
                    src={product.thumbnail}
                    alt={product.title}
                    className="w-16 h-16 object-cover rounded"
                  />
                </td>

                <td className="p-4 font-medium">
                  <a
                    href={getProductLink(product)}
                    className="text-blue-600 hover:underline"
                  >
                    {product.title}
                  </a>
                </td>

                <td className="p-4">
                  {product.category}
                </td>

                <td className="p-4">
                  ${product.price}
                </td>

                <td className="p-4">
                  ⭐ {product.rating}
                </td>

                <td className="p-4">
                  {product.stock}
                </td>
              </tr>
            ))}
          </tbody>

        </table>
      </div>

      <div className="md:hidden space-y-4">

        {products.map((product, index) => (
          <div
            key={`${product.isLocal ? "local" : "api"}-${product.id}-${product.title}-${index}`}
            className="bg-white rounded-xl shadow p-4"
          >

            <img
              src={product.thumbnail}
              alt={product.title}
              className="w-full h-48 object-contain rounded mb-4"
            />

            <a
              href={getProductLink(product)}
              className="text-lg font-bold text-blue-600 hover:underline"
            >
              {product.title}
            </a>

            <p className="text-gray-600 mt-2">
              Category: {product.category}
            </p>

            <p className="font-semibold mt-2">
              Price: ${product.price}
            </p>

            <p className="mt-1">
              Rating: ⭐ {product.rating}
            </p>

            <p className="mt-1">
              Stock: {product.stock}
            </p>

          </div>
        ))}

      </div>

      {products.length === 0 && (
        <div className="bg-white mt-4 p-8 rounded-xl text-center">
          <p className="text-gray-500">
            No products found.
          </p>
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-6">

        <p className="text-gray-600">
          Showing {startItem}–{endItem} of {total}
        </p>

        <div className="flex items-center gap-2 flex-wrap justify-center">

          <button
            onClick={() =>
              setPage((current) => current - 1)
            }
            disabled={page === 1}
            className="px-4 py-2 border rounded-lg bg-white disabled:opacity-50"
          >
            Previous
          </button>

          {Array.from(
            { length: totalPages },
            (_, index) => index + 1
          ).map((pageNumber) => (
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
          ))}

          <button
            onClick={() =>
              setPage((current) => current + 1)
            }
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