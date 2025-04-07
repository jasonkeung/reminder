import Phaser from 'phaser'

export default class GameScene extends Phaser.Scene {
    constructor() {
        super('GameScene')
    }

    preload() {
        // Load any assets here
    }

    create() {
        this.add.text(100, 100, 'Factory World', { fontSize: '24px', fill: '#ffffff' })

        this.player = this.add.rectangle(400, 300, 40, 40, 0x00ff00); // a green square as player
        this.physics.add.existing(this.player);
        this.player.body.setCollideWorldBounds(true);

        this.keys = this.input.keyboard.addKeys({
            up: 'W',
            down: 'S',
            left: 'A',
            right: 'D'
        });
    }

    update() {
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
    }
}