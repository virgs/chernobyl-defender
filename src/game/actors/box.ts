import type Phaser from 'phaser';
import type {Point} from '@/game/math/point';
import {TileCodes} from '@/game/tiles/tile-codes';
import type {GameActor} from '@/game/actors/game-actor';
import {getTweenFromDirection} from '@/game/actors/tween';
import type {Directions} from '@/game/constants/directions';

export class Box implements GameActor {
    private tilePosition: Point;
    private isOnTarget: boolean;
    private readonly tweens: Phaser.Tweens.TweenManager;
    private readonly sprite: Phaser.GameObjects.Sprite;

    constructor(boxConfig: { scene: Phaser.Scene, sprite: Phaser.GameObjects.Sprite, tilePosition: Point }) {
        this.tilePosition = boxConfig.tilePosition;
        this.tweens = boxConfig.scene.tweens;
        this.sprite = boxConfig.sprite;
        this.isOnTarget = false;
    }

    public getTilePosition() {
        return this.tilePosition;
    }

    public setIsOnTarget(isOnTarget: boolean) {
        if (isOnTarget) {
            this.sprite.setFrame(TileCodes.boxOnTarget);
        } else {
            this.sprite.setFrame(TileCodes.box);
        }

        return this.isOnTarget = isOnTarget;
    }

    public getIsOnTarget(): boolean {
        return this.isOnTarget;
    }

    public getSprite(): Phaser.GameObjects.Sprite {
        return this.sprite;
    }

    public async move(direction: Directions) {
        return new Promise<void>(resolve => {
            const tween = {
                ...getTweenFromDirection(direction),
                targets: this.sprite,
                onInit: () => {
                    this.tilePosition = this.tilePosition.calculateOffset(direction);
                },
                onUpdate: () => {
                    this.sprite!.setDepth(this.sprite!.y + 1);
                },
                onComplete: () => {
                    resolve();
                }
            };
            this.tweens.add(tween);
        });

    }

    public getTileCode(): TileCodes {
        return TileCodes.box;
    }
}