import {Tiles} from './tiles';
import {Point} from '@/game/math/point';
import {BoxActor} from '@/game/actors/box-actor';
import {HeroActor} from '@/game/actors/hero-actor';
import {TargetActor} from '@/game/actors/target-actor';
import type {GameActor} from '@/game/actors/game-actor';
import {configuration} from '../constants/configuration';
import {OilyFloorActor} from '@/game/actors/oily-floor-actor';
import {OneWayDoorActor} from '@/game/actors/one-way-door-actor';
import {TileDepthCalculator} from '@/game/tiles/tile-depth-calculator';
import type {MultiLayeredMap, OrientedTile} from '@/game/tiles/standard-sokoban-annotation-translator';
import Phaser from 'phaser';

export class GameActorsCreator {
    private readonly scale: number;
    private readonly scene: Phaser.Scene;
    private readonly constructorMap: Map<Tiles, (params: any) => GameActor>;

    private readonly floorPic: Phaser.GameObjects.Sprite;
    private readonly floorMaskShape: Phaser.GameObjects.Graphics;
    private readonly dynamicFeatures: Map<Tiles, Point[]>;
    private readonly matrix: MultiLayeredMap;
    private readonly actorMap: Map<Tiles, GameActor[]>;

    private actorCounter: number;

    constructor(config: { scale: number; matrix: MultiLayeredMap; scene: Phaser.Scene; dynamicFeatures: Map<Tiles, Point[]> }) {
        this.scene = config.scene;
        this.scale = config.scale;
        this.dynamicFeatures = config.dynamicFeatures;
        this.matrix = config.matrix;
        this.actorMap = GameActorsCreator.initializeActorMap();

        this.actorCounter = 0;

        this.constructorMap = new Map<Tiles, (params: any) => GameActor>();
        this.constructorMap.set(Tiles.hero, params => new HeroActor(params));
        this.constructorMap.set(Tiles.box, params => new BoxActor(params));
        this.constructorMap.set(Tiles.target, params => new TargetActor(params));
        this.constructorMap.set(Tiles.oily, params => new OilyFloorActor(params));
        this.constructorMap.set(Tiles.oneWayDoor, params => new OneWayDoorActor(params));

        this.floorMaskShape = this.scene.make.graphics({});
        this.floorPic = this.scene.add.sprite(0, 0, configuration.floorTextureKey);
        this.floorPic.scale = 2 * configuration.gameWidth / this.floorPic.width;
        this.floorPic.setPipeline('Light2D');
        this.floorPic.setDepth(new TileDepthCalculator().calculate(Tiles.floor, -10));
    }

    public create(): Map<Tiles, GameActor[]> {
        this.dynamicFeatures
            .forEach((value, key) =>
                value
                    .forEach(tilePosition => this.createActor(tilePosition, {code: key})));

        this.matrix.layeredTileMatrix
            .forEach((line, y) => line
                .forEach((layers: OrientedTile[], x: number) => layers
                    .forEach(item => {
                        const tilePosition = new Point(x, y);
                        if (item.code === Tiles.floor) {
                            this.createFloorMask(tilePosition);
                        } else {
                            this.createActor(tilePosition, item);
                        }

                    })));

        const mask = this.floorMaskShape.createGeometryMask();
        // mask.invertAlpha = true
        this.floorPic!.setMask(mask);

        return this.actorMap;
    }

    private createActor(tilePosition: Point, item: OrientedTile) {
        const sprite = this.createSprite(tilePosition, item.code);
        if (this.constructorMap.get(item.code)) {
            const gameActor = this.constructorMap.get(item.code)!({
                scene: this.scene,
                sprite: sprite,
                tilePosition: tilePosition,
                id: this.actorCounter++
            });
            this.actorMap.get(item.code)!.push(gameActor);
        }
    }

    private createSprite(point: Point, tile: Tiles): Phaser.GameObjects.Sprite {
        const sprite = this.scene.add.sprite(point.x * configuration.world.tileSize.horizontal,
            point.y * configuration.world.tileSize.vertical,
            configuration.tiles.spriteSheetKey, tile);
        sprite.scale = this.scale;
        sprite.setOrigin(0);
        sprite.setDepth(new TileDepthCalculator().calculate(tile, sprite.y));
        sprite.setPipeline('Light2D');
        return sprite;
    }

    private createFloorMask(point: Point) {
        // this.floorMaskShape.fillStyle(0xFFFFFF);
        this.floorMaskShape.beginPath();
        this.floorMaskShape.fillRectShape(new Phaser.Geom.Rectangle(
            (point.x * configuration.world.tileSize.horizontal),
            (point.y * configuration.world.tileSize.vertical),
            configuration.world.tileSize.horizontal, configuration.world.tileSize.vertical));
    }

    private static initializeActorMap() {
        const indexedMap: Map<Tiles, GameActor[]> = new Map<Tiles, GameActor[]>();
        Object.keys(Tiles)
            .filter(key => !isNaN(Number(key)))
            .map(key => Number(key) as Tiles)
            .forEach(code => indexedMap.set(code, []));
        return indexedMap;
    }

}