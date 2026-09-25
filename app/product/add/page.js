"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/app/services/api";

const LOCAL_ID_START = 195;

export default function AddProduct() {
  const router = useRouter();

  const [authenticated, setAuthenticated] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState("");
  const [stock, setStock] = useState("");
  const [rating, setRating] = useState("4");

  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      router.push("/");
      return;
    }

    setAuthenticated(true);
    setCheckingAuth(false);
  }, [router]);

  useEffect(() => {
    if (!authenticated) return;

    const loadCategories = async () => {
      try {
        const response = await api.get("/products/categories");
        setCategories(response.data);
      } catch (error) {
        console.error(error);
        setError("Failed to load categories");
      } finally {
        setLoadingCategories(false);
      }
    };

    loadCategories();
  }, [authenticated]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (loading) return;

    if (
      !title.trim() ||
      !price ||
      !category ||
      !description.trim() ||
      !image.trim() ||
      stock === ""
    ) {
      setError("Please fill all fields");
      return;
    }

    if (Number(price) <= 0) {
      setError("Price must be greater than 0");
      return;
    }

    if (Number(stock) < 0) {
      setError("Stock cannot be negative");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await api.post("/products/add", {
        title: title.trim(),
        price: Number(price),
        category,
        description: description.trim(),
        stock: Number(stock),
      });

      let existingProducts = [];

      try {
        existingProducts = JSON.parse(
          localStorage.getItem("addedProducts") || "[]"
        );

        if (!Array.isArray(existingProducts)) {
          existingProducts = [];
        }
      } catch {
        existingProducts = [];
      }

      const usedIds = new Set();

      existingProducts.forEach((product) => {
        const id = Number(product.id);

        if (
          Number.isInteger(id) &&
          id >= LOCAL_ID_START
        ) {
          usedIds.add(id);
        }
      });

      let nextId = LOCAL_ID_START;

      const fixedProducts = existingProducts.map((product) => {
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

      while (usedIds.has(nextId)) {
        nextId++;
      }

      const newProduct = {
        ...response.data,
        id: nextId,
        title: title.trim(),
        price: Number(price),
        category,
        description: description.trim(),
        thumbnail: image.trim(),
        images: [image.trim()],
        rating: Number(rating),
        stock: Number(stock),
        reviews: [],
        isLocal: true,
      };

      localStorage.setItem(
        "addedProducts",
        JSON.stringify([
          ...fixedProducts,
          newProduct,
        ])
      );

      alert("Product added successfully");

      router.push("/products");
    } catch (error) {
      console.error(error);
      setError("Failed to add product");
    } finally {
      setLoading(false);
    }
  };

  if (checkingAuth) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p>Checking login...</p>
      </main>
    );
  }

  if (!authenticated) {
    return null;
  }

  return (
    <main className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-xl mx-auto bg-white rounded-xl shadow p-6">
        <h1 className="text-3xl font-bold mb-6">
          Add Product
        </h1>

        {error && (
          <p className="text-red-600 mb-4">
            {error}
          </p>
        )}

        <form
          onSubmit={handleSubmit}
          className="space-y-4"
        >
          <input
            type="text"
            placeholder="Product title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={loading}
            className="w-full border rounded-lg px-4 py-2 disabled:bg-gray-100"
          />

          <input
            type="number"
            min="0.01"
            step="0.01"
            placeholder="Price"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            disabled={loading}
            className="w-full border rounded-lg px-4 py-2 disabled:bg-gray-100"
          />

          <select
            value={rating}
            onChange={(e) => setRating(e.target.value)}
            disabled={loading}
            className="w-full border rounded-lg px-4 py-2 bg-white disabled:bg-gray-100"
          >
            <option value="1">1 ★</option>
            <option value="2">2 ★★</option>
            <option value="3">3 ★★★</option>
            <option value="4">4 ★★★★</option>
            <option value="5">5 ★★★★★</option>
          </select>

          <input
            type="number"
            min="0"
            step="1"
            placeholder="Stock"
            value={stock}
            onChange={(e) => setStock(e.target.value)}
            disabled={loading}
            className="w-full border rounded-lg px-4 py-2 disabled:bg-gray-100"
          />

          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            disabled={
              loading || loadingCategories
            }
            className="w-full border rounded-lg px-4 py-2 bg-white disabled:bg-gray-100"
          >
            <option value="">
              {loadingCategories
                ? "Loading categories..."
                : "Select category"}
            </option>

            {categories.map((item) => {
              const value =
                typeof item === "string"
                  ? item
                  : item.slug;

              const label =
                typeof item === "string"
                  ? item
                  : item.name;

              return (
                <option
                  key={value}
                  value={value}
                >
                  {label}
                </option>
              );
            })}
          </select>

          <textarea
            placeholder="Product description"
            value={description}
            onChange={(e) =>
              setDescription(e.target.value)
            }
            disabled={loading}
            className="w-full border rounded-lg px-4 py-2 disabled:bg-gray-100"
            rows="4"
          />

          <input
            type="url"
            placeholder="Product image URL"
            value={image}
            onChange={(e) =>
              setImage(e.target.value)
            }
            disabled={loading}
            className="w-full border rounded-lg px-4 py-2 disabled:bg-gray-100"
          />

          <button
            type="submit"
            disabled={
              loading || loadingCategories
            }
            className="w-full bg-blue-600 text-white py-2 rounded-lg disabled:opacity-50"
          >
            {loading
              ? "Saving..."
              : "Add Product"}
          </button>
        </form>
      </div>
    </main>
  );
}