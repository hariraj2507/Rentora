const API_BASE = 'http://127.0.0.1:5000/api';

// ─── Token Management ────────────────────────────────────────────────
function getToken(): string | null {
  return localStorage.getItem('rentora_token');
}

function setToken(token: string): void {
  localStorage.setItem('rentora_token', token);
}

function clearToken(): void {
  localStorage.removeItem('rentora_token');
  localStorage.removeItem('rentora_user');
}

function getStoredUser() {
  const raw = localStorage.getItem('rentora_user');
  return raw ? JSON.parse(raw) : null;
}

function setStoredUser(user: any): void {
  localStorage.setItem('rentora_user', JSON.stringify(user));
}

// ─── Base Fetch Helper ───────────────────────────────────────────────
async function apiFetch(path: string, options: RequestInit = {}) {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const res = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers,
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || `Request failed with status ${res.status}`);
    }

    return data;
  } catch (err: any) {
    if (err.name === 'TypeError' && err.message === 'Failed to fetch') {
      throw new Error('Could not connect to the server. Please check if the backend is running at ' + API_BASE);
    }
    throw err;
  }
}

// ─── Auth API ────────────────────────────────────────────────────────
export const authApi = {
  async register(name: string, email: string, password: string, major?: string) {
    const data = await apiFetch('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password, major }),
    });
    setToken(data.token);
    setStoredUser(data.user);
    return data;
  },

  async login(email: string, password: string) {
    const data = await apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    setToken(data.token);
    setStoredUser(data.user);
    return data;
  },

  async getMe() {
    const data = await apiFetch('/auth/me');
    setStoredUser(data);
    return data;
  },

  logout() {
    clearToken();
    window.location.href = '/login';
  },

  isAuthenticated(): boolean {
    return !!getToken();
  },

  getUser() {
    return getStoredUser();
  }
};

// ─── Items API ───────────────────────────────────────────────────────
export const itemsApi = {
  async list(params?: { category?: string; search?: string; sort?: string }) {
    const query = new URLSearchParams();
    if (params?.category && params.category !== 'All') query.set('category', params.category);
    if (params?.search) query.set('search', params.search);
    if (params?.sort) query.set('sort', params.sort);
    const qs = query.toString();
    return apiFetch(`/items${qs ? `?${qs}` : ''}`);
  },

  async getById(id: string) {
    return apiFetch(`/items/${id}`);
  },

  async create(item: {
    title: string;
    description?: string;
    price_per_day: number;
    deposit?: number;
    category?: string;
    condition?: string;
    image_url?: string;
  }) {
    return apiFetch('/items', {
      method: 'POST',
      body: JSON.stringify(item),
    });
  },

  async update(id: string, item: any) {
    return apiFetch(`/items/${id}`, {
      method: 'PUT',
      body: JSON.stringify(item),
    });
  },

  async predictPrice(title: string, category: string) {
    return apiFetch('/items/predict-price', {
      method: 'POST',
      body: JSON.stringify({ title, category }),
    });
  },

  async upload(file: File) {
    const formData = new FormData();
    formData.append('image', file);
    
    const token = localStorage.getItem('rentora_token');
    const res = await fetch('http://localhost:5000/api/upload', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData,
    });
    
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Upload failed');
    return data;
  }
};

// ─── Bookings API ────────────────────────────────────────────────────
export const bookingsApi = {
  async create(booking: { item_id: string; start_date: string; end_date: string; payment_method?: string }) {
    return apiFetch('/bookings', {
      method: 'POST',
      body: JSON.stringify(booking),
    });
  },

  async list() {
    return apiFetch('/bookings');
  },

  async updateStatus(bookingId: string, status: string) {
    return apiFetch(`/bookings/${bookingId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },

  async getItemBookings(itemId: string) {
    return apiFetch(`/bookings/item/${itemId}`);
  },
  
  async updateEscrow(bookingId: string, escrow_status: string) {
    return apiFetch(`/bookings/${bookingId}/escrow`, {
      method: 'PATCH',
      body: JSON.stringify({ escrow_status }),
    });
  }
};

// ─── Rental Requests API ─────────────────────────────────────────────
export const rentalRequestsApi = {
  async create(request: { item_id: string; start_date: string; end_date: string }) {
    return apiFetch('/rental-requests', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  },
  async getOwnerRequests(ownerId: string) {
    return apiFetch(`/rental-requests/owner/${ownerId}`);
  },
  async getRenterRequests(renterId: string) {
    return apiFetch(`/rental-requests/renter/${renterId}`);
  },
  async updateStatus(id: string, status: string) {
    return apiFetch(`/rental-requests/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }
};

// ─── Dashboard API ───────────────────────────────────────────────────
export const dashboardApi = {
  async getStats() {
    return apiFetch('/dashboard');
  }
};

// ─── Messages API ────────────────────────────────────────────────────
export const messagesApi = {
  async send(message: { receiver_id: string; item_id: string; message_text: string }) {
    return apiFetch('/messages', {
      method: 'POST',
      body: JSON.stringify(message),
    });
  },

  async list(itemId: string, user1?: string, user2?: string) {
    const params = new URLSearchParams();
    if (user1) params.append('user1', user1);
    if (user2) params.append('user2', user2);
    // Explicitly using what's available
    const query = params.toString() ? `?${params.toString()}` : '';
    return apiFetch(`/messages/${itemId}${query}`);
  },
  
  async getUserMessages() {
    return apiFetch('/messages/user');
  }
};

// ─── AI Chat API ─────────────────────────────────────────────────────
export const aiChatApi = {
  async sendMessage(message: string) {
    return apiFetch('/ai-chat', {
      method: 'POST',
      body: JSON.stringify({ message }),
    });
  }
};

// ─── Agreements API ──────────────────────────────────────────────────
export const agreementsApi = {
  async create(data: any) {
    return apiFetch('/agreements', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async getPdf(bookingId: string) {
    const token = localStorage.getItem('rentora_token');
    const res = await fetch(`${API_BASE}/agreements/pdf/${bookingId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    if (!res.ok) throw new Error('Failed to download agreement');
    return res.blob();
  }
};
