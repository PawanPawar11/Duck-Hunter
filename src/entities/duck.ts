import k from "../kaplayCtx";
import gameManager from "../gameManager";
import { COLORS } from "../constant";
import type { GameObj } from "kaplay";

const makeDuck = (duckId: string, speed: number) => {
  const spawnPositions = [
    k.vec2(80, k.center().y + 40),
    k.vec2(k.center().x, k.center().y + 40),
    k.vec2(200, k.center().y + 40),
  ];

  const directions = [k.vec2(-1, -1), k.vec2(1, -1)];

  const spawn = spawnPositions[k.randi(spawnPositions.length)];
  const direction = directions[k.randi(directions.length)];

  return k.add([
    k.sprite("duck", { anim: "flight-side" }),
    k.area({ shape: new k.Rect(k.vec2(0), 24, 24) }),
    k.body(),
    k.anchor("center"),
    k.pos(spawn),
    k.state("fly", ["fly", "shot", "fall"]),
    k.timer(),
    k.offscreen({ destroy: true, distance: 100 }),
    "duck", // Add tag for identification

    {
      aliveTime: 0,
      escapeAfter: 5,
      direction,
      duckId,
      speed,

      setBehavior(this: GameObj) {
        const sky = k.get("sky")[0];

        if (this.direction.x < 0) this.flipX = true;

        const quack = k.play("quacking", { loop: true, volume: 0.5 });
        const flap = k.play("flapping", { loop: true, speed: 2 });

        const toggleAnimation = () => {
          const isSide = this.getCurAnim().name === "flight-side";
          this.play(isSide ? "flight-diagonal" : "flight-side");
        };

        const bounceX = () => {
          this.direction.x *= -1;
          this.flipX = !this.flipX;
          toggleAnimation();
        };

        const bounceY = () => {
          this.direction.y *= -1;
          toggleAnimation();
        };

        this.onStateUpdate("fly", () => {
          const hitX = this.pos.x > k.width() + 10 || this.pos.x < -10;

          const hitY = this.pos.y < -10 || this.pos.y > k.height() - 70;

          if (this.aliveTime < this.escapeAfter && hitX) bounceX();
          if (hitY) bounceY();

          this.move(this.direction.scale(this.speed));
        });

        this.onStateEnter("shot", async () => {
          gameManager.ducksShotThisRound++;
          this.play("shot");
          quack.stop();
          flap.stop();
          await k.wait(0.2);
          this.enterState("fall");
        });

        this.onStateEnter("fall", () => {
          k.play("fall");
          this.play("fall");
        });

        this.onStateUpdate("fall", async () => {
          this.move(0, this.speed);

          if (this.pos.y > k.height() - 70) {
            k.play("impact");
            k.destroy(this);
            sky.color = k.Color.fromHex(COLORS.SKY_BLUE);
            await k.wait(1);
            gameManager.enterState("duck-hunted");
          }
        });

        this.onClick(() => {
          if (
            gameManager.state !== "hunt-start" ||
            gameManager.bulletsLeft <= 0
          )
            return;
          gameManager.currentScore += 100;
          this.enterState("shot");
        });

        this.loop(1, () => {
          this.aliveTime++;
          if (this.aliveTime === this.escapeAfter) {
            sky.color = k.Color.fromHex(COLORS.WARNING_BEIGE);
          }
        });

        this.onExitScreen(() => {
          quack.stop();
          flap.stop();
          sky.color = k.Color.fromHex(COLORS.SKY_BLUE);
          gameManager.bulletsLeft = 3;
          gameManager.enterState("duck-escaped");
        });
      },
    },
  ]);
};

export default makeDuck;
