import Phaser from 'phaser';
import Player from './Player';
import { api } from './api';


export default class GameScene extends Phaser.Scene {
    constructor(mapName = '', initialPlayerData = []) {
        super('GameScene');
        this.mapName = mapName;
        this.players = {}; // playerid -> Player instance
        this.initialPlayerData = initialPlayerData; // Initial player data for loading
        this.isWorldLoaded = false;
        this.worldTime = 0; // Track world time for updates
    }

    addPlayer(playerId, x, y, texture = 'soldier', frame = 1) {
        if (this.players[playerId]) {
            console.warn(`Player with ID ${playerId} already exists.`);
            return this.players[playerId];
        }
        const player = new Player(this, x, y, texture, frame);
        this.players[playerId] = player;
        console.log(`Added player ${playerId} at (${x}, ${y})`);
        return player;
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
        this.cameras.main.roundPixels = true;

        this.initialPlayerData.forEach(playerData => {
            const { playerId, x, y } = playerData;
            const newPlayer = new Player(this, x, y, 'solider', 1);
            this.players[playerId] = newPlayer;
        });

        this.thoughtText = this.add.text(16, 16, '', {
            font: '18px Arial',
            fill: '#ffffff',
            backgroundColor: 'rgba(0,0,0,0.5)',
            padding: { x: 8, y: 4 }
        }).setScrollFactor(0);
        this.thoughtText.setVisible(true);

        api.on("world-update", (data) => {
            console.log("World update received:", data);
            // keep a world time and only apply updates that are newer than the last update.
            if (data.sentAt <= this.worldTime) {
                console.log("Ignoring outdated world update:", data.payload.sentAt, "current time:", this.worldTime);
                return;
            }
            const updatedPlayers = {};
            data.payload.players.forEach(p => {
                updatedPlayers[p.playerId] = p;
            });

            Object.values(updatedPlayers).forEach(updated => {
                const existing = this.players[updated.playerId];
                if (existing) {
                    console.log("Updating existing player:", updated);
                    existing.updateFromData(updated);
                } else {
                    console.log("Creating new player:", updated.playerId);
                    const newPlayer = new Player(this, updated.x, updated.y, 'solider', 1);
                    this.players[updated.playerId] = newPlayer;
                }
            });
            this.thoughtText.setText(this.players["p1"].thought || '');
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
        // if (Phaser.Input.Keyboard.JustDown(this.keys.up)) {
        //     this.players["p1"].queueInput(0, -1, 'up');
        // } else if (Phaser.Input.Keyboard.JustDown(this.keys.down)) {
        //     this.players["p1"].queueInput(0, 1, 'down');
        // } else if (Phaser.Input.Keyboard.JustDown(this.keys.left)) {
        //     this.players["p1"].queueInput(-1, 0, 'left');
        // } else if (Phaser.Input.Keyboard.JustDown(this.keys.right)) {
        //     this.players["p1"].queueInput(1, 0, 'right');
        // }

        // Display thought text for this.players[0]



        Object.values(this.players).forEach(player => {
            if (!player) {
                console.warn("Player instance is null, skipping update.");
                return;
            }
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