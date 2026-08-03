import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
  base: "/gestor-etiquetas/",

  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        repositorio: resolve(__dirname, "repositorio.html")
      }
    }
  }
});