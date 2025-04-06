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
    }

    update() {
        // Game loop logic
    }
}