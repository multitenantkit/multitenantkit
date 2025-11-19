/// <reference path="./.sst/platform/config.d.ts" />

/**
 * SST Configuration for MultiTenantKit Website
 *
 * This configuration deploys the static website to AWS using:
 * - S3 for static file storage
 * - CloudFront for CDN distribution
 * - Cloudflare for DNS management
 *
 * Prerequisites:
 * 1. AWS credentials configured (via AWS CLI or environment variables)
 * 2. Cloudflare API token with DNS edit permissions
 *    - Set CLOUDFLARE_API_TOKEN environment variable
 *    - Get token from: https://dash.cloudflare.com/profile/api-tokens
 *
 * Usage:
 * - Deploy: npm run deploy
 * - Remove: npm run remove
 */

export default $config({
    app(input) {
        return {
            name: 'multitenantkit',
            removal: input?.stage === 'production' ? 'retain' : 'remove',
            home: 'aws',
            providers: {
                cloudflare: '6.11.0'
            }
        };
    },
    async run() {
        // Deploy the static website with Cloudflare DNS
        const site = new sst.aws.StaticSite('MultiTenantKitWebsite', {
            path: '.',
            build: {
                command: 'npm run build',
                output: 'dist'
            },
            domain: {
                name: 'multitenantkit.dev',
                dns: sst.cloudflare.dns()
            },
            // Enable React Router support (SPA mode)
            errorPage: 'index.html'
        });

        // Output the website URL
        return {
            url: site.url
        };
    }
});
