
import { QueryClient } from "@tanstack/react-query";

export const apiRequest = async (
  endpoint: string,
  { body, ...customConfig }: RequestInit = {}
) => {
  const headers = { "Content-Type": "application/json" };
  const config: RequestInit = {
    method: body ? "POST" : "GET",
    ...customConfig,
    headers: {
      ...headers,
      ...customConfig.headers,
    },
  };
  if (body) {
    config.body = JSON.stringify(body);
  }
  const response = await fetch(`/api${endpoint}`, config);
  if (!response.ok) {
    throw await response.json();
  }
  return response.json();
};

const getQueryFn = (options: { on401: "throw" | "redirect" }) => {
  return async ({ queryKey: [endpoint] }: { queryKey: string[] }) => {
    try {
      return await apiRequest(endpoint as string);
    } catch (error: any) {
      if (error.status === 401) {
        if (options.on401 === "redirect") {
          window.location.href = "/auth";
          return null;
        }
        throw error;
      }
      throw error;
    }
  };
};

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: true,
      staleTime: 0,
      retry: false,
    },
    mutations: {
      onError: (error: any) => {
        if (error.status === 401) {
          window.location.href = "/auth";
        }
      },
    },
  },
});
