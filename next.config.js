const path = require("path");

/** @type {import('next').NextConfig} */
const nextConfig = {
  // This folder sits next to another Next.js app, so pin Turbopack to this project.
  turbopack: {
    root: path.join(__dirname),
  },
};

module.exports = nextConfig;
