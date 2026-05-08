import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API_BASE = `${BACKEND_URL}/api`;

const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
});

// Attach token from localStorage as a fallback (cookies are primary).
api.interceptors.request.use((config) => {
  const t = localStorage.getItem("saksham_token");
  if (t) config.headers.Authorization = `Bearer ${t}`;
  return config;
});

export default api;

export const formatErr = (e) => {
  const d = e?.response?.data?.detail;
  if (!d) return e?.message || "Something went wrong";
  if (typeof d === "string") return d;
  if (Array.isArray(d)) return d.map((x) => x.msg || JSON.stringify(x)).join(" ");
  return JSON.stringify(d);
};

export const SUBJECTS = [
  { key: "english", label: "English", color: "#4472C4" },
  { key: "maths", label: "Mathematics", color: "#70AD47" },
  { key: "science", label: "Science", color: "#ED7D31" },
  { key: "sst", label: "SST / EVS", color: "#534AB7" },
];

export const GRADES = ["KG", "1", "2", "3", "4", "5", "6", "7", "8", "9"];

export const LEVELS = [
  { key: "easy", label: "Easy", stars: "★", desc: "Confidence builders" },
  { key: "moderate", label: "Moderate", stars: "★★", desc: "Core practice" },
  { key: "difficult", label: "Difficult", stars: "★★★", desc: "Stretch & challenge" },
];

export const LOGO_URL = "https://customer-assets.emergentagent.com/job_e476bd10-21d2-43ca-bb93-03f5d4e8cf3f/artifacts/027nb2aa_saksham_logo.png";

export const formatINR = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;
