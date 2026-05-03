<template>
  <div class="container">
    <h1>🚀 Ostad DevOps Assignment 09</h1>

    <div class="card">
      <h2>Backend Health</h2>
      <p>
        Status:
        <span :class="health.status">{{ health.status || "checking..." }}</span>
      </p>
      <pre v-if="health.timestamp">{{ JSON.stringify(health, null, 2) }}</pre>
    </div>

    <div class="card">
      <h2>Deployment Info</h2>
      <pre v-if="deployInfo.commit">{{ JSON.stringify(deployInfo, null, 2) }}</pre>
    </div>

    <div class="card">
      <h2>Users from PostgreSQL</h2>
      <ul v-if="users.length">
        <li v-for="u in users" :key="u.id">{{ u.name }} — {{ u.email }}</li>
      </ul>
      <p v-else>No users loaded.</p>
      <button @click="fetchUsers">Load Users</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import axios from "axios";

// Nginx proxies /api to backend ALB, so we use relative URLs
const API = "/api";
// For testing locally        
// const API = "http://localhost:8080";

const health = ref({});
const deployInfo = ref({});
const users = ref([]);

onMounted(async () => {
  try {
    const h = await axios.get(`${API}/health`);
    health.value = h.data;
  } catch (e) {
    health.value = { status: "unreachable" };
  }

  try {
    const d = await axios.get(`${API}/deployment-info`);
    deployInfo.value = d.data;
  } catch (e) {
    deployInfo.value = { error: "unreachable" };
  }
});

const fetchUsers = async () => {
  try {
    const res = await axios.get(`${API}/users`);
    users.value = res.data;
  } catch (e) {
    alert("Failed to load users: " + e.message);
  }
};
</script>

<style>
body {
  font-family: system-ui, -apple-system, sans-serif;
  background: #0f172a;
  color: #e2e8f0;
  margin: 0;
  padding: 40px;
}
.container {
  max-width: 800px;
  margin: 0 auto;
}
h1 {
  color: #38bdf8;
  border-bottom: 2px solid #38bdf8;
  padding-bottom: 10px;
}
.card {
  background: #1e293b;
  padding: 20px;
  margin: 20px 0;
  border-radius: 8px;
}
.healthy {
  color: #22c55e;
  font-weight: bold;
}
.unhealthy {
  color: #ef4444;
  font-weight: bold;
}
pre {
  background: #0f172a;
  padding: 15px;
  border-radius: 4px;
  overflow-x: auto;
  font-size: 12px;
}
button {
  background: #3b82f6;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}
button:hover {
  background: #2563eb;
}
ul {
  padding-left: 20px;
}
li {
  margin: 6px 0;
}
</style>
