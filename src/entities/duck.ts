import k from "../kaplayCtx";
import gameManager from "../gameManager";
import { COLORS } from "../constant";
import type { GameObj } from "kaplay";

const makeDuck = (duckId: string, speed: number) => {
  const spawnPositions = [
    k.vec2(80, k.center().y + 40), // occur from left side
    k.vec2(k.center().x, k.center().y + 40), // occur from middle side
    k.vec2(200, k.center().y + 40), // occur from right side
  ];

  const movementDirections = [k.vec2(-1, -1), k.vec2(1, -1), k.vec2(1, -1)];

  const spawnIndex = k.randi(spawnPositions.length);
  const directionIndex = k.randi(movementDirections.length);

  return k.add([
    k.sprite("duck", { anim: "flight-side" }),
    k.area({ shape: new k.Rect(k.vec2(0), 24, 24) }), // to get the collision detection
    k.body(), // to perform work related to gravity
    k.anchor("center"),
    k.pos(spawnPositions[spawnIndex]),
    k.state("fly", ["fly", "shot", "fall"]),
    k.timer(),
    k.offscreen({ destroy: true, distance: 100 }),

    // the below object will add, properties and methods to the Game Object
    {
      aliveTime: 0, // this is a property
      escapeAfter: 5,
      duckId,
      direction: null,
      speed,
      quackSound: null,
      wingSound: null,
      fallSound: null,

      // the below function is a method.
      setBehavior(this: GameObj) {
        const sky = k.get("sky")[0];

        this.direction = movementDirections[directionIndex];

        if (this.direction < 0) {
          this.flipX = true;
        }

        this.quackSound = k.play("quacking", { volume: 0.5, loop: true });
        this.wingSound = k.play("flapping", { loop: true, speed: 2 });

        // ---------- Helper Functions ----------

        this.toggleFlightAnimation = function () {
          const isSide = this.getCurAnim().name === "flight-side";
          this.play(isSide ? "flight-diagonal" : "flight-side");
        };

        this.bounceHorizontally = function () {
          this.direction.x *= -1;
          this.flipX = !this.flipX;
          this.toggleFlightAnimation();
        };

        this.bounceVertically = function () {
          this.direction.y *= -1;
          this.toggleFlightAnimation();
        };

        // ---------- Fly State ----------

        this.onStateUpdate("fly", () => {
          const hitHorizontalBoundary =
            this.pos.x > k.width() + 10 || this.pos.x < -10;

          const hitVerticalBoundary =
            this.pos.x > k.width() + 10 || this.pos.x < -10;

          if (this.aliveTime < this.escapeAfter && hitHorizontalBoundary) {
            this.bounceHorizontally();
          }

          if (hitVerticalBoundary) {
            this.bounceVertically();
          }

          this.move(this.direction.scale(this.speed));
        });

        // ---------- Shot State ----------

        this.onStateEnter("shot", async () => {
          gameManager.nbDucksShotInRound++;

          this.play("shot");
          this.quackSound.stop();
          this.wingSound.stop();

          await k.wait(0.2);
          this.enterState("fall");
        });

        // ---------- Fall State ----------

        this.onStateEnter("fall", () => {
          this.fallSound = k.play("fall", { volume: 0.7 });
          this.play("fall");
        });

        this.onStateUpdate("fall", async () => {
          this.move(0, this.speed);

          if (this.pos.y > k.height() - 70) {
            this.fallSound.stop();
            k.play("impact");
            k.destroy(this);

            sky.color = k.Color.fromHex(COLORS.BLUE);

            const duckIcon = k.get(`duckIcon-${this.duckId}`, {
              recursive: true,
            })[0];

            if (duckIcon) {
              duckIcon.color = k.Color.fromHex(COLORS.RED);
            }

            await k.wait(1);
            gameManager.enterState("duck-hunted");
          }
        });

        // ---------- Click (Shoot) ----------

        this.onClick(() => {
          if (gameManager.nbBulletsLeft <= 0) return;

          gameManager.currentScore += 100;
          this.enterState("shot");
        });

        // ---------- Escape Timer ----------

        this.loop(1, () => {
          this.aliveTime++;

          if (this.aliveTime === this.escapeAfter) {
            sky.color = k.Color.fromHex(COLORS.BEIGE);
          }
        });

        // ---------- Offscreen Escape ----------

        this.onExitScreen(() => {
          this.quackSound.stop();
          this.wingSound.stop();

          sky.color = k.Color.fromHex(COLORS.BLUE);

          gameManager.nbBulletsLeft = 3;
          gameManager.enterState("duck-escaped");
        });
      },
    },
  ]);
};

export default makeDuck;
