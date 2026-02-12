import k from "./kaplayCtx";

k.loadSprite("menu", "./graphics/menu.png");
k.loadFont("nes", "./fonts/nintendo-nes-font/nintendo-nes-font.ttf");

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
    k.color("#9FA2CB"),
    k.opacity(0.5),
  ]);

  const bestScore = (k.getData("best-score") as number | null) ?? 0;
  k.setData("best-score", bestScore);

  k.add([
    k.text(`TOP SCORE: ${bestScore.toString().padStart(6, "0")}`, {
      font: "nes",
      size: 8,
    }),
    k.pos(55, 184),
    k.color("#CB7387"),
  ]);

  k.onClick(() => {
    k.go("game");
  });
});

k.scene("game", () => {});

k.scene("game-over", () => {});

k.go("main-menu");
