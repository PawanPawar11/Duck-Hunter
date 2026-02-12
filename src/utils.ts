export const formatScore = (score: number, nbDigits: number) => {
  return score.toString().padStart(nbDigits, "0");
};
