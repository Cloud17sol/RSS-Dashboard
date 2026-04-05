/**
 * Approximate coordinates (capital / centroid) for map markers — [latitude, longitude], WGS84.
 */
export const stateMapLatLng: Record<string, [number, number]> = {
  Abia: [5.5249, 7.4946],
  Adamawa: [9.2035, 12.4954],
  'Akwa Ibom': [5.0513, 7.9335],
  Anambra: [6.2127, 7.0721],
  Bauchi: [10.3103, 9.8439],
  Bayelsa: [4.9267, 6.2676],
  Benue: [7.7321, 8.5391],
  Borno: [11.8333, 13.15],
  'Cross River': [4.9601, 8.3301],
  Delta: [6.1982, 6.7349],
  Ebonyi: [6.3249, 8.1137],
  Edo: [6.3176, 5.6145],
  Ekiti: [7.6233, 5.2219],
  Enugu: [6.4474, 7.5134],
  Gombe: [10.2833, 11.1667],
  Imo: [5.4836, 7.0333],
  Jigawa: [11.8286, 9.3244],
  Kaduna: [10.5222, 7.4383],
  Kano: [12.0022, 8.592],
  Katsina: [12.9908, 7.6018],
  Kebbi: [12.4539, 4.1975],
  Kogi: [7.8023, 6.7333],
  Kwara: [8.4969, 4.5421],
  Lagos: [6.5244, 3.3792],
  Nasarawa: [8.4939, 8.5153],
  Niger: [9.6139, 6.5569],
  Ogun: [7.1557, 3.3451],
  Ondo: [7.2571, 5.2058],
  Osun: [7.7827, 4.5418],
  Oyo: [7.3775, 3.947],
  Plateau: [9.8965, 8.8583],
  Rivers: [4.8156, 7.0496],
  Sokoto: [13.0059, 5.2476],
  Taraba: [8.8937, 11.3595],
  Yobe: [11.747, 11.9661],
  Zamfara: [12.1704, 6.6641],
  FCT: [9.0765, 7.3986]
};

/** Nigeria bounding box: south-west, north-east */
export const NIGERIA_BOUNDS: [[number, number], [number, number]] = [
  [4.0, 2.5],
  [14.2, 15.1]
];

export const NIGERIA_MAP_CENTER: [number, number] = [9.082, 8.6753];

export const NIGERIA_DEFAULT_ZOOM = 6;
