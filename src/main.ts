import { COLORS, fontConfig } from "./constant";
import makeDog from "./entities/dog";
import gameManager from "./gameManager";
import k from "./kaplayCtx";
import { formatScore } from "./utils";

k.loadSprite("menu", "./graphics/menu.png");
k.loadSprite("background", "./graphics/background.png");
k.loadSprite("cursor", "./graphics/cursor.png");
k.loadSprite("text-box", "./graphics/text-box.png");
k.loadSprite("dog", "./graphics/dog.png", {
  sliceX: 4,
  sliceY: 3,
  anims: {
    search: {
      from: 0,
      to: 3,
      speed: 6,
      loop: true,
    },
    snif: {
      from: 4,
      to: 5,
      speed: 4,
      loop: true,
    },
    detect: 6,
    jump: { from: 7, to: 8, speed: 6 },
    catch: 9,
    mock: { from: 10, to: 11, loop: true },
  },
});
k.loadFont("nes", "./fonts/nintendo-nes-font/nintendo-nes-font.ttf");
k.loadSound("gun-shot", "./sounds/gun-shot.wav");
k.loadSound("ui-appear", "./sounds/ui-appear.wav");
k.loadSound("sniffing", "./sounds/sniffing.wav");
k.loadSound("barking", "./sounds/barking.wav");
k.loadSound("laughing", "./sounds/laughing.wav");
k.loadSound("successful-hunt", "./sounds/successful-hunt.wav");

k.scene("main-menu", () => {
  k.add([k.sprite("menu")]);

  k.add([
    k.text("CLICK TO START", {
      font: "nes",
      size: 8,
    }),
    k.anchor("center"),
    k.pos(k.center().x, k.center().y + 40),
  ]);

  k.add([
    k.text("MADE BY PAWANPAWAR1", {
      font: "nes",
      size: 8,
    }),
    k.pos(10, 215),
    k.color(COLORS.BLUE),
    k.opacity(0.5),
  ]);

  const bestScore = (k.getData("best-score") as number | null) ?? 0;
  k.setData("best-score", bestScore);

  k.add([
    k.text(`TOP SCORE: ${formatScore(bestScore, 6)}`, {
      font: "nes",
      size: 8,
    }),
    k.pos(55, 184),
    k.color(COLORS.RED),
  ]);

  k.onClick(() => {
    k.go("game");
  });
});

k.scene("game", () => {
  k.setCursor("none");

  k.add([k.rect(k.width(), k.height()), k.color(COLORS.BLUE), "sky"]);

  k.add([k.sprite("background"), k.pos(0, -10), k.z(1)]);

  const score = k.add([
    k.text(formatScore(0, 6), fontConfig),
    k.pos(192, 197),
    k.z(2),
  ]);

  const roundCount = k.add([
    k.text("1", fontConfig),
    k.pos(42, 182),
    k.z(2),
    k.color(COLORS.RED),
  ]);

  const duckIcons = k.add([k.pos(95, 198)]);

  for (let i = 0; i < 10; i++) {
    duckIcons.add([k.rect(7, 9), k.pos(1 + i * 8, 0), `duckIcon-${i}`]);
  }

  const bulletUIMask = k.add([
    k.rect(0, 8),
    k.pos(25, 198),
    k.z(2),
    k.color(0, 0, 0),
  ]);

  const dog = makeDog(k.vec2(0, k.center().y));
  dog.searchForDucks();

  const roundStartController = gameManager.onStateEnter(
    "round-start",
    async (isFirstRound: Boolean) => {
      if (!isFirstRound) {
        gameManager.preySpeed += 50;
      }

      k.play("ui-appear", { volume: 1 });

      gameManager.currentRoundNb++;
      roundCount.text = String(gameManager.currentRoundNb);

      const textBox = k.add([
        k.sprite("text-box"),
        k.anchor("center"),
        k.pos(k.center().x, k.center().y),
        k.z(2),
      ]);

      textBox.add([
        k.text("ROUND", fontConfig),
        k.anchor("center"),
        k.pos(0, -10),
      ]);

      textBox.add([
        k.text(String(gameManager.currentRoundNb), fontConfig),
        k.anchor("center"),
        k.pos(0, 4),
      ]);

      await k.wait(1);

      k.destroy(textBox);

      gameManager.enterState("hunt-start");
    },
  );

  gameManager.enterState("round-start");

  const cursor = k.add([
    k.sprite("cursor"),
    k.anchor("center"),
    k.pos(24, 24),
    k.z(3),
  ]);

  k.onClick(() => {
    if (gameManager.state === "hunt" && !gameManager.isGamePaused) {
      if (gameManager.nbBulletsLeft > 0) {
        k.play("gun-shot", { volume: 0.5 });
        gameManager.nbBulletsLeft--;
      }
    }
  });

  k.onUpdate(() => {
    score.text = formatScore(gameManager.currentScore, 6);
    bulletUIMask.width = (3 - gameManager.nbBulletsLeft) * 7;
    cursor.moveTo(k.mousePos());
  });
});

k.scene("game-over", () => {});

k.go("main-menu");
