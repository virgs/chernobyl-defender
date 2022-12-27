import type Phaser from 'phaser';
import {Box} from '@/game/actors/box';
import {TileCodes} from './tile-codes';
import {Point} from '@/game/math/point';
import {Hero} from '@/game/actors/hero';
import {configuration} from '../constants/configuration';
import type {ScaleOutput} from '@/game/math/screen-properties-calculator';
import type {Mapped} from '@/game/tiles/standard-sokoban-annotation-mapper';

const floorDepth = -1000;
const targetDepth = 0;

export class MapFeaturesExtractor {
    private readonly scale: number;
    private readonly scene: Phaser.Scene;

    constructor(scene: Phaser.Scene, scale: number) {
        this.scene = scene;
        this.scale = scale;
    }

    public extractFeatures(map: Mapped, scale: ScaleOutput): { staticMap: Phaser.GameObjects.Sprite[][], hero: Hero, boxes: Box[] } {
        const tiles = map.staticMap.tiles;
        return {
            staticMap: tiles.map((line, y) => line
                .map((tile: TileCodes, x: number) => {
                    const sprite = this.createSprite(new Point(x, y), tile, scale.scale);
                    if (tile === TileCodes.floor) {
                        sprite.setDepth(floorDepth);
                        //needed because target is not dynamic like a box (that creates its floor at the annotation extractor)
                    } else if (tile === TileCodes.target) {
                        const floorBehind = this.createSprite(new Point(x, y), TileCodes.floor, scale.scale);
                        floorBehind.setDepth(floorDepth);
                        sprite.setDepth(targetDepth);
                    }
                    return sprite;
                })),
            hero: new Hero({scene: this.scene, sprite: this.createSprite(map.hero!, TileCodes.hero, scale.scale), tilePosition: map.hero!}),
            boxes: map.boxes
                .map(box => {
                    //TODO add an id to each box
                    const boxActor = new Box({scene: this.scene, sprite: this.createSprite(box, TileCodes.box, scale.scale), tilePosition: box});
                    boxActor.setIsOnTarget(tiles[box.y][box.x] === TileCodes.target);
                    return boxActor;
                })
        };

    }

    private createSprite(point: Point, tile: TileCodes, scale: number): Phaser.GameObjects.Sprite {
        const sprite = this.scene.add.sprite(point.x * configuration.world.tileSize.horizontal,
            point.y * configuration.world.tileSize.vertical, configuration.spriteSheetKey, tile);
        sprite.scale = scale;
        sprite.setOrigin(0);
        sprite.setDepth(sprite.y);
        return sprite;
    }

}