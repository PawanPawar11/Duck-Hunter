import k from "./kaplayCtx";
import { COLORS, FONT_CONFIG } from "./constant";
import gameManager from "./gameManager";
import formatScore from "./utils";
import makeDog from "./entities/dog";
import makeDuck from "./entities/duck";

/* ========================================================= */
/* ====================== ASSETS =========================== */
/* ========================================================= */

k.loadSprite("background", "./graphics/background.png");
k.loadSprite("menu", "./graphics/menu.png");
k.loadSprite("cursor", "./graphics/cursor.png");
k.loadSprite("text-box", "./graphics/text-box.png");

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

  let storedBestScore = k.getData("best-score") as number | null;

  if (storedBestScore == null) {
    storedBestScore = 0;
    k.setData("best-score", 0);
  }

  // Ensure it's a number
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

  k.add([k.rect(k.width(), k.height()), k.color(COLORS.SKY_BLUE), "sky"]);
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

  /* ---------- Duck Icons UI ---------- */

  const duckIcons: any[] = [];
  const DUCK_ICON_START_X = 95;
  const DUCK_ICON_Y = 198;
  const DUCK_ICON_SPACING = 8;

  // Create 10 duck icons
  for (let i = 0; i < 10; i++) {
    const duckIcon = k.add([
      k.rect(8, 9),
      k.pos(DUCK_ICON_START_X + i * DUCK_ICON_SPACING, DUCK_ICON_Y),
      k.color(255, 255, 255), // Start as white
      { killed: false },
    ]);
    duckIcons.push(duckIcon);
  }

  /* ---------- Dog ---------- */

  const hunterDog = makeDog(k.vec2(0, k.center().y));
  hunterDog.startSearching();

  /* ========================================================= */
  /* ==================== STATE HANDLERS ==================== */
  /* ========================================================= */

  const onRoundStart = gameManager.onStateEnter(
    "round-start",
    async (isFirstRound) => {
      // Don't increase speed on first round
      if (!isFirstRound) gameManager.duckSpeed += 50;

      k.play("ui-appear");

      gameManager.currentRound++;
      roundText.text = String(gameManager.currentRound);

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
        k.text(String(gameManager.currentRound), FONT_CONFIG),
        k.anchor("center"),
        k.pos(0, 4),
      ]);

      // Reset all duck icons to white at the start of each round
      duckIcons.forEach((icon) => {
        icon.color = k.Color.fromHex("#FFFFFF");
        icon.killed = false;
      });

      await k.wait(1);
      k.destroy(roundBox);
      gameManager.enterState("hunt-start");
    },
  );

  const onHuntStart = gameManager.onStateEnter("hunt-start", () => {
    // Destroy any existing ducks before spawning a new one
    k.destroyAll("duck");

    // Safety check - only proceed if we're not paused
    if (gameManager.isPaused) return;

    gameManager.currentHunt++;

    const duck = makeDuck(
      String(gameManager.currentHunt - 1),
      gameManager.duckSpeed,
    );

    duck.setBehavior();
  });

  const onDuckHunted = gameManager.onStateEnter("duck-hunted", () => {
    gameManager.bulletsLeft = 3;

    // Mark the current duck as killed (turn icon red)
    const currentDuckIndex = gameManager.currentHunt - 1;
    if (currentDuckIndex >= 0 && currentDuckIndex < duckIcons.length) {
      duckIcons[currentDuckIndex].color = k.Color.fromHex(COLORS.RED);
      duckIcons[currentDuckIndex].killed = true;
    }

    hunterDog.celebrateCatch();
  });

  const onDuckEscaped = gameManager.onStateEnter("duck-escaped", () => {
    hunterDog.laughAtPlayer();
  });

  const onHuntEnd = gameManager.onStateEnter("hunt-end", () => {
    if (gameManager.currentHunt <= 9) {
      gameManager.enterState("hunt-start");
      return;
    }

    gameManager.currentHunt = 0;
    gameManager.enterState("round-end");
  });

  const onRoundEnd = gameManager.onStateEnter("round-end", () => {
    if (gameManager.ducksShotThisRound < 6) {
      // Update best score if current score is higher
      const currentBest = Number(k.getData("best-score")) || 0;
      if (gameManager.currentScore > currentBest) {
        k.setData("best-score", gameManager.currentScore);
      }
      k.go("game-over");
      return;
    }

    if (gameManager.ducksShotThisRound === 10) {
      gameManager.currentScore += 500;
      // Update best score
      const currentBest = Number(k.getData("best-score")) || 0;
      if (gameManager.currentScore > currentBest) {
        k.setData("best-score", gameManager.currentScore);
      }
    }

    gameManager.ducksShotThisRound = 0;
    gameManager.enterState("round-start");
  });

  /* ---------- Start AFTER registering ---------- */

  // Don't start immediately - let the dog animation trigger the round start

  /* ========================================================= */
  /* ===================== INPUT ============================= */
  /* ========================================================= */

  const crosshair = k.add([
    k.sprite("cursor"),
    k.anchor("center"),
    k.pos(),
    k.z(3),
  ]);

  k.onClick(() => {
    if (gameManager.state === "hunt-start" && !gameManager.isPaused) {
      if (gameManager.bulletsLeft > 0) {
        k.play("gun-shot", { volume: 0.5 });
        gameManager.bulletsLeft--;
      }
    }
  });

  k.onUpdate(() => {
    scoreText.text = formatScore(gameManager.currentScore, 6);

    bulletMask.width = (3 - gameManager.bulletsLeft) * 7.5;

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
    onHuntStart.cancel();
    onHuntEnd.cancel();
    onRoundEnd.cancel();
    onDuckHunted.cancel();
    onDuckEscaped.cancel();
    gameManager.reset();
  });
});

/* ========================================================= */
/* ====================== GAME OVER ======================== */
/* ========================================================= */

k.scene("game-over", () => {
  k.add([k.rect(k.width(), k.height()), k.color(0, 0, 0)]);

  k.add([
    k.text("GAME OVER!", FONT_CONFIG),
    k.anchor("center"),
    k.pos(k.center()),
  ]);

  k.wait(2, () => k.go("main-menu"));
});

k.go("main-menu");
