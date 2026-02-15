import type { GameObj } from "kaplay";
import k from "./kaplayCtx";

const defaultGameState = {
  currentScore: 0,
  currentRound: 0,
  currentHunt: 0,
  bulletsLeft: 3,
  ducksShotThisRound: 0,
  duckSpeed: 100,
};

const createGameManager = () =>
  k.add([
    k.state("idle", [
      "idle",
      "round-start",
      "round-end",
      "hunt-start",
      "hunt-end",
      "duck-hunted",
      "duck-escaped",
    ]),
    {
      isPaused: false,
      ...defaultGameState,

      reset(this: GameObj) {
        Object.assign(this, defaultGameState);
      },
    },
  ]);

export default createGameManager();
