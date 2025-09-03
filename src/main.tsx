import React from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { App } from "./ui/App";
import "./index.css";

const container = document.getElementById("root");
if (!container) throw new Error("#root not found");
const root = createRoot(container);
const queryClient = new QueryClient();
root.render(
  <QueryClientProvider client={queryClient}>
    <App />
  </QueryClientProvider>
);
