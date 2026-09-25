"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/app/services/api";

export default function EditProduct() {
  const { id } = useParams();
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [error, setError] = useState("");

  const isLocalProduct = String(id).startsWith("local-");
  const productId = isLocalProduct
    ? String(id).replace("local-", "")
    : String(id);

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      window.location.href = "/";
      return;
    }

    setAuthenticated(true);
    setCheckingAuth(false);
  }, []);

  useEffect(() => {
    if (!authenticated || !id) return;

    const fetchProduct = async () => {
      try {
        setLoading(true);
        setError("");

        if (isLocalProduct) {
          const localProducts = JSON.parse(
            localStorage.getItem("addedProducts") || "[]"
          );

          const product = localProducts.find(
            (item) =>
              String(item.id) === String(productId) ||
              String(item.id) === String(id)
          );

          if (!product) {
            setError("Product not found");
            return;
          }

          setTitle(product.title || "");
          setPrice(product.price ?? "");
          setCategory(product.category || "");
          setDescription(product.description || "");

          return;
        }

        const response = await api.get(`/products/${productId}`);

        const editedProducts = JSON.parse(
          localStorage.getItem("editedProducts") || "[]"
        );

        const editedProduct = editedProducts.find(
          (item) => String(item.id) === String(productId)
        );

        const product = editedProduct
          ? { ...response.data, ...editedProduct }
          : response.data;

        setTitle(product.title || "");
        setPrice(product.price ?? "");
        setCategory(product.category || "");
        setDescription(product.description || "");
      } catch (error) {
        console.error(error);
        setError("Product not found");
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [authenticated, id, isLocalProduct, productId]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (saving) return;

    setError("");

    if (
      !title.trim() ||
      !String(price).trim() ||
      !category.trim() ||
      !description.trim()
    ) {
      setError("Please fill all fields");
      return;
    }

    if (Number(price) <= 0) {
      setError("Price must be greater than 0");
      return;
    }

    try {
      setSaving(true);

      if (isLocalProduct) {
        const localProducts = JSON.parse(
          localStorage.getItem("addedProducts") || "[]"
        );

        const updatedProducts = localProducts.map((product) => {
          if (
            String(product.id) === String(productId) ||
            String(product.id) === String(id)
          ) {
            return {
              ...product,
              title: title.trim(),
              price: Number(price),
              category: category.trim(),
              description: description.trim(),
            };
          }

          return product;
        });

        localStorage.setItem(
          "addedProducts",
          JSON.stringify(updatedProducts)
        );
      } else {
        await api.put(`/products/${productId}`, {
          title: title.trim(),
          price: Number(price),
          category: category.trim(),
          description: description.trim(),
        });

        const editedProducts = JSON.parse(
          localStorage.getItem("editedProducts") || "[]"
        );

        const updatedProduct = {
          id: String(productId),
          title: title.trim(),
          price: Number(price),
          category: category.trim(),
          description: description.trim(),
        };

        const existingIndex = editedProducts.findIndex(
          (item) => String(item.id) === String(productId)
        );

        if (existingIndex >= 0) {
          editedProducts[existingIndex] = updatedProduct;
        } else {
          editedProducts.push(updatedProduct);
        }

        localStorage.setItem(
          "editedProducts",
          JSON.stringify(editedProducts)
        );
      }

      alert("Product updated successfully");
      router.push("/products");
    } catch (error) {
      console.error(error);
      setError("Failed to update product");
      setSaving(false);
    }
  };

  if (checkingAuth) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-100">
        <p className="text-base text-gray-500">Checking login...</p>
      </main>
    );
  }

  if (!authenticated) {
    return null;
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="w-9 h-9 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-base text-gray-500">
            Loading product...
          </p>
        </div>
      </main>
    );
  }

  if (error && !title) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-8 text-center">
          <h1 className="text-xl font-semibold text-gray-800 mb-2">
            Product not found
          </h1>

          <p className="text-base text-gray-500 mb-5">
            The product you are trying to edit does not exist.
          </p>

          <button
            onClick={() => router.push("/products")}
            className="bg-blue-600 text-white px-5 py-2.5 rounded-lg text-base font-semibold hover:bg-blue-700 transition"
          >
            Back to Products
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-100 px-4 py-8">
      <div className="max-w-xl mx-auto">
        <div className="mb-5">
          <button
            onClick={() => router.push("/products")}
            className="text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            ← Back to Products
          </button>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 sm:p-7">
          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Edit Product
            </h1>

            <p className="text-base text-gray-500 mt-1">
              Update the product information below.
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 rounded-lg px-4 py-3 mb-5 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Product Title
              </label>

              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter product title"
                disabled={saving}
                className="w-full h-11 border border-gray-300 rounded-lg px-4 text-base outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Price
              </label>

              <input
                type="number"
                min="0"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="Enter price"
                disabled={saving}
                className="w-full h-11 border border-gray-300 rounded-lg px-4 text-base outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Category
              </label>

              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Enter product category"
                disabled={saving}
                className="w-full h-11 border border-gray-300 rounded-lg px-4 text-base outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Description
              </label>

              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter product description"
                rows={5}
                disabled={saving}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-base outline-none resize-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full h-11 bg-blue-600 text-white rounded-lg text-base font-semibold hover:bg-blue-700 transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}