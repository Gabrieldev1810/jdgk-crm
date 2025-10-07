import { ConfigService } from '@nestjs/config';

export interface SecurityConfig {
  helmet: any;
  cors: any;
}

export const getSecurityConfig = (configService: ConfigService): SecurityConfig => {
  const isDevelopment = configService.get('NODE_ENV') === 'development';
  const isProduction = configService.get('NODE_ENV') === 'production';

  return {
    helmet: {
      // Content Security Policy
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: [
            "'self'",
            ...(isDevelopment ? ["'unsafe-inline'", "'unsafe-eval'"] : []),
            "https://cdn.jsdelivr.net",
            "https://unpkg.com", // For potential CDN resources
          ],
          styleSrc: [
            "'self'",
            "'unsafe-inline'", // Required for many UI frameworks
            "https://fonts.googleapis.com",
            "https://cdn.jsdelivr.net",
            "https://unpkg.com",
          ],
          fontSrc: [
            "'self'",
            "https://fonts.gstatic.com",
            "https://fonts.googleapis.com",
            "data:",
          ],
          imgSrc: [
            "'self'",
            "data:",
            "https:",
            "blob:",
            "*.digiedgesolutions.cloud", // Your domain
          ],
          connectSrc: [
            "'self'",
            "https://staging.digiedgesolutions.cloud",
            "https://digiedgesolutions.cloud",
            "https://*.digiedgesolutions.cloud",
            ...(isDevelopment ? [
              "http://localhost:*",
              "ws://localhost:*",
              "wss://localhost:*",
            ] : []),
            "wss:",
            "ws:",
          ],
          frameSrc: ["'none'"],
          objectSrc: ["'none'"],
          baseUri: ["'self'"],
          formAction: ["'self'"],
          ...(isProduction && { upgradeInsecureRequests: [] }),
        },
      },

      // Cross-Origin policies
      crossOriginEmbedderPolicy: false,
      crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" },
      crossOriginResourcePolicy: { policy: "cross-origin" },

      // DNS Prefetch Control
      dnsPrefetchControl: { allow: false },

      // Frame Options (prevent clickjacking)
      frameguard: { action: 'deny' },

      // Hide Powered-By header
      hidePoweredBy: true,

      // HTTP Strict Transport Security (HSTS)
      hsts: isProduction ? {
        maxAge: 31536000, // 1 year
        includeSubDomains: true,
        preload: true,
      } : false,

      // IE No Open
      ieNoOpen: true,

      // No Sniff
      noSniff: true,

      // Origin Agent Cluster
      originAgentCluster: true,

      // Permitted Cross Domain Policies
      permittedCrossDomainPolicies: false,

      // Referrer Policy
      referrerPolicy: { policy: "no-referrer" },

      // X-XSS-Protection
      xssFilter: true,
    },

    cors: {
      origin: [
        configService.get('FRONTEND_URL') || 'http://localhost:8080',
        'https://staging.digiedgesolutions.cloud',
        'http://staging.digiedgesolutions.cloud',
        'https://digiedgesolutions.cloud',
        'http://digiedgesolutions.cloud',
        'https://*.digiedgesolutions.cloud',
        ...(isDevelopment ? [
          'http://localhost:5173', // Vite
          'http://localhost:3000', // React
          'http://localhost:3001',
          'http://localhost:8080',
          'http://localhost:8081',
          'http://localhost:8082',
          'http://localhost:8083',
        ] : []),
      ],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'],
      allowedHeaders: [
        'Content-Type',
        'Authorization',
        'X-Requested-With',
        'Accept',
        'Origin',
        'Cache-Control',
        'X-File-Name',
      ],
      exposedHeaders: [
        'X-Total-Count',
        'X-Page-Count',
        'X-Current-Page',
        'X-Per-Page',
      ],
      maxAge: 86400, // 24 hours for preflight cache
    },
  };
};

export const SECURITY_HEADERS = {
  // Custom security headers that can be added manually
  'X-API-Version': '1.0.0',
  'X-Security-Policy': 'strict',
  'X-Rate-Limit-Policy': 'standard',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'no-referrer',
  'X-Permitted-Cross-Domain-Policies': 'none',
  'X-DNS-Prefetch-Control': 'off',
} as const;

export const CSP_REPORT_ONLY = false; // Set to true to enable CSP reporting mode

// Security middleware validation function
export const validateSecurityHeaders = (headers: Record<string, any>) => {
  const requiredHeaders = [
    'x-frame-options',
    'x-content-type-options',
    'referrer-policy',
    'x-xss-protection',
  ];

  const missing = requiredHeaders.filter(header => !headers[header]);
  
  if (missing.length > 0) {
    console.warn(`⚠️  Missing security headers: ${missing.join(', ')}`);
  }

  return missing.length === 0;
};