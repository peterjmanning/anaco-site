/**
 * Shop catalog — edit this file to add, remove, or change products.
 * Each product needs a Shopify variant GID (see shopify-config.example.js).
 *
 * Fields:
 *   id          — unique slug (used internally)
 *   name        — display title
 *   kicker      — short label (e.g. "Base unit", "Module")
 *   description — one or two lines on the card
 *   priceLabel  — primary price shown on the card
 *   priceNote   — optional secondary line
 *   variantId   — gid://shopify/ProductVariant/...
 *   image       — optional path from site root (e.g. ../images/...)
 *   icon        — optional: microreactor | ptv | microgc | flow-cell | system
 *   featured    — optional; highlights the card
 */
/** Resolve catalog image paths from store (shop/) or checkout (shop/checkout/). */
window.resolveShopAsset = function (path) {
  if (!path || /^https?:\/\//i.test(path)) return path;
  if (document.body.classList.contains('checkout-page') && path.indexOf('../') === 0) {
    return '../' + path;
  }
  return path;
};

window.SHOP_CATALOG = {
  products: [
    {
      id: 'tinylab',
      name: 'TinyLab System',
      kicker: 'Base unit',
      description:
        'Portable analytical lab with integrated control software. Subscription billing after delivery.',
      priceLabel: '$499 deposit',
      priceNote: '$599 / month',
      variantId: 'gid://shopify/ProductVariant/00000000000001',
      image: '../images/tinylab-device.gif',
      imageWidth: 456,
      imageHeight: 456,
      icon: 'system',
      featured: true,
    },
    {
      id: 'microreactor',
      name: 'Microreactor Module',
      kicker: 'Module',
      description:
        'Headspace pressure, microfluidic mixing, in-situ electrochemistry, and independent temperature zones.',
      priceLabel: 'Contact for pricing',
      variantId: 'gid://shopify/ProductVariant/00000000000002',
      icon: 'microreactor',
    },
    {
      id: 'ptv',
      name: 'PTV Module',
      kicker: 'Module',
      description:
        'Programmable Temperature Vaporizer with quick or scheduled ramp modes and split gas control.',
      priceLabel: 'Contact for pricing',
      variantId: 'gid://shopify/ProductVariant/00000000000003',
      icon: 'ptv',
    },
    {
      id: 'microgc',
      name: 'MicroGC Module',
      kicker: 'Module',
      description:
        'Four parallel MEMS μGC columns with unique stationary phases and on-chip heating/cooling.',
      priceLabel: 'Contact for pricing',
      variantId: 'gid://shopify/ProductVariant/00000000000004',
      icon: 'microgc',
    },
    {
      id: 'flow-cell',
      name: 'Flow Cell Module',
      kicker: 'Module',
      description:
        'Sensing modules with flow-modulated pneumatic resonator and MEMS optical flow cells.',
      priceLabel: 'Contact for pricing',
      variantId: 'gid://shopify/ProductVariant/00000000000005',
      icon: 'flow-cell',
    },
  ],
};
