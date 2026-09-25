"use client";

import { useState } from "react";
import api from "./services/api";

export default function Home() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loggingIn, setLoggingIn] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();

    if (loggingIn) return;

    if (!username.trim() || !password.trim()) {
      alert("Please enter username and password");
      return;
    }

    setLoggingIn(true);

    try {
      const response = await api.post("/auth/login", {
        username: username.trim(),
        password,
      });

      localStorage.setItem("token", response.data.accessToken);

      window.location.href = "/products";
    } catch (error) {
      console.error(error);
      alert("Invalid username or password");
      setLoggingIn(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">

        <h1 className="text-3xl font-bold text-center text-gray-800">
          Product Admin
        </h1>

        <p className="text-center text-gray-500 mt-2 mb-8">
          Login to your admin dashboard
        </p>

        <form onSubmit={handleLogin} className="space-y-5">

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Username
            </label>

            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter username"
              disabled={loggingIn}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 text-base outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>

            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              disabled={loggingIn}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 text-base outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            />
          </div>

          <button
            type="submit"
            disabled={loggingIn}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold text-base hover:bg-blue-700 transition disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loggingIn ? "Logging in..." : "Login"}
          </button>

        </form>

      </div>
    </main>
  );
}