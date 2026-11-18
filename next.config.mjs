// Optional separate output keeps production verification from overwriting a running dev build.
const nextConfig = { distDir: process.env.NEXT_OUTPUT_DIR || ".next" };
export default nextConfig;
