const formatScore = (score: number, digits: number) =>
  score.toString().padStart(digits, "0");

export default formatScore;
