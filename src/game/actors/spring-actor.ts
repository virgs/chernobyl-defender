import type {Point} from '@/game/math/point';
import type Phaser from 'phaser';
import {Directions} from '@/game/constants/directions';
import type {GameActor} from '@/game/actors/game-actor';
import {Tiles} from '@/game/tiles/tiles';

export class SpringActor implements GameActor {
    private readonly tweens: Phaser.Tweens.TweenManager;
    private readonly scene: Phaser.Scene;
    private readonly tilePosition: Point;
    private readonly sprite: Phaser.GameObjects.Sprite;
    private readonly id: number;
    private readonly orientation: Directions;
    private covered: boolean;

    constructor(config: { orientation: Directions; tilePosition: Point; sprite: Phaser.GameObjects.Sprite; scene: Phaser.Scene, id: number }) {
        this.orientation = config.orientation;
        this.id = config.id;
        this.scene = config.scene;
        this.tilePosition = config.tilePosition;
        this.sprite = config.sprite;
        this.tweens = config.scene.tweens;
        this.covered = false;

        switch (this.orientation) {
            case Directions.LEFT:
                this.sprite.setRotation(Math.PI / 2);
                //     this.sprite.flipY = true
                break;
            case Directions.UP:
                this.sprite.flipY = true
                // this.sprite.setRotation(Math.PI);
                break;
            case Directions.RIGHT:
                this.sprite.setRotation(Math.PI / 2);
                this.sprite.flipX = true;
                break;
        }
    }

    public isCovered(): boolean {
        return this.covered;
    }

    public uncover(): void {
        this.covered = false;
        // console.log('spring release')
    }

    public cover(): void {
        // console.log('spring engage')
        this.covered = true;
    }

    public getId(): number {
        return this.id;
    }

    public getSprite(): Phaser.GameObjects.Sprite {
        return this.sprite;
    }

    public getTileCode(): Tiles {
        return Tiles.spring;
    }

    public getTilePosition(): Point {
        return this.tilePosition;
    }

    public getOrientation(): Directions | undefined {
        return this.orientation;
    }

}
