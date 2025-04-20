import Phaser from 'phaser'
import { api } from './api'

export default class GameScene extends Phaser.Scene {
    constructor(user) {
        super('GameScene')
        this.user = user;
    }

    preload() {
        // Load any assets here
    }

    create() {

        this.ticksTillMove = 30;

        this.player = this.add.rectangle(400, 300, 40, 40, 0x00ff00); // a green square as player
        this.physics.add.existing(this.player);
        this.player.setOrigin(.5, .5);
        this.player.body.setCollideWorldBounds(true);

        this.otherPlayers = {};
        this.otherPlayerLocations = {};

        this.keys = this.input.keyboard.addKeys({
            up: 'W',
            down: 'S',
            left: 'A',
            right: 'D'
        });

        // Add touch controls
        this.input.on('pointerdown', this.onPointerDown, this);
        this.input.on('pointermove', this.onPointerMove, this);
        this.input.on('pointerup', this.onPointerUp, this);

        this.isPointerDown = false;
        this.pointer = null;
        this.startCircle = null;

        api.on("player-move", (payload) => {
            this.otherPlayerLocations[payload.id] = {
                x: payload.x,
                y: payload.y
            }
        });

    }

    update() {
        if (this.isPointerDown) {
            if (this.startCircle) {
                this.startCircle.setVisible(true);
                this.startCircle.x = this.startX;
                this.startCircle.y = this.startY;
            } else {
                this.startCircle = this.add.circle(this.startX, this.startY, 5, 0x00ff00);
            }
        } else if (this.startCircle) {
            this.startCircle.setVisible(false);
        }
        const speed = 200;
        const body = this.player.body;

        body.setVelocity(0);

        if (this.keys.left.isDown) {
            body.setVelocityX(-speed);
        } else if (this.keys.right.isDown) {
            body.setVelocityX(speed);
        }

        if (this.keys.up.isDown) {
            body.setVelocityY(-speed);
        } else if (this.keys.down.isDown) {
            body.setVelocityY(speed);
        }

        if (this.isPointerDown && this.pointer) {
            // Calculate the distance between
            const dx = this.pointer.x - this.startX;
            const dy = this.pointer.y - this.startY;

            // Calculate the magnitude (distance)
            const magnitude = Math.sqrt(dx ** 2 + dy ** 2);

            if (magnitude > 0) {
                // Normalize the dx and dy
                const ndx = dx / magnitude;
                const ndy = dy / magnitude;

                // Move the player based on the touch movement
                const body = this.player.body;
                body.setVelocity(ndx * 200, ndy * 200); // Adjust speed multiplier as needed
            } else {
                // Stop the player's movement if there's no drag
                const body = this.player.body;
                body.setVelocity(0, 0);
            }
        }



        for (const id in this.otherPlayerLocations) {
            if (id === this.user.user.user_id) {
                continue;
            }
            const playerLocation = this.otherPlayerLocations[id];
            if (!(id in this.otherPlayers)) {
                console.log("Adding new player", id);
                const newPlayer = this.add.rectangle(playerLocation.x, playerLocation.y, 40, 40, 0xff0000);
                this.physics.add.existing(newPlayer);
                newPlayer.setOrigin(0, 0);
                newPlayer.body.setCollideWorldBounds(true);
                this.otherPlayers[id] = newPlayer;
            } else {
                let player = this.otherPlayers[id];
                player.x = playerLocation.x;
                player.y = playerLocation.y;
            }
        }

        this.ticksTillMove -= 1;
        if (this.ticksTillMove <= 0) {
            this.ticksTillMove = 30;
            api.sendMessage('player-move', { x: body.x, y: body.y });

        }
    }

    destroy() {
        api.off("player-update"); // Remove the listener
        super.destroy();
    }

    onPointerDown(pointer) {
        // Store the initial touch position
        this.startX = pointer.x;
        this.startY = pointer.y;
        this.isPointerDown = true;
    }

    onPointerMove(pointer) {
        if (this.isPointerDown) {
            this.pointer = {
                x: pointer.x,
                y: pointer.y
            }
        }
    }

    onPointerUp(pointer) {
        // Stop the player's movement when the touch ends
        const body = this.player.body;
        body.setVelocity(0, 0);
        this.isPointerDown = false;
    }
}