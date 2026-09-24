"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/app/services/api";

export default function AddProduct() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (loading) return;

    if (!title || !price || !category || !description || !image) {
      setError("Please fill all fields");
      return;
    }

    if (Number(price) <= 0) {
      setError("Price must be greater than 0");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await api.post("/products/add", {
        title,
        price: Number(price),
        category,
        description,
      });

      const newProduct = {
        ...response.data,

        // Give locally added products their own unique ID.
        id: `local-${Date.now()}-${Math.random()
          .toString(36)
          .substring(2, 8)}`,

        thumbnail: image,
        rating: 0,
        stock: 0,
        reviews: [],
      };

      const existingProducts = JSON.parse(
        localStorage.getItem("addedProducts") || "[]"
      );

      localStorage.setItem(
        "addedProducts",
        JSON.stringify([
          ...existingProducts,
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
            className="w-full border rounded-lg px-4 py-2"
          />

          <input
            type="number"
            placeholder="Price"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="w-full border rounded-lg px-4 py-2"
          />

          <input
            type="text"
            placeholder="Category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full border rounded-lg px-4 py-2"
          />

          <textarea
            placeholder="Product description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full border rounded-lg px-4 py-2"
            rows="4"
          />

          <input
            type="url"
            placeholder="Product image URL"
            value={image}
            onChange={(e) => setImage(e.target.value)}
            className="w-full border rounded-lg px-4 py-2"
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded-lg disabled:opacity-50"
          >
            {loading ? "Saving..." : "Add Product"}
          </button>

        </form>
      </div>
    </main>
  );
}