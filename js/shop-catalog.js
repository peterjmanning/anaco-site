/**
 * Shop catalog — edit this file to add, remove, or change products.
 *
 * Fields:
 *   id          — unique slug (used in order form)
 *   name        — display title
 *   kicker      — short label (e.g. "Base unit", "Module")
 *   description — one or two lines on the card
 *   image       — optional path from site root (e.g. ../images/...)
 *   icon        — optional: microreactor | ptv | microgc | flow-cell | system
 *   featured    — optional; highlights the card
 */
window.resolveShopAsset = function (path) {
  if (!path || /^https?:\/\//i.test(path)) return path;
  return path;
};

window.SHOP_CATALOG = {
  products: [
    {
      id: 'Tinylab',
      name: 'Tinylab System',
      kicker: 'Base unit',
      description:
        'Portable analytical lab with integrated control software.',
      image: '../images/Tinylab-device.gif',
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
      icon: 'microreactor',
    },
    {
      id: 'ptv',
      name: 'PTV Module',
      kicker: 'Module',
      description:
        'Programmable Temperature Vaporizer with quick or scheduled ramp modes and split gas control.',
      icon: 'ptv',
    },
    {
      id: 'microgc',
      name: 'MicroGC Module',
      kicker: 'Module',
      description:
        'Four parallel MEMS μGC columns with unique stationary phases and on-chip heating/cooling.',
      icon: 'microgc',
    },
    {
      id: 'flow-cell',
      name: 'Flow Cell Module',
      kicker: 'Module',
      description:
        'Sensing modules with flow-modulated pneumatic resonator and MEMS optical flow cells.',
      icon: 'flow-cell',
    },
  ],
};
