import Phaser from 'phaser';

export default class Player extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, tilesX, tilesY, texture = 'soldier', frame = 1) {
        super(scene, tilesX * 32, tilesY * 32, texture, frame);
        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.setCollideWorldBounds(true);
        this.setOrigin(0.25, 0.625);

        this.tileSize = 32;
        // TODO: add player state vars here 
        this.facing = 'down'; // Current facing direction
        this.setFrame(this.getFrameForDirection(this.facing, 0));

        // Animation state
        this.isMoving = false;
        this.targetPosition = null;
        this.moveDuration = 300; // ms to move one tile (adjust as needed)
        this.moveStartTime = 0;
        this.startPosition = null;

        // Input queue for animated movement
        this.inputQueue = [];
    }

    queueInput(dx, dy, direction) {
        this.inputQueue.push({ dx, dy, direction });
    }

    moveByTile(dx, dy) {
        // Snap to grid before moving
        const startX = Math.round(this.x / this.tileSize) * this.tileSize;
        const startY = Math.round(this.y / this.tileSize) * this.tileSize;
        this.x = startX;
        this.y = startY;

        // Calculate target position
        const targetX = startX + dx * this.tileSize;
        const targetY = startY + dy * this.tileSize;

        // Set up movement state
        this.isMoving = true;
        this.moveStartTime = this.scene.time.now;
        this.startPosition = { x: startX, y: startY };
        this.targetPosition = { x: targetX, y: targetY };
    }

    getFrameForDirection(direction, progress = 0) {
        let base;
        switch (direction) {
            case 'up': base = 0; break;
            case 'left': base = 9; break;
            case 'down': base = 18; break;
            case 'right': base = 27; break;
            default: base = 18; break;
        }
        const frameOffset = Math.floor(progress * 9);
        return base + Math.min(frameOffset, 8);
    }

    updateFromData(data) {
        const now = this.scene.time.now;
        if (data.x !== undefined) this.x = data.x * this.tileSize;
        if (data.y !== undefined) this.y = data.y * this.tileSize;
        if (data.facingDirection !== undefined) {
            this.facing = data.facingDirection?.toLowerCase() || this.facing;
            const elapsed = now - this.moveStartTime;
            const t = Math.min(elapsed / this.moveDuration, 1);
            this.setFrame(this.getFrameForDirection(this.facing, t));
        }
    }

    update() {
        const now = this.scene.time.now;
        console.log("player x:", this.x, "y:", this.y, "facing:", this.facing);

        // Animate
        if (this.isMoving && this.targetPosition && this.startPosition) {
            const elapsed = now - this.moveStartTime;
            const t = Math.min(elapsed / this.moveDuration, 1);
            this.setFrame(this.getFrameForDirection(this.facing, t));

            // Linear interpolation between start and target
            this.x = Phaser.Math.Linear(this.startPosition.x, this.targetPosition.x, t);
            this.y = Phaser.Math.Linear(this.startPosition.y, this.targetPosition.y, t);

            if (t >= 1) {
                this.x = this.targetPosition.x;
                this.y = this.targetPosition.y;
                this.isMoving = false;
                this.targetPosition = null;
                this.startPosition = null;
            }
            // Don't process new input while moving
            return;
        }

        // If not moving and there is input in the queue, process it
        if (!this.isMoving && this.inputQueue.length > 0) {
            const { dx, dy, direction } = this.inputQueue.shift();
            if (direction && this.facing !== direction) {
                // Change facing only, do not move
                this.facing = direction;
                this.setFrame(this.getFrameForDirection(direction));
            } else if (dx !== 0 || dy !== 0) {
                this.moveByTile(dx, dy);
            }
        }
    }
}