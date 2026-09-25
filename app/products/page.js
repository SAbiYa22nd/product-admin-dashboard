"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import api from "@/app/services/api";

const API_TOTAL_FALLBACK = 194;
const LOCAL_ID_START = 195;

function Products() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestIdRef = useRef(0);

  const getValidPage = () => {
    const value = Number(searchParams.get("page"));
    return Number.isInteger(value) && value > 0 ? value : 1;
  };

  const getValidPageSize = () => {
    const value = Number(searchParams.get("pageSize"));
    return [10, 20, 50].includes(value) ? value : 10;
  };

  const getValidSortBy = () => {
    const value = searchParams.get("sortBy");
    return ["", "title", "price", "rating"].includes(value)
      ? value
      : "";
  };

  const getValidSortOrder = () => {
    const value = searchParams.get("sortOrder");
    return ["asc", "desc"].includes(value) ? value : "asc";
  };

  const initialSearch = searchParams.get("search") || "";

  const [authenticated, setAuthenticated] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [page, setPage] = useState(getValidPage);
  const [pageSize, setPageSize] = useState(getValidPageSize);

  const [total, setTotal] = useState(0);

  const [search, setSearch] = useState(initialSearch);
  const [searchText, setSearchText] = useState(initialSearch);

  const [category, setCategory] = useState(
    searchParams.get("category") || ""
  );

  const [sortBy, setSortBy] = useState(getValidSortBy);
  const [sortOrder, setSortOrder] = useState(getValidSortOrder);

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      window.location.href = "/";
      return;
    }

    setAuthenticated(true);
    setCheckingAuth(false);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.href = "/";
  };

  useEffect(() => {
    if (!authenticated) return;

    const loadCategories = async () => {
      try {
        const response = await api.get("/products/categories");
        setCategories(response.data);
      } catch (error) {
        console.error(error);
      }
    };

    loadCategories();
  }, [authenticated]);

  useEffect(() => {
    if (!authenticated) return;

    const urlPage = Number(searchParams.get("page"));

    if (
      searchParams.has("page") &&
      (!Number.isInteger(urlPage) || urlPage < 1)
    ) {
      setPage(1);
    }
  }, [authenticated, searchParams]);

  useEffect(() => {
    if (!authenticated) return;

    const params = new URLSearchParams();

    if (page !== 1) {
      params.set("page", page);
    }

    if (pageSize !== 10) {
      params.set("pageSize", pageSize);
    }

    if (search.trim()) {
      params.set("search", search.trim());
    }

    if (category) {
      params.set("category", category);
    }

    if (sortBy) {
      params.set("sortBy", sortBy);
    }

    if (sortOrder !== "asc") {
      params.set("sortOrder", sortOrder);
    }

    const query = params.toString();

    const newUrl = query
      ? `/products?${query}`
      : "/products";

    const currentUrl =
      window.location.pathname + window.location.search;

    if (currentUrl !== newUrl) {
      router.replace(newUrl, { scroll: false });
    }
  }, [
    page,
    pageSize,
    search,
    category,
    sortBy,
    sortOrder,
    router,
    authenticated,
  ]);

  useEffect(() => {
    if (!authenticated) return;

    const timer = setTimeout(() => {
      const trimmedSearch = searchText.trim();

      setSearch(trimmedSearch);
      setPage(1);
    }, 400);

    return () => clearTimeout(timer);
  }, [searchText, authenticated]);

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
        const title = String(product.title || "")
          .trim()
          .toLowerCase();

        const key = `${String(product.id)}-${title}`;

        if (!seen.has(key)) {
          seen.add(key);
          uniqueProducts.push(product);
        }
      });

      const usedIds = new Set();

      uniqueProducts.forEach((product) => {
        const id = Number(product.id);

        if (
          Number.isInteger(id) &&
          id >= LOCAL_ID_START &&
          !usedIds.has(id)
        ) {
          usedIds.add(id);
        }
      });

      let nextId = LOCAL_ID_START;

      const normalizedProducts = uniqueProducts.map((product) => {
        const id = Number(product.id);

        if (
          Number.isInteger(id) &&
          id >= LOCAL_ID_START &&
          !usedIds.has(id)
        ) {
          usedIds.add(id);

          return {
            ...product,
            id,
            isLocal: true,
          };
        }

        if (
          Number.isInteger(id) &&
          id >= LOCAL_ID_START &&
          usedIds.has(id)
        ) {
          while (usedIds.has(nextId)) {
            nextId++;
          }

          const newId = nextId;
          usedIds.add(newId);
          nextId++;

          return {
            ...product,
            id: newId,
            isLocal: true,
          };
        }

        while (usedIds.has(nextId)) {
          nextId++;
        }

        const newId = nextId;
        usedIds.add(newId);
        nextId++;

        return {
          ...product,
          id: newId,
          isLocal: true,
        };
      });

      localStorage.setItem(
        "addedProducts",
        JSON.stringify(normalizedProducts)
      );

      return normalizedProducts;
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

  const getDeletedProducts = () => {
    try {
      const deletedProducts = JSON.parse(
        localStorage.getItem("deletedProducts") || "[]"
      );

      return Array.isArray(deletedProducts)
        ? deletedProducts
        : [];
    } catch {
      return [];
    }
  };

  const sortProducts = (items) => {
    if (!sortBy) {
      return items;
    }

    return [...items].sort((a, b) => {
      let valueA = a[sortBy];
      let valueB = b[sortBy];

      if (sortBy === "title") {
        valueA = String(valueA || "").toLowerCase();
        valueB = String(valueB || "").toLowerCase();
      }

      if (sortBy === "price" || sortBy === "rating") {
        valueA = Number(valueA) || 0;
        valueB = Number(valueB) || 0;
      }

      if (valueA < valueB) {
        return sortOrder === "asc" ? -1 : 1;
      }

      if (valueA > valueB) {
        return sortOrder === "asc" ? 1 : -1;
      }

      return 0;
    });
  };

  const fetchProducts = async () => {
    const currentRequestId = ++requestIdRef.current;

    try {
      setLoading(true);
      setError("");

      const skip = (page - 1) * pageSize;

      let response;

      if (search.trim()) {
        response = await api.get("/products/search", {
          params: {
            q: search.trim(),
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

      if (currentRequestId !== requestIdRef.current) {
        return;
      }

      const data = response.data;

      const apiTotal = Number(data.total) || API_TOTAL_FALLBACK;

      const editedProducts = getEditedProducts();
      const deletedProducts = getDeletedProducts();

      const localProducts = getLocalProducts();

      const filteredLocalProducts = localProducts.filter(
        (product) => {
          if (
            deletedProducts.includes(String(product.id)) ||
            deletedProducts.includes(`local-${String(product.id)}`)
          ) {
            return false;
          }

          if (
            search.trim() &&
            !String(product.title || "")
              .toLowerCase()
              .includes(search.trim().toLowerCase())
          ) {
            return false;
          }

          if (
            category &&
            String(product.category) !== String(category)
          ) {
            return false;
          }

          return true;
        }
      );

      const apiProducts = (data.products || [])
        .filter(
          (product) =>
            !deletedProducts.includes(String(product.id))
        )
        .map((product) => {
          const editedProduct = editedProducts.find(
            (item) =>
              String(item.id) === String(product.id)
          );

          return {
            ...product,
            ...(editedProduct || {}),
            isLocal: false,
          };
        });

      const combinedTotal =
        apiTotal + filteredLocalProducts.length;

      const totalPages = Math.max(
        1,
        Math.ceil(combinedTotal / pageSize)
      );

      if (page > totalPages) {
        setPage(totalPages);
        return;
      }

      let pageProducts = [];

      if (skip < apiTotal) {
        const apiPart = apiProducts;

        pageProducts = [...apiPart];

        const apiItemsOnThisPage = Math.min(
          apiTotal - skip,
          pageSize
        );

        const localItemsNeeded =
          pageSize - apiItemsOnThisPage;

        if (
          localItemsNeeded > 0 &&
          filteredLocalProducts.length > 0
        ) {
          const localStartIndex = Math.max(
            0,
            skip + apiItemsOnThisPage - apiTotal
          );

          const localPart =
            filteredLocalProducts.slice(
              localStartIndex,
              localStartIndex + localItemsNeeded
            );

          pageProducts = [
            ...pageProducts,
            ...localPart.map((product) => ({
              ...product,
              isLocal: true,
            })),
          ];
        }
      } else {
        const localStartIndex = skip - apiTotal;

        pageProducts = filteredLocalProducts
          .slice(
            localStartIndex,
            localStartIndex + pageSize
          )
          .map((product) => ({
            ...product,
            isLocal: true,
          }));
      }

      if (sortBy) {
        const apiPart = pageProducts.filter(
          (product) => !product.isLocal
        );

        const localPart = pageProducts.filter(
          (product) => product.isLocal
        );

        pageProducts = [
          ...sortProducts(apiPart),
          ...sortProducts(localPart),
        ];
      }

      setProducts(pageProducts);
      setTotal(combinedTotal);
    } catch (error) {
      if (currentRequestId !== requestIdRef.current) {
        return;
      }

      console.error(error);
      setError("Failed to load products");
    } finally {
      if (currentRequestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    if (!authenticated) return;

    fetchProducts();
  }, [
    page,
    pageSize,
    search,
    category,
    sortBy,
    sortOrder,
    authenticated,
  ]);

  useEffect(() => {
    if (!authenticated) return;

    const handleFocus = () => {
      fetchProducts();
    };

    window.addEventListener("focus", handleFocus);

    return () => {
      window.removeEventListener("focus", handleFocus);
    };
  }, [authenticated]);

  const getProductLink = (product) => {
    if (product.isLocal) {
      return `/product/local-${product.id}`;
    }

    return `/product/${product.id}`;
  };

  const totalPages = Math.max(
    1,
    Math.ceil(total / pageSize)
  );

  const startItem =
    total === 0
      ? 0
      : (page - 1) * pageSize + 1;

  const endItem = Math.min(
    page * pageSize,
    total
  );

  if (checkingAuth) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-100">
        <p className="text-base text-gray-500">
          Checking login...
        </p>
      </main>
    );
  }

  if (!authenticated) {
    return null;
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-100">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />

          <p className="text-base text-gray-500">
            Loading products...
          </p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-100 px-4">
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-8 text-center">
          <p className="text-base text-red-500 mb-4">
            {error}
          </p>

          <button
            onClick={fetchProducts}
            className="bg-blue-600 text-white px-5 py-2.5 rounded-lg text-base font-semibold hover:bg-blue-700 transition"
          >
            Retry
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">
                P
              </div>

              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                  Product Admin
                </h1>

                <p className="text-sm text-gray-500">
                  Manage your products
                </p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-red-50 text-red-600 border border-red-200 rounded-lg text-base font-bold hover:bg-red-100 transition"
            >
              <span className="text-lg">↪</span>
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-7">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-7">
          <div>
            <p className="text-sm text-blue-600 font-semibold mb-1">
              DASHBOARD
            </p>

            <h2 className="text-3xl font-bold text-gray-900">
              Products
            </h2>

            <p className="text-base text-gray-500 mt-1">
              View and manage all products.
            </p>
          </div>

          <a
            href="/product/add"
            className="inline-flex items-center justify-center gap-1.5 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition shadow-sm"
          >
            <span className="text-base">+</span>
            Add Product
          </a>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <p className="text-base text-gray-500">
              Total Products
            </p>

            <p className="text-3xl font-bold text-gray-900 mt-2">
              {total}
            </p>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <p className="text-base text-gray-500">
              Categories
            </p>

            <p className="text-3xl font-bold text-gray-900 mt-2">
              {categories.length}
            </p>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <p className="text-base text-gray-500">
              Current Page
            </p>

            <p className="text-3xl font-bold text-gray-900 mt-2">
              {page}
            </p>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5 mb-6">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Search & Filter
            </h3>

            <p className="text-sm text-gray-500 mt-1">
              Find products quickly
            </p>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-center gap-3">
            <input
              type="text"
              value={searchText}
              onChange={(e) =>
                setSearchText(e.target.value)
              }
              placeholder="Search products..."
              className="w-full lg:w-72 h-11 border border-gray-300 rounded-lg px-4 text-base outline-none focus:ring-2 focus:ring-blue-500"
            />

            <select
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                setPage(1);
              }}
              className="w-full lg:w-52 h-11 border border-gray-300 rounded-lg px-3 text-base bg-white outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Categories</option>

              {categories.map((item) => (
                <option
                  key={item.slug}
                  value={item.slug}
                >
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
              className="w-full lg:w-40 h-11 border border-gray-300 rounded-lg px-3 text-base bg-white outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Sort By</option>
              <option value="title">Title</option>
              <option value="price">Price</option>
              <option value="rating">Rating</option>
            </select>

            <select
              value={sortOrder}
              onChange={(e) =>
                setSortOrder(e.target.value)
              }
              className="w-full lg:w-40 h-11 border border-gray-300 rounded-lg px-3 text-base bg-white outline-none focus:ring-2 focus:ring-blue-500"
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
              className="w-full lg:w-40 h-11 border border-gray-300 rounded-lg px-3 text-base bg-white outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={10}>10 per page</option>
              <option value={20}>20 per page</option>
              <option value={50}>50 per page</option>
            </select>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Product List
              </h3>

              <p className="text-sm text-gray-500 mt-1">
                Showing {startItem}–{endItem} of {total}
              </p>
            </div>

            <p className="text-sm font-medium text-gray-500">
              Page {page} of {totalPages}
            </p>
          </div>

          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-5 py-4 text-sm font-semibold text-gray-600">
                    Product
                  </th>

                  <th className="text-left px-5 py-4 text-sm font-semibold text-gray-600">
                    Category
                  </th>

                  <th className="text-left px-5 py-4 text-sm font-semibold text-gray-600">
                    Price
                  </th>

                  <th className="text-left px-5 py-4 text-sm font-semibold text-gray-600">
                    Rating
                  </th>

                  <th className="text-left px-5 py-4 text-sm font-semibold text-gray-600">
                    Stock
                  </th>
                </tr>
              </thead>

              <tbody>
                {products.map((product, index) => (
                  <tr
                    key={`${product.isLocal ? "local" : "api"}-${product.id}-${index}`}
                    className="border-t border-gray-100 hover:bg-blue-50/30 transition"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg bg-gray-50 border border-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                          <img
                            src={
                              product.thumbnail ||
                              product.images?.[0]
                            }
                            alt={product.title}
                            className="w-full h-full object-contain"
                          />
                        </div>

                        <div className="min-w-0">
                          <a
                            href={getProductLink(product)}
                            className="text-base font-semibold text-gray-800 hover:text-blue-600 transition"
                          >
                            {product.title}
                          </a>

                          <p className="text-sm text-gray-400 mt-1">
                            ID #{product.id}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <span className="inline-block px-3 py-1 bg-gray-100 rounded-full text-sm text-gray-600">
                        {product.category}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-base font-semibold text-gray-800">
                      ${product.price}
                    </td>

                    <td className="px-5 py-4 text-base">
                      <span className="text-yellow-500">
                        ★
                      </span>{" "}
                      {product.rating ?? 0}
                    </td>

                    <td className="px-5 py-4 text-base text-gray-700">
                      {product.stock}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="md:hidden p-4 space-y-3">
            {products.map((product, index) => (
              <div
                key={`${product.isLocal ? "local" : "api"}-${product.id}-${index}`}
                className="border border-gray-200 rounded-xl p-4"
              >
                <div className="flex gap-4">
                  <div className="w-20 h-20 bg-gray-50 border border-gray-200 rounded-lg flex-shrink-0 flex items-center justify-center overflow-hidden">
                    <img
                      src={
                        product.thumbnail ||
                        product.images?.[0]
                      }
                      alt={product.title}
                      className="w-full h-full object-contain"
                    />
                  </div>

                  <div className="min-w-0">
                    <a
                      href={getProductLink(product)}
                      className="text-base font-semibold text-gray-800 hover:text-blue-600"
                    >
                      {product.title}
                    </a>

                    <p className="text-sm text-gray-500 mt-1">
                      {product.category}
                    </p>

                    <p className="text-base font-bold mt-2">
                      ${product.price}
                    </p>

                    <p className="text-sm mt-1">
                      <span className="text-yellow-500">
                        ★
                      </span>{" "}
                      {product.rating ?? 0}
                    </p>
                  </div>
                </div>

                <div className="border-t mt-4 pt-3 text-sm text-gray-500">
                  Stock: {product.stock}
                </div>
              </div>
            ))}
          </div>

          {products.length === 0 && (
            <div className="py-14 px-4 text-center">
              <div className="text-4xl mb-3">📦</div>

              <h3 className="text-lg font-semibold text-gray-800">
                No products found
              </h3>

              <p className="text-base text-gray-500 mt-1">
                Try a different search or category.
              </p>
            </div>
          )}

          <div className="border-t border-gray-200 px-5 py-4">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
              <p className="text-sm text-gray-500">
                Showing{" "}
                <span className="font-semibold text-gray-700">
                  {startItem}–{endItem}
                </span>{" "}
                of{" "}
                <span className="font-semibold text-gray-700">
                  {total}
                </span>
              </p>

              <div className="flex items-center gap-2 flex-wrap justify-center">
                <button
                  onClick={() =>
                    setPage((current) => current - 1)
                  }
                  disabled={page === 1}
                  className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-sm font-medium hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  ← Previous
                </button>

                {Array.from(
                  { length: totalPages },
                  (_, index) => index + 1
                ).map((pageNumber) => (
                  <button
                    key={pageNumber}
                    onClick={() => setPage(pageNumber)}
                    className={`min-w-9 px-3 py-2 rounded-lg text-sm font-medium ${
                      page === pageNumber
                        ? "bg-blue-600 text-white"
                        : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
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
                  className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-sm font-medium hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Next →
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function ProductsPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen flex items-center justify-center bg-slate-100">
          <p className="text-base text-gray-500">
            Loading products...
          </p>
        </main>
      }
    >
      <Products />
    </Suspense>
  );
}