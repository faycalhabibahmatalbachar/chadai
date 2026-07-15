import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Export statique — hébergé sur GitHub Pages (pas de serveur Node).
  output: "export",
  images: { unoptimized: true },
  trailingSlash: true,
  // Évite la détection erronée d'un autre lockfile présent dans un dossier parent.
  // + charge les .svg comme composants React (svgr) pour les icônes de la
  //   console admin (TailAdmin). Le site public n'importe aucun .svg en module,
  //   donc cette règle n'a aucun effet de bord sur lui.
  turbopack: {
    root: __dirname,
    rules: {
      "*.svg": {
        loaders: ["@svgr/webpack"],
        as: "*.js",
      },
    },
  },
  webpack(config) {
    config.module.rules.push({
      test: /\.svg$/,
      use: ["@svgr/webpack"],
    });
    return config;
  },
};

export default nextConfig;
