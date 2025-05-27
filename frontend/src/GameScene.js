import Phaser from 'phaser';
import Player from './Player';

export default class GameScene extends Phaser.Scene {
    constructor() {
        super('GameScene');
    }

    preload() {
        this.load.image('terrain', 'assets/terrain.png');
        this.load.image('terrain2', 'assets/terrain2.png');
        this.load.tilemapTiledJSON('map', 'assets/map2.tmj');
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

        const map = this.make.tilemap({ key: 'map' });
        const tileset = map.addTilesetImage('terrain', 'terrain');
        const tileset2 = map.addTilesetImage('terrain2', 'terrain2');

        // Loop through all layers in the map and create them
        map.layers.forEach((layerData, i) => {
            // You can use either tileset or tileset2 depending on your Tiled setup
            // If you have multiple tilesets per layer, you may need to check which tileset to use
            map.createLayer(layerData.name, [tileset, tileset2], 0, 0);
        });
        this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);

        // Draw tile borders and highlight player tile
        this.tileGraphics = this.add.graphics();

        this.player = new Player(this, 5, 5, 'solider', 1);

        // Example: queue a sequence of moves (right, down, left, up)
        // this.player.queueInput(1, 0, 'right');
        // this.player.queueInput(0, 1, 'down');
        // this.player.queueInput(-1, 0, 'left');
        // this.player.queueInput(0, -1, 'up');
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

        this.player.update();

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