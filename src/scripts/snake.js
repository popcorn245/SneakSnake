document.addEventListener("DOMContentLoaded" , () => {
    var config = {
      type: Phaser.WEBGL,
      width: 640,
      height: 480,
      backgroundColor: "#bfcc00",
      parent: "phaser-example",
      scene: {
        preload: preload,
        create: create,
        update: update,
      },
    };

    var snake;
    var p2;
    var food;
    var cursors;

    var game = new Phaser.Game(config);

    function preload() {
      this.load.image("food", "assets/games/snake/food.png");
      this.load.image("body", "assets/games/snake/body.png");
    }

    function create() {
      var Food = new Phaser.Class({
        Extends: Phaser.GameObjects.Image,

        initialize: function Food(scene, x, y) {
          Phaser.GameObjects.Image.call(this, scene);

          this.setTexture("food");
          this.setPosition(x * 16, y * 16);
          this.setOrigin(0);

          this.total = 0;

          scene.children.add(this);
        },

        eat: function () {
          this.total++;
        },
      });

      var Snake = new Phaser.Class({
        initialize: function Snake(scene, x, y, {up, down, left, right}) {
          this.headPosition = new Phaser.Geom.Point(x, y);

          this.body = scene.add.group();

          this.head = this.body.create(x * 16, y * 16, "body");
          this.head.setOrigin(0);

          this.alive = true;

          this.speed = 100;

          this.moveTime = 0;

          this.tail = new Phaser.Geom.Point(x, y);

          this.controls = {
            up,
            down,
            left,
            right
          };

          this.heading = right;
          this.direction = right;
        },

        update: function (time) {
          if (time >= this.moveTime) {
            return this.move(time);
          }
        },

        faceLeft: function () {
          if (this.direction === this.controls?.up || this.direction === this.controls?.down) {
            this.heading = this.controls?.left;
          }
        },

        faceRight: function () {
          if (this.direction === this.controls?.up || this.direction === this.controls?.down) {
            this.heading = this.controls?.right;
          }
        },

        faceUp: function () {
          if (this.direction === this.controls?.left || this.direction === this.controls?.right) {
            this.heading = this.controls?.up;
          }
        },

        faceDown: function () {
          if (this.direction === this.controls?.left || this.direction === this.controls?.right) {
            this.heading = this.controls?.down;
          }
        },

        move: function (time) {
          /**
           * Based on the heading property (which is the direction the pgroup pressed)
           * we update the headPosition value accordingly.
           *
           * The Math.wrap call allow the snake to wrap around the screen, so when
           * it goes off any of the sides it re-appears on the other.
           */
          switch (this.heading) {
            case this.controls?.left:
              this.headPosition.x = Phaser.Math.Wrap(
                this.headPosition.x - 1,
                0,
                40
              );
              break;

            case this.controls?.right:
              this.headPosition.x = Phaser.Math.Wrap(
                this.headPosition.x + 1,
                0,
                40
              );
              break;

            case this.controls?.up:
              this.headPosition.y = Phaser.Math.Wrap(
                this.headPosition.y - 1,
                0,
                30
              );
              break;

            case this.controls?.down:
              this.headPosition.y = Phaser.Math.Wrap(
                this.headPosition.y + 1,
                0,
                30
              );
              break;
          }

          this.direction = this.heading;

          //  Update the body segments and place the last coordinate into this.tail
          Phaser.Actions.ShiftPosition(
            this.body.getChildren(),
            this.headPosition.x * 16,
            this.headPosition.y * 16,
            1,
            this.tail
          );

          //  Check to see if any of the body pieces have the same x/y as the head
          //  If they do, the head ran into the body

          var hitBody = Phaser.Actions.GetFirst(
            this.body.getChildren(),
            { x: this.head.x, y: this.head.y },
            1
          );

          if (hitBody) {
            console.log("dead");

            this.alive = false;

            return false;
          } else {
            //  Update the timer ready for the next movement
            this.moveTime = time + this.speed;

            return true;
          }
        },

        grow: function () {
          var newPart = this.body.create(this.tail.x, this.tail.y, "body");

          newPart.setOrigin(0);
        },

        collideWithFood: function (food) {
          if (this.head.x === food.x && this.head.y === food.y) {
            this.grow();

            food.eat();

            //  For every 5 items of food eaten we'll increase the snake speed a little
            if (this.speed > 20 && food.total % 5 === 0) {
              this.speed -= 5;
            }

            return true;
          } else {
            return false;
          }
        },

        updateGrid: function (grid) {
          //  Remove all body pieces from valid positions list
          this.body.children.each(function (segment) {
            var bx = segment.x / 16;
            var by = segment.y / 16;

            grid[by][bx] = false;
          });

          return grid;
        },
      });

      food = new Food(this, 3, 4);

      snake = new Snake(this, 8, 8, {
        up: 0,
        down: 1,
        left: 2,
        right: 3
      });
      p2 = new Snake(this, 16, 16, {
        up: 87,
        down: 83,
        left: 65,
        right: 68
      });

      const p2Controls = this.input.keyboard.addKeys("W,S,A,D");
      //  Create our keyboard controls
      const p1Controls = this.input.keyboard.createCursorKeys();
      cursors = {...p1Controls, ...p2Controls};

    }

    function update(time, delta) {
      if (!snake.alive) {
        return;
      }

      console.log(cursors);

      if (cursors.A.isDown) {
        p2.faceLeft();
      } else if (cursors.D.isDown) {
        p2.faceRight();
      } else if (cursors.W.isDown) {
        p2.faceUp();
      } else if (cursors.S.isDown) {
        p2.faceDown();
      }

      if (p2.update(time)) {
        if (p2.collideWithFood(food)) {
          repositionFood();
        }
      }

      /**
       * Check which key is pressed, and then change the direction the snake
       * is heading based on that. The checks ensure you don't double-back
       * on yourself, for example if you're moving to the right and you press
       * the LEFT cursor, it ignores it, because the only valid directions you
       * can move in at that time is up and down.
       */
      if (cursors.left.isDown) {
        snake.faceLeft();
      } else if (cursors.right.isDown) {
        snake.faceRight();
      } else if (cursors.up.isDown) {
        snake.faceUp();
      } else if (cursors.down.isDown) {
        snake.faceDown();
      }

      if (snake.update(time)) {
        //  If the snake updated, we need to check for collision against food

        if (snake.collideWithFood(food)) {
          repositionFood();
        }
      }
    }

    /**
     * We can place the food anywhere in our 40x30 grid
     * *except* on-top of the snake, so we need
     * to filter those out of the possible food locations.
     * If there aren't any locations left, they've won!
     *
     * @method repositionFood
     * @return {boolean} true if the food was placed, otherwise false
     */
    function repositionFood() {
      //  First create an array that assumes all positions
      //  are valid for the new piece of food

      //  A Grid we'll use to reposition the food each time it's eaten
      var testGrid = [];

      for (var y = 0; y < 30; y++) {
        testGrid[y] = [];

        for (var x = 0; x < 40; x++) {
          testGrid[y][x] = true;
        }
      }

      snake.updateGrid(testGrid);

      //  Purge out false positions
      var validLocations = [];

      for (var y = 0; y < 30; y++) {
        for (var x = 0; x < 40; x++) {
          if (testGrid[y][x] === true) {
            //  Is this position valid for food? If so, add it here ...
            validLocations.push({ x: x, y: y });
          }
        }
      }

      if (validLocations.length > 0) {
        //  Use the RNG to pick a random food position
        var pos = Phaser.Math.RND.pick(validLocations);

        //  And place it
        food.setPosition(pos.x * 16, pos.y * 16);

        return true;
      } else {
        return false;
      }
    }
  });