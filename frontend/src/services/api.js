
const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8080";

// Common API request function
export async function apiRequest(endpoint, options = {}) {
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  const text = await response.text();

  let data;

  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(
      `Backend returned invalid JSON (HTTP ${response.status}). ` +
      `Response: ${text.slice(0, 200)}`
    );
  }

  if (!response.ok) {
    throw new Error(
      data.error || `HTTP error ${response.status}`
    );
  }

  return data;
}

// Signup
export function signupUser(user) {
  return apiRequest("/api/auth/signup", {
    method: "POST",
    body: JSON.stringify(user),
  });
}

// Login
export function loginUser(credentials) {
  return apiRequest("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(credentials),
  });
}

// Create poll (authentication required)
export function createPoll(pollData) {
  const token = sessionStorage.getItem("token");

  return apiRequest("/api/polls", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(pollData),
  });
}

// Get polls created by logged-in user
export function getMyPolls() {
  const token = sessionStorage.getItem("token");

  return apiRequest("/api/my-polls", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

// Public poll viewing
export function getPublicPoll(id) {
  return apiRequest(
    `/api/polls/${encodeURIComponent(id)}`
  );
}

// Anonymous voting
export function submitVote(pollId, optionIds, voterId) {
  return apiRequest(
    `/api/polls/${encodeURIComponent(pollId)}/vote`,
    {
      method: "POST",
      body: JSON.stringify({
        optionIds,
        voterId,
      }),
    }
  );
}

// Public poll results
export function getPollResults(pollId) {
  return apiRequest(
    `/api/polls/${encodeURIComponent(pollId)}/results`
  );
}

// Close or reopen poll (authentication required)
export function updatePollStatus(pollId, status) {
  const token = sessionStorage.getItem("token");

  if (!token) {
    throw new Error(
      "Please log in again to manage your polls."
    );
  }

  return apiRequest(
    `/api/polls/${encodeURIComponent(pollId)}/status`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status }),
    }
  );
}
export function getOwnerPollResults(pollId) {
  const token = sessionStorage.getItem("token");

  if (!token) {
    throw new Error("Please log in to view your poll results.");
  }

  return apiRequest(
    `/api/my-polls/${encodeURIComponent(pollId)}/results`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
}