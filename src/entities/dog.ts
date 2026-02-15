import type { GameObj, Vec2 } from "kaplay";
import k from "../kaplayCtx";
import gameManager from "../gameManager";

const JUMP_HEIGHT = 90;
const GROUND_Y = 125;

const makeDog = (startPosition: Vec2) => {
  const sounds = {
    sniff: k.play("sniffing", { volume: 2 }),
    bark: k.play("barking"),
    laugh: k.play("laughing"),
    success: k.play("successful-hunt"),
  };

  Object.values(sounds).forEach((s) => s.stop());

  return k.add([
    k.sprite("dog"),
    k.pos(startPosition),
    k.z(2),
    k.state("walking", [
      "walking",
      "sniffing",
      "detecting",
      "jumping",
      "landing",
    ]),

    {
      walkSpeed: 15,

      startSearching(this: GameObj) {
        let sniffCount = 0;

        this.onStateEnter("walking", () => {
          this.play("search");
          k.wait(2.5, () => this.enterState("sniffing"));
        });

        this.onStateUpdate("walking", () => {
          this.move(this.walkSpeed, 0);
        });

        this.onStateEnter("sniffing", () => {
          sniffCount++;
          this.play("snif");
          sounds.sniff.play();

          k.wait(2.5, () => {
            if (sniffCount >= 2) {
              this.enterState("detecting");
            } else {
              this.enterState("walking");
            }
          });
        });

        this.onStateEnter("detecting", () => {
          sounds.bark.play();
          this.play("detect");
          k.wait(1.5, () => {
            sounds.bark.stop();
            this.enterState("jumping");
          });
        });

        this.onStateEnter("jumping", () => {
          sounds.bark.play();
          this.play("jump");

          k.wait(0.5, () => {
            sounds.bark.stop();
            this.use(k.z(0));
            this.enterState("landing");
          });
        });

        this.onStateUpdate("jumping", () => {
          this.move(100, -50);
        });

        this.onStateEnter("landing", async () => {
          await this.moveToY(GROUND_Y);
          await k.wait(1); // Wait longer after landing
          gameManager.enterState("round-start", true);
        });
      },

      async moveToY(this: GameObj, targetY: number) {
        await k.tween(
          this.pos.y,
          targetY,
          0.5,
          (y) => (this.pos.y = y),
          k.easings.linear,
        );
      },

      async popUpAnimation(this: GameObj) {
        await this.moveToY(JUMP_HEIGHT);
        await k.wait(1);
        await this.moveToY(GROUND_Y);
      },

      async celebrateCatch(this: GameObj) {
        sounds.success.play();
        this.play("catch");
        await this.popUpAnimation();
        gameManager.enterState("hunt-end");
      },

      async laughAtPlayer(this: GameObj) {
        sounds.laugh.play();
        this.play("mock");
        await this.popUpAnimation();
        gameManager.enterState("hunt-end");
      },
    },
  ]);
};

export default makeDog;
