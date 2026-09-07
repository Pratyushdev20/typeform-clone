const API_URL = "http://localhost:8000/api";

export async function fetcher(url: string, options: RequestInit = {}) {
  const res = await fetch(`${API_URL}${url}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.detail || "An error occurred while fetching data");
  }

  return res.json();
}
