/**
 * Copy to shopify-config.js and fill in your values.
 *
 * 1. Shopify Admin → Settings → Apps → Develop apps
 * 2. Configure Storefront API scopes: unauthenticated_write_checkouts,
 *    unauthenticated_read_product_listings
 * 3. Install the app and copy the Storefront API access token
 * 4. Add each product's variant GID in js/shop-catalog.js
 */
window.SHOPIFY_STORE = {
  enabled: true,
  storeDomain: 'your-store.myshopify.com',
  storefrontAccessToken: 'your-storefront-access-token',
  apiVersion: '2025-01',
};
