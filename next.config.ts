import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  output: 'standalone',
  trailingSlash: true,
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
    ],
  },
  webpack: (config, { isServer }) => {
    // Handle handlebars require.extensions warning
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
      crypto: false,
      stream: false,
      util: false,
      buffer: false,
      process: false,
    };

    // Ignore problematic modules in client-side builds
    if (!isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        '@opentelemetry/exporter-jaeger': false,
        '@genkit-ai/firebase': false,
        '@opentelemetry/sdk-node': false,
        'handlebars': false,
        'genkit': false,
        '@genkit-ai/core': false,
        '@genkit-ai/googleai': false,
      };
    }

    // Handle handlebars require.extensions
    config.module.rules.push({
      test: /node_modules\/handlebars/,
      use: 'null-loader',
    });

    // Ignore OpenTelemetry modules
    config.module.rules.push({
      test: /node_modules\/@opentelemetry/,
      use: 'null-loader',
    });

    // Ignore GenKit modules on client side
    if (!isServer) {
      config.module.rules.push({
        test: /node_modules\/genkit/,
        use: 'null-loader',
      });
      config.module.rules.push({
        test: /node_modules\/@genkit-ai/,
        use: 'null-loader',
      });
    }

    return config;
  },
};

export default nextConfig;
