"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "../../services/api";

export default function ProductDetailsPage() {
  const { id } = useParams();
  const router = useRouter();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchProduct = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get(`/products/${id}`);
      setProduct(response.data);
    } catch (err) {
      if (err.response?.status === 404) {
        setProduct(null);
        setError("NOT_FOUND");
      } else {
        setError("Something went wrong while loading the product.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchProduct();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="p-6 text-center">
        <p>Loading product...</p>
      </div>
    );
  }

  if (error === "NOT_FOUND") {
    return (
      <div className="p-6 text-center">
        <h1 className="text-2xl font-bold">Product Not Found</h1>

        <p className="mt-2 text-gray-500">
          The product you are looking for does not exist.
        </p>

        <button
          onClick={() => router.back()}
          className="mt-4 rounded bg-black px-4 py-2 text-white"
        >
          Go Back
        </button>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center">
        <p className="mb-4 text-red-500">{error}</p>

        <button
          onClick={fetchProduct}
          className="rounded bg-black px-4 py-2 text-white"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl p-6">
      <button
        onClick={() => router.back()}
        className="mb-6 rounded border px-4 py-2"
      >
        ← Back
      </button>

      <div className="grid gap-8 md:grid-cols-2">
        {/* Product Images */}
        <div>
          <img
            src={product.images?.[0]}
            alt={product.title}
            className="h-80 w-full rounded-lg border object-contain"
          />

          {product.images?.length > 1 && (
            <div className="mt-4 flex gap-3 overflow-x-auto">
              {product.images.map((image, index) => (
                <img
                  key={index}
                  src={image}
                  alt={`${product.title} ${index + 1}`}
                  className="h-20 w-20 rounded border object-cover"
                />
              ))}
            </div>
          )}
        </div>

        {/* Product Information */}
        <div>
          <h1 className="text-3xl font-bold">{product.title}</h1>

          <p className="mt-2 text-gray-500">
            Category: {product.category}
          </p>

          <p className="mt-4 text-gray-700">
            {product.description}
          </p>

          <div className="mt-6 space-y-3">
            <p>
              <strong>Price:</strong> ${product.price}
            </p>

            <p>
              <strong>Rating:</strong> ⭐ {product.rating}
            </p>

            <p>
              <strong>Stock:</strong> {product.stock}
            </p>
          </div>
        </div>
      </div>

      {/* Reviews */}
      <div className="mt-10">
        <h2 className="mb-4 text-2xl font-bold">Reviews</h2>

        {product.reviews?.length > 0 ? (
          <div className="space-y-4">
            {product.reviews.map((review, index) => (
              <div
                key={index}
                className="rounded-lg border p-4"
              >
                <div className="flex justify-between">
                  <strong>{review.reviewerName}</strong>

                  <span>⭐ {review.rating}</span>
                </div>

                <p className="mt-2 text-gray-600">
                  {review.comment}
                </p>

                <p className="mt-1 text-sm text-gray-400">
                  {review.date}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">
            No reviews found.
          </p>
        )}
      </div>
    </div>
  );
}