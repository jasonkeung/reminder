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

        this.player = this.add.rectangle(400, 300, 40, 40, 0x00ff00); // a green square as player
        this.physics.add.existing(this.player);
        this.player.body.setCollideWorldBounds(true);

        this.otherPlayers = {};
        this.otherPlayerLocations = {};

        this.keys = this.input.keyboard.addKeys({
            up: 'W',
            down: 'S',
            left: 'A',
            right: 'D'
        });

        api.on("player-update", (payload) => {
            if (!this.otherPlayerLocations[payload.id]) {
                this.otherPlayerLocations[payload.id] = {
                    x: payload.x,
                    y: payload.y
                }
            } else {
                this.otherPlayerLocations[payload.id] = {
                    x: payload.x,
                    y: payload.y
                }
            }
        });

    }

    update() {
        const speed = 200;
        const body = this.player.body;
        let moved = false;

        body.setVelocity(0);

        if (this.keys.left.isDown) {
            body.setVelocityX(-speed);
            moved = true;
        } else if (this.keys.right.isDown) {
            body.setVelocityX(speed);
            moved = true;
        }

        if (this.keys.up.isDown) {
            body.setVelocityY(-speed);
            moved = true;
        } else if (this.keys.down.isDown) {
            body.setVelocityY(speed);
            moved = true;
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
                this.otherPlayers[id] = newPlayer;
            } else {
                let player = this.otherPlayers[id];
                player.x = playerLocation.x;
                player.y = playerLocation.y;
            }
        }

        if (moved) {
            api.sendMessage('player-move', { x: body.x, y: body.y });
        }
    }

    destroy() {
        api.off("player-update"); // Remove the listener
        super.destroy();
    }
}