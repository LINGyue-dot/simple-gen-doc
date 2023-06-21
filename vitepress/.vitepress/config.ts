import { defineConfig } from "vitepress";
import { getSidebar } from "vitepress-plugin-auto-sidebar";

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "auto-gen-doc",
  description: "解析文档注释生成文档",
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: "Home", link: "/" },
      { text: "Examples", link: "/markdown-examples" },
    ],

    sidebar: [
      {
        text: "Getting Started",
        items: [
          { text: "Introduction", link: "/api-examples" },
          { text: "Examples", link: "/markdown-examples" },
        ],
      },
      ...getSidebar({
        contentRoot: "/",
        contentDirs: ["doc"],
        collapsible: false,
        collapsed: false,
      }),
    ],
  },
});
