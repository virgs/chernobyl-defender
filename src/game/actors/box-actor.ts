import type Phaser from 'phaser';
import type {Point} from '@/game/math/point';
import {Tiles} from '@/game/tiles/tiles';
import type {Directions} from '@/game/constants/directions';
import {TileDepthCalculator} from '@/game/tiles/tile-depth-calculator';
import type {GameActor, GameActorConfig} from '@/game/actors/game-actor';
import {configuration} from '@/game/constants/configuration';
import type {ScreenPropertiesCalculator} from '@/game/math/screen-properties-calculator';
import {sounds} from '@/game/constants/sounds';

export class BoxActor implements GameActor {
    private tilePosition: Point;
    private isOnTarget: boolean;
    private readonly tweens: Phaser.Tweens.TweenManager;
    private readonly sprite: Phaser.GameObjects.Sprite;
    private readonly id: number;
    private readonly screenPropertiesCalculator: ScreenPropertiesCalculator;
    private readonly scene: Phaser.Scene;

    constructor(config: GameActorConfig) {
        this.screenPropertiesCalculator = config.screenPropertiesCalculator;
        this.id = config.id;
        this.scene = config.scene;
        this.tilePosition = config.tilePosition;
        this.tweens = config.scene.tweens;
        this.sprite = config.scene.add.sprite(config.worldPosition.x, config.worldPosition.y, configuration.tiles.spriteSheetKey, this.getTileCode());
        this.isOnTarget = false;
    }

    public getTilePosition() {
        return this.tilePosition;
    }

    public getSprite(): Phaser.GameObjects.Sprite {
        return this.sprite;
    }

    public getId(): number {
        return this.id;
    }

    public async animate(nextPosition: Point, direction?: Directions) {
        const spritePosition = this.screenPropertiesCalculator.getWorldPositionFromTilePosition(nextPosition);
        this.tilePosition = nextPosition;
        return new Promise<void>(resolve => {
            const tween = {
                x: spritePosition.x,
                y: spritePosition.y,
                duration: configuration.updateCycleInMs,
                targets: this.sprite,
                onInit: () => {
                },
                onUpdate: () => {
                    this.sprite!.setDepth(new TileDepthCalculator().calculate(Tiles.box, this.sprite.y + 1));
                },
                onComplete: () => {
                    resolve();
                }
            };
            this.tweens.add(tween);
        });

    }

    public getTileCode(): Tiles {
        return Tiles.box;
    }

    public getOrientation(): Directions | undefined {
        return undefined;
    }

    public isCovered(): boolean {
        return false;
    }

    public cover(actor: GameActor): void {
        if (actor.getTileCode() === Tiles.target) {
            this.sprite.setFrame(Tiles.boxOnTarget);
            this.isOnTarget = true;
                this.scene.sound.play(sounds.boxOnTarget.key, {volume: 0.5})
        }
    }

    public uncover(actor: GameActor): void {
        if (actor.getTileCode() === Tiles.target) {
            this.sprite.setFrame(Tiles.box);
            this.isOnTarget = false;
        }
    }

    public getIsOnTarget(): boolean {
        return this.isOnTarget;
    }
}