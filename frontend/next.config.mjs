/** @type {import('next').NextConfig} */
const nextConfig = {
    experimental: {
        typedRoutes: true
    },
    webpack: (config) => {
        config.resolve = config.resolve ?? {};
        config.resolve.alias = config.resolve.alias ?? {};
        config.resolve.alias["@react-native-async-storage/async-storage"] = false;
        config.resolve.alias["pino-pretty"] = false;
        return config;
    }
};

export default nextConfig;
