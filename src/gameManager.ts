import type { GameObj } from "kaplay";
import k from "./kaplayCtx";

const makeGameManager = () => {
  const defaults = {
    currentScore: 0,
    currentRoundNb: 0,
    currentHuntNb: 0,
    nbBulletsLeft: 3,
    nbDucksShotInRound: 0,
    preySpeed: 100,
  };

  return k.add([
    k.state("menu", [
      "menu",
      "round-start",
      "round-end",
      "hunt-start",
      "hunt-end",
      "duck-hunted",
      "duck-escaped",
    ]),
    {
      isGamePaused: false,
      ...defaults,
      resetGameState(this: GameObj) {
        Object.assign(this, defaults);
      },
    },
  ]);
};

const gameManager = makeGameManager();
export default gameManager;
