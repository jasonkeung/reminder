import Phaser from 'phaser';
import Player from './Player';
import { api } from './api';


export default class GameScene extends Phaser.Scene {
    constructor(mapName = '', players = {}) {
        super('GameScene');
        this.mapName = mapName;
        this.players = players;
        this.isWorldLoaded = false;
    }

    preload() {
        this.load.tilemapTiledJSON('map', `assets/${this.mapName}.tmj`);
        this.load.image('terrain', 'assets/terrain.png');
        this.load.image('terrain2', 'assets/terrain2.png');
        this.load.spritesheet('solider', 'assets/soldier.png', {
            frameWidth: 64,
            frameHeight: 64
        });
    }

    create() {
        this.keys = this.input.keyboard.addKeys({
            up: 'W',
            down: 'S',
            left: 'A',
            right: 'D'
        });

        // Base map
        const map = this.make.tilemap({ key: 'map' });
        const tileset = map.addTilesetImage('terrain', 'terrain');
        const tileset2 = map.addTilesetImage('terrain2', 'terrain2');
        map.layers.forEach((layerData, i) => {
            map.createLayer(layerData.name, [tileset, tileset2], 0, 0);
        });
        this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);

        api.on("world-update", (payload) => {
            console.log("World update received:", payload);
            // keep a world time and only apply updates that are newer than the last update.
            if (this == null) {
                // like wtf 
                console.error("GameScene is null, cannot update world.");
            }
            const updatedPlayers = {};
            payload.players.forEach(p => {
                updatedPlayers[p.playerId] = p;
            });

            Object.values(updatedPlayers).forEach(updated => {
                const existing = this.players[updated.playerId];
                if (existing) {
                    console.log("Updating existing player:", updated.playerId);
                    existing.setPosition(updated.x * 32, updated.y * 32);
                } else {
                    console.log("Creating new player:", updated.playerId);
                    const newPlayer = new Player(this, updated.x, updated.y, 'solider', 1);
                    this.players[updated.playerId] = newPlayer;
                }
            });
            console.log("Updated players:", this.players);
        });

        // change to just draw map without the items as one layer.

        // then, create a new object like Player for each object in the state.
        // if there are actions in the input queue ordered by sent_time (instance var of GameScene), apply them in order if they can be applied (not already moving, etc. maybe just remove the walk time and no need to restrict applying actions)



        // this.player = new Player(this, 5, 5, 'solider', 1);

        // Example: queue a sequence of moves (right, down, left, up)
        // this.player.queueInput(1, 0, 'right');
        // this.player.queueInput(0, 1, 'down');
        // this.player.queueInput(-1, 0, 'left');
        // this.player.queueInput(0, -1, 'up');

    }

    walkPlayer(oldX, oldY, newX, newY) {
        // something queueing for async movement, but prob dont want this.player.queueInput(0, -1, 'up');
        // this.player.moveByTile(newX - oldX, newY - oldY);


        // task here is just to animate the player moving actually. change player some more and call a method
    }

    update() {
        // Handle real-time input: queue only on key down events
        if (Phaser.Input.Keyboard.JustDown(this.keys.up)) {
            this.player.queueInput(0, -1, 'up');
        } else if (Phaser.Input.Keyboard.JustDown(this.keys.down)) {
            this.player.queueInput(0, 1, 'down');
        } else if (Phaser.Input.Keyboard.JustDown(this.keys.left)) {
            this.player.queueInput(-1, 0, 'left');
        } else if (Phaser.Input.Keyboard.JustDown(this.keys.right)) {
            this.player.queueInput(1, 0, 'right');
        }

        Object.values(this.players).forEach(player => {
            player.update();
        });

        // this.update_debugGraphics();
    }

    update_debugGraphics() {
        // --- Highlight the player's current tile ---
        this.tileGraphics.clear();

        // Draw all tile borders
        const map = this.make.tilemap({ key: 'map' });
        const tileWidth = map.tileWidth;
        const tileHeight = map.tileHeight;
        const mapWidth = map.width;
        const mapHeight = map.height;

        this.tileGraphics.lineStyle(1, 0xffffff, 0.5);
        for (let y = 0; y < mapHeight; y++) {
            for (let x = 0; x < mapWidth; x++) {
                this.tileGraphics.strokeRect(
                    x * tileWidth,
                    y * tileHeight,
                    tileWidth,
                    tileHeight
                );
            }
        }

        // Highlight the player's tile
        const playerTileX = Math.floor(this.player.x / tileWidth);
        const playerTileY = Math.floor(this.player.y / tileHeight);
        this.tileGraphics.fillStyle(0x44ff44, 0.3); // green highlight, semi-transparent
        this.tileGraphics.fillRect(
            playerTileX * tileWidth,
            playerTileY * tileHeight,
            tileWidth,
            tileHeight
        );
    }
}