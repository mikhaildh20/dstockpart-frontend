"use client";

import Cookies from "js-cookie";
import { JWT_TOKEN_KEY, USER_DATA_KEY } from "./fetch";

export const getStoredUser = () => {
  const user = Cookies.get(USER_DATA_KEY);

  if (!user) {
    return null;
  }

  try {
    return JSON.parse(user);
  } catch {
    Cookies.remove(USER_DATA_KEY);
    return null;
  }
};

export const isAuthenticated = () => Boolean(Cookies.get(JWT_TOKEN_KEY));

export const saveAuthSession = ({ token, user }) => {
  Cookies.set(JWT_TOKEN_KEY, token, { expires: 1 });
  Cookies.set(USER_DATA_KEY, JSON.stringify(user), { expires: 1 });
};

export const clearAuthSession = () => {
  Cookies.remove(JWT_TOKEN_KEY);
  Cookies.remove(USER_DATA_KEY);
};
