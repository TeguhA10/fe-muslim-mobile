/**
 * Ka'bah coordinates in Makkah
 */
const KAABA_LAT = 21.4225;
const KAABA_LNG = 39.8262;

/**
 * Calculates Great-Circle Bearing angle from user location to Ka'bah (Qibla direction in degrees 0-360)
 */
export const calculateQiblaBearing = (userLat: number, userLng: number): number => {
  const phi1 = (userLat * Math.PI) / 180;
  const phi2 = (KAABA_LAT * Math.PI) / 180;
  const lambda1 = (userLng * Math.PI) / 180;
  const lambda2 = (KAABA_LNG * Math.PI) / 180;

  const y = Math.sin(lambda2 - lambda1);
  const x =
    Math.cos(phi1) * Math.tan(phi2) - Math.sin(phi1) * Math.cos(lambda2 - lambda1);

  let qibla = (Math.atan2(y, x) * 180) / Math.PI;
  return (qibla + 360) % 360;
};
