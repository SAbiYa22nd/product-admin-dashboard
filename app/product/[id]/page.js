"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/app/services/api";

export default function ProductDetails() {
  const { id } = useParams();
  const router = useRouter();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
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

          const localProduct = localProducts.find(
            (item) => String(item.id) === String(id)
          );

          if (!localProduct) {
            setError("Product not found");
            return;
          }

          setProduct(localProduct);
          return;
        }

        const response = await api.get(`/products/${id}`);

        const editedProducts = JSON.parse(
          localStorage.getItem("editedProducts") || "[]"
        );

        const editedProduct = editedProducts.find(
          (item) => String(item.id) === String(id)
        );

        setProduct(
          editedProduct
            ? { ...response.data, ...editedProduct }
            : response.data
        );
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

  const handleDelete = async () => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this product?"
    );

    if (!confirmed) return;

    try {
      if (isLocalProduct) {
        const localProducts = JSON.parse(
          localStorage.getItem("addedProducts") || "[]"
        );

        const updatedProducts = localProducts.filter(
          (item) => String(item.id) !== String(id)
        );

        localStorage.setItem(
          "addedProducts",
          JSON.stringify(updatedProducts)
        );

        alert("Product deleted successfully");
        router.push("/products");
        return;
      }

      await api.delete(`/products/${id}`);

      const editedProducts = JSON.parse(
        localStorage.getItem("editedProducts") || "[]"
      );

      const updatedEditedProducts = editedProducts.filter(
        (item) => String(item.id) !== String(id)
      );

      localStorage.setItem(
        "editedProducts",
        JSON.stringify(updatedEditedProducts)
      );

      alert("Product deleted successfully");
      router.push("/products");
    } catch (error) {
      console.error(error);
      alert("Failed to delete product");
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p>Loading product...</p>
      </main>
    );
  }

  if (error || !product) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-red-600 text-xl">
          {error || "Product not found"}
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-100 p-6">

      <div className="max-w-5xl mx-auto bg-white rounded-xl shadow p-6">

        <button
          onClick={() => router.back()}
          className="mb-6 px-4 py-2 bg-gray-200 rounded-lg"
        >
          ← Back
        </button>

        <div className="grid md:grid-cols-2 gap-8">

          <div>
            <img
              src={product.thumbnail}
              alt={product.title}
              className="w-full h-80 object-contain"
            />
          </div>

          <div>

            <h1 className="text-3xl font-bold mb-4">
              {product.title}
            </h1>

            <p className="text-gray-600 mb-4">
              {product.description}
            </p>

            <p className="text-2xl font-bold mb-3">
              ${product.price}
            </p>

            <p className="mb-2">
              <strong>Category:</strong> {product.category}
            </p>

            <p className="mb-2">
              <strong>Rating:</strong> ⭐ {product.rating}
            </p>

            <p className="mb-2">
              <strong>Stock:</strong> {product.stock}
            </p>

            <div className="flex gap-4 mt-6">

              <button
                onClick={() =>
                  router.push(`/product/${id}/edit`)
                }
                className="px-6 py-2 bg-blue-600 text-white rounded-lg"
              >
                Edit
              </button>

              <button
                onClick={handleDelete}
                className="px-6 py-2 bg-red-600 text-white rounded-lg"
              >
                Delete
              </button>

            </div>
          </div>

        </div>

        <div className="mt-8">

          <h2 className="text-2xl font-bold mb-4">
            Reviews
          </h2>

          {product.reviews?.length > 0 ? (
            <div className="space-y-4">

              {product.reviews.map((review, index) => (
                <div
                  key={index}
                  className="border rounded-lg p-4"
                >
                  <p className="font-semibold">
                    {review.reviewerName}
                  </p>

                  <p>
                    ⭐ {review.rating}
                  </p>

                  <p className="text-gray-600">
                    {review.comment}
                  </p>
                </div>
              ))}

            </div>
          ) : (
            <p className="text-gray-500">
              No reviews available.
            </p>
          )}

        </div>

      </div>
    </main>
  );
}