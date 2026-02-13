import { COLORS } from "./constant";
import gameManager from "./gameManager";
import k from "./kaplayCtx";
import { formatScore } from "./utils";

k.loadSprite("menu", "./graphics/menu.png");
k.loadSprite("background", "./graphics/background.png");
k.loadSprite("cursor", "./graphics/cursor.png");
k.loadFont("nes", "./fonts/nintendo-nes-font/nintendo-nes-font.ttf");
k.loadSound("gun-shot", "./sounds/gun-shot.wav");

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
    k.text(formatScore(0, 6), { font: "nes", size: 8 }),
    k.pos(192, 197),
    k.z(2),
  ]);

  const roundCount = k.add([
    k.text("1", { font: "nes", size: 8 }),
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

  const cursor = k.add([
    k.sprite("cursor"),
    k.anchor("center"),
    k.pos(24, 24),
    k.z(3),
  ]);

  k.onUpdate(() => {
    score.text = formatScore(gameManager.currentScore, 6);
    bulletUIMask.width = (3 - gameManager.nbBulletsLeft) * 7;
    cursor.moveTo(k.mousePos());
  });
});

k.scene("game-over", () => {});

k.go("main-menu");
