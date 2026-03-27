import axios from "axios";
import Cookies from "js-cookie";

const JWT_TOKEN_KEY = "jwtToken";
const USER_DATA_KEY = "userData";
const UNAUTHORIZED_PAGE = "/pages/auth/unauthorized";
const LOGIN_PAGE = "/pages/auth/login";

const apiClient = axios.create({
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

apiClient.interceptors.request.use(
  (config) => {
    const jwtToken = Cookies.get(JWT_TOKEN_KEY);
    if (jwtToken) {
      config.headers.Authorization = `Bearer ${jwtToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response) {
      const { status } = error.response;

      if (status === 401) {
        Cookies.remove(JWT_TOKEN_KEY);
        Cookies.remove(USER_DATA_KEY);
        
        if (globalThis.window !== undefined) {
          globalThis.location.href = LOGIN_PAGE;
        }
      } else if (status === 403) {
        if (globalThis.window !== undefined) {
          globalThis.location.href = UNAUTHORIZED_PAGE;
        }
      }
    }

    return Promise.reject(error);
  }
);

const fetchData = async (url, param = {}, method = "POST", isFormData = false) => {
  const normalizedMethod = method.toUpperCase();

  try {
    let config = {};

    if (isFormData) {
      config.headers = {
        "Content-Type": "multipart/form-data",
      };
    }

    let response;
    switch (normalizedMethod) {
      case "GET":
        response = await apiClient.get(url, { params: param });
        break;
      case "POST":
        response = await apiClient.post(url, param, config);
        break;
      case "PUT":
        response = await apiClient.put(url, param, config);
        break;
      case "DELETE":
        response = await apiClient.delete(url, { data: param });
        break;
      default:
        throw new Error(`Metode not supported: ${method}`);
    }

    return response.data;
  } catch (err) {
    if (err.response) {
      if (err.response.data) {
        return {
          error: true,
          status: err.response.status,
          ...err.response.data,
        };
      }
      return {
        error: true,
        status: err.response.status,
        message: err.response.statusText || "Server error",
      };
    } else if (err.request) {
      return {
        error: true,
        message: "No response from server. Check your network.",
      };
    } else {
      return { error: true, message: err.message };
    }
  }
};


export default fetchData;
export { JWT_TOKEN_KEY, USER_DATA_KEY };