const API_URL = process.env.NEXT_PUBLIC_API_URL;

class ApiClient {
  constructor() {
    this.baseURL = API_URL;
    this.token = null;
  }

  setToken(token) {
    this.token = token;
    if (typeof window !== "undefined") {
      if (token) {
        localStorage.setItem("auth_token", token);
      } else {
        localStorage.removeItem("auth_token");
      }
    }
  }

  getToken() {
    if (this.token) return this.token;
    if (typeof window !== "undefined") {
      this.token = localStorage.getItem("auth_token");
    }
    return this.token;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    };

    // Don't add token to signup endpoint
    const token = this.getToken();
    if (token && !endpoint.includes("/auth/signup")) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Something went wrong");
      }

      return data;
    } catch (error) {
      console.error("API Error:", error);
      throw error;
    }
  }

  // Auth endpoints
  async signup(email, password, fullName) {
    return this.request("/auth/signup", {
      method: "POST",
      body: JSON.stringify({ email, password, fullName }),
    });
  }

  async signin(email, password) {
    const response = await this.request("/auth/signin", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });

    if (response.session?.access_token) {
      this.setToken(response.session.access_token);
    }

    return response;
  }

  async signout() {
    this.setToken(null);
    return { success: true };
  }

  async getMe() {
    return this.request("/auth/me");
  }

  // Organization endpoints
  async createOrganization(name) {
    return this.request("/organizations", {
      method: "POST",
      body: JSON.stringify({ name }),
    });
  }

  async getMyOrganizations() {
    return this.request("/organizations/my-organizations");
  }

  async getOrganizationBySlug(slug) {
    return this.request(`/organizations/slug/${slug}`);
  }

  // Service endpoints
  async getServices(organizationId) {
    return this.request(`/services/organization/${organizationId}`);
  }

  async createService(organizationId, data) {
    return this.request(`/services/${organizationId}`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateServiceStatus(serviceId, status) {
    return this.request(`/services/${serviceId}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
  }

  async deleteService(serviceId) {
    return this.request(`/services/${serviceId}`, {
      method: "DELETE",
    });
  }

  // Incident endpoints
  async getIncidents(organizationId) {
    return this.request(`/incidents/organization/${organizationId}`);
  }

  async createIncident(organizationId, data) {
    return this.request(`/incidents/${organizationId}`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async addIncidentUpdate(organizationId, incidentId, data) {
    return this.request(`/incidents/${organizationId}/${incidentId}/updates`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }
}

export default new ApiClient();
