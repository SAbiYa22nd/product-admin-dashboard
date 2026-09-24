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
  const [error, setError] = useState("");

  const isLocalProduct = String(id).startsWith("local-");

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        setError("");

        if (isLocalProduct) {
          const localProducts = JSON.parse(
            localStorage.getItem("addedProducts") || "[]"
          );

          const product = localProducts.find(
            (item) => String(item.id) === String(id)
          );

          if (!product) {
            setError("Product not found");
            return;
          }

          setTitle(product.title || "");
          setPrice(product.price || "");
          setCategory(product.category || "");
          setDescription(product.description || "");

          return;
        }

        const response = await api.get(`/products/${id}`);

        const editedProducts = JSON.parse(
          localStorage.getItem("editedProducts") || "[]"
        );

        const editedProduct = editedProducts.find(
          (item) => String(item.id) === String(id)
        );

        const product = editedProduct
          ? { ...response.data, ...editedProduct }
          : response.data;

        setTitle(product.title || "");
        setPrice(product.price || "");
        setCategory(product.category || "");
        setDescription(product.description || "");
      } catch (error) {
        console.error(error);
        setError("Product not found");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchProduct();
    }
  }, [id, isLocalProduct]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (saving) return;

    if (!title || !price || !category || !description) {
      setError("Please fill all fields");
      return;
    }

    if (Number(price) <= 0) {
      setError("Price must be greater than 0");
      return;
    }

    try {
      setSaving(true);
      setError("");

      if (isLocalProduct) {
        const localProducts = JSON.parse(
          localStorage.getItem("addedProducts") || "[]"
        );

        const updatedProducts = localProducts.map((product) => {
          if (String(product.id) === String(id)) {
            return {
              ...product,
              title,
              price: Number(price),
              category,
              description,
            };
          }

          return product;
        });

        localStorage.setItem(
          "addedProducts",
          JSON.stringify(updatedProducts)
        );
      } else {
        await api.put(`/products/${id}`, {
          title,
          price: Number(price),
          category,
          description,
        });

        const editedProducts = JSON.parse(
          localStorage.getItem("editedProducts") || "[]"
        );

        const updatedProduct = {
          id: String(id),
          title,
          price: Number(price),
          category,
          description,
        };

        const existingIndex = editedProducts.findIndex(
          (item) => String(item.id) === String(id)
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
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p>Loading product...</p>
      </main>
    );
  }

  if (error && !title) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-red-600">{error}</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-xl mx-auto bg-white rounded-xl shadow p-6">

        <h1 className="text-3xl font-bold mb-6">
          Edit Product
        </h1>

        {error && (
          <p className="text-red-600 mb-4">
            {error}
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">

          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Product title"
            className="w-full border rounded-lg px-4 py-2"
          />

          <input
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="Price"
            className="w-full border rounded-lg px-4 py-2"
          />

          <input
            type="text"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="Product category"
            className="w-full border rounded-lg px-4 py-2"
          />

          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description"
            rows="4"
            className="w-full border rounded-lg px-4 py-2"
          />

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-blue-600 text-white py-2 rounded-lg disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>

        </form>
      </div>
    </main>
  );
}