import k from "./kaplayCtx";
import { COLORS, FONT_CONFIG } from "./constant";
import gameManager from "./gameManager";
import formatScore from "./utils";
import makeDog from "./entities/dog";

/* -------------------- ASSET LOADING -------------------- */

k.loadSprite("background", "./graphics/background.png");
k.loadSprite("menu", "./graphics/menu.png");
k.loadSprite("cursor", "./graphics/cursor.png");

k.loadFont("nes", "./fonts/nintendo-nes-font/nintendo-nes-font.ttf");

k.loadSprite("dog", "./graphics/dog.png", {
  sliceX: 4,
  sliceY: 3,
  anims: {
    search: { from: 0, to: 3, speed: 6, loop: true },
    snif: { from: 4, to: 5, speed: 4, loop: true },
    detect: 6,
    jump: { from: 7, to: 8, speed: 6 },
    catch: 9,
    mock: { from: 10, to: 11, loop: true },
  },
});

k.loadSprite("duck", "./graphics/duck.png", {
  sliceX: 8,
  sliceY: 1,
  anims: {
    "flight-diagonal": { from: 0, to: 2, loop: true },
    "flight-side": { from: 3, to: 5, loop: true },
    shot: 6,
    fall: 7,
  },
});

/* Sounds */
[
  "gun-shot",
  "quacking",
  "flapping",
  "fall",
  "impact",
  "sniffing",
  "barking",
  "laughing",
  "ui-appear",
  "successful-hunt",
  "forest-ambiance",
].forEach((sound) =>
  k.loadSound(
    sound,
    `./sounds/${sound}.${sound === "flapping" ? "ogg" : "wav"}`,
  ),
);

/* ========================================================= */
/* ====================== MAIN MENU ======================== */
/* ========================================================= */

k.scene("main-menu", () => {
  k.add([k.sprite("menu")]);

  k.add([
    k.text("CLICK TO START", FONT_CONFIG),
    k.anchor("center"),
    k.pos(k.center().x, k.center().y + 40),
  ]);

  k.add([
    k.text("MADE BY PAWAN PAWAR", FONT_CONFIG),
    k.pos(10, 215),
    k.color(COLORS.BLUE),
    k.opacity(0.5),
  ]);

  let storedBestScore = k.getData("best-score") as number | null;

  if (storedBestScore == null) {
    storedBestScore = 0;
    k.setData("best-score", 0);
  }

  storedBestScore = Number(storedBestScore) || 0;

  k.add([
    k.text(`TOP SCORE = ${formatScore(storedBestScore, 6)}`, FONT_CONFIG),
    k.pos(55, 184),
    k.color(COLORS.RED),
  ]);

  k.onClick(() => k.go("game"));
});

/* ========================================================= */
/* ======================== GAME =========================== */
/* ========================================================= */

k.scene("game", () => {
  k.setCursor("none");

  /* ---------- Background ---------- */

  k.add([k.rect(k.width(), k.height()), k.color(COLORS.BLUE), "sky"]);
  k.add([k.sprite("background"), k.pos(0, -10), k.z(1)]);

  /* ---------- UI ---------- */

  const scoreText = k.add([
    k.text(formatScore(0, 6), FONT_CONFIG),
    k.pos(192, 197),
    k.z(2),
  ]);

  const roundText = k.add([
    k.text("1", FONT_CONFIG),
    k.pos(42, 182),
    k.z(2),
    k.color(COLORS.RED),
  ]);

  const bulletMask = k.add([
    k.rect(0, 8),
    k.pos(25, 198),
    k.z(2),
    k.color(0, 0, 0),
  ]);

  const duckIconContainer = k.add([k.pos(95, 198)]);
  for (let i = 0; i < 10; i++) {
    duckIconContainer.add([k.rect(7, 9), k.pos(1 + i * 8, 0), `duckIcon-${i}`]);
  }

  /* ---------- Dog ---------- */

  const hunterDog = makeDog(k.vec2(0, k.center().y));
  hunterDog.searchForDucks();

  /* ========================================================= */
  /* ==================== GAME STATES ======================== */
  /* ========================================================= */

  const onRoundStart = gameManager.onStateEnter(
    "round-start",
    async (isFirstRound) => {
      if (!isFirstRound) gameManager.preySpeed += 50;

      k.play("ui-appear");

      gameManager.currentRoundNb++;
      roundText.text = String(gameManager.currentRoundNb);

      const roundBox = k.add([
        k.sprite("text-box"),
        k.anchor("center"),
        k.pos(k.center().x, k.center().y - 50),
        k.z(2),
      ]);

      roundBox.add([
        k.text("ROUND", FONT_CONFIG),
        k.anchor("center"),
        k.pos(0, -10),
      ]);

      roundBox.add([
        k.text(String(gameManager.currentRoundNb), {
          font: "nes",
          size: 8,
        }),
        k.anchor("center"),
        k.pos(0, 4),
      ]);

      await k.wait(1);
      k.destroy(roundBox);

      gameManager.enterState("hunt-start");
    },
  );

  gameManager.enterState("round-start");

  const crosshair = k.add([
    k.sprite("cursor"),
    k.anchor("center"),
    k.pos(),
    k.z(3),
  ]);

  k.onClick(() => {
    if (gameManager.state === "hunt-start" && !gameManager.isGamePaused) {
      if (gameManager.nbBulletsLeft > 0) {
        k.play("gun-shot", { volume: 0.5 });
      }

      gameManager.nbBulletsLeft--;
    }
  });

  k.onUpdate(() => {
    scoreText.text = formatScore(gameManager.currentScore, 6);

    bulletMask.width = (3 - gameManager.nbBulletsLeft) * 7.5;

    crosshair.moveTo(k.mousePos());
  });

  /* ========================================================= */
  /* ================== AMBIENCE + CLEANUP =================== */
  /* ========================================================= */

  const ambientSound = k.play("forest-ambiance", {
    volume: 0.1,
    loop: true,
  });

  k.onSceneLeave(() => {
    ambientSound.stop();

    onRoundStart.cancel();

    gameManager.resetGameState();
  });
});

k.scene("game-over", () => {});

k.go("main-menu");
