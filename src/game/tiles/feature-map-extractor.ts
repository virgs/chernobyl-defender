import {Tiles} from './tiles';
import type Phaser from 'phaser';
import {Point} from '@/game/math/point';
import {BoxActor} from '@/game/actors/box-actor';
import {HeroActor} from '@/game/actors/hero-actor';
import {TargetActor} from '@/game/actors/target-actor';
import {SpringActor} from '@/game/actors/spring-actor';
import type {GameActor} from '@/game/actors/game-actor';
import {configuration} from '../constants/configuration';
import {OilyFloorActor} from '@/game/actors/oily-floor-actor';
import {TileDepthCalculator} from '@/game/tiles/tile-depth-calculator';
import type {OrientedTile, StaticMap} from '@/game/tiles/standard-sokoban-annotation-translator';
import {OneWayDoorActor} from '@/game/actors/one-way-door-actor';

export type TileMap = {
    staticMap: StaticMap;
    boxes: BoxActor[];
    hero: HeroActor;
    springs: SpringActor[];
    targets: TargetActor[];
    oilyFloors: OilyFloorActor[];
    oneWayDoors: OneWayDoorActor[];
};

export class FeatureMapExtractor {
    private readonly scale: number;
    private readonly scene: Phaser.Scene;
    private readonly featurelessMap: StaticMap;
    private actorCounter: number;

    constructor(scene: Phaser.Scene, scale: number, map: StaticMap) {
        this.scene = scene;
        this.scale = scale;
        this.featurelessMap = map;
        this.featurelessMap.tiles = JSON.parse(JSON.stringify(map.tiles)) as OrientedTile[][];
        this.actorCounter = 0;
    }

    public extract(): TileMap {
        const hero = this.extractHero()!;
        const boxes = this.extractBoxes();
        const targets = this.detectFeature(Tiles.target, boxes, (params) => new TargetActor(params)) as TargetActor[];
        const springs = this.detectFeature(Tiles.spring, boxes, (params) => new SpringActor(params)) as SpringActor[];
        const oilyFloors = this.detectFeature(Tiles.oily, boxes, (params) => new OilyFloorActor(params)) as OilyFloorActor[];
        const oneWayDoors = this.detectFeature(Tiles.oneWayDoor, boxes, (params) => new OneWayDoorActor(params)) as OneWayDoorActor[];

        this.addFloors([...targets, ...springs, ...oilyFloors, ...oneWayDoors] as GameActor[]);

        const featurelessMap: StaticMap = {
            tiles: this.featurelessMap.tiles,
            width: this.featurelessMap.width,
            height: this.featurelessMap.height
        };
        return {
            staticMap: featurelessMap,
            hero: hero,
            boxes: boxes,
            targets: targets,
            springs: springs,
            oilyFloors: oilyFloors,
            oneWayDoors: oneWayDoors
        };

    }

    private extractHero(): HeroActor | undefined {
        let hero: HeroActor | undefined = undefined;
        this.featurelessMap.tiles = this.featurelessMap.tiles
            .map((line, y) => line
                .map((tile: OrientedTile, x: number) => {
                    if (tile.code === Tiles.hero || tile.code === Tiles.heroOnTarget) {
                        const tilePosition = new Point(x, y);
                        const heroSprite = this.createSprite(tilePosition, Tiles.hero);
                        hero = new HeroActor({scene: this.scene, sprite: heroSprite, tilePosition: tilePosition, id: this.actorCounter++});
                        return {
                            code: tile.code === Tiles.hero ? Tiles.floor : Tiles.target,
                            orientation: tile.orientation
                        };
                    }
                    return tile;
                }));
        return hero;
    }

    private extractBoxes(): BoxActor[] {
        const boxes: BoxActor[] = [];
        this.featurelessMap.tiles = this.featurelessMap.tiles
            .map((line, y) => line
                .map((tile: OrientedTile, x: number) => {
                    if (tile.code === Tiles.box || tile.code === Tiles.boxOnTarget) {
                        const tilePosition = new Point(x, y);
                        const sprite = this.createSprite(tilePosition, Tiles.box);
                        boxes.push(new BoxActor({scene: this.scene, sprite: sprite, tilePosition: tilePosition, id: this.actorCounter++}));
                        return {
                            code: tile.code === Tiles.box ? Tiles.floor : Tiles.target,
                            orientation: tile.orientation
                        };
                    }
                    return tile;
                }));
        return boxes;
    }

    private detectTargets(boxes: BoxActor[]): TargetActor[] {
        const targets: TargetActor[] = [];
        this.featurelessMap.tiles = this.featurelessMap.tiles
            .map((line, y) => line
                .map((tile: OrientedTile, x: number) => {
                    if (tile.code === Tiles.target) {
                        const tilePosition = new Point(x, y);
                        const sprite = this.createSprite(tilePosition, Tiles.target);
                        const target = new TargetActor({
                            scene: this.scene,
                            sprite: sprite,
                            tilePosition: tilePosition,
                            boxes: boxes,
                            id: this.actorCounter++
                        });
                        targets.push(target);
                    }
                    return tile;
                }));
        return targets;
    }

    private detectFeature(tileCode: Tiles, boxes: BoxActor[], constructorFunction: (params: any) => GameActor) {
        const features: GameActor[] = [];
        this.featurelessMap.tiles = this.featurelessMap.tiles
            .map((line, y) => line
                .map((tile: OrientedTile, x: number) => {
                    if (tile.code === tileCode) {
                        const tilePosition = new Point(x, y);
                        const sprite = this.createSprite(tilePosition, tileCode);
                        const spring = constructorFunction({
                            scene: this.scene,
                            sprite: sprite,
                            tilePosition: tilePosition,
                            boxes: boxes,
                            orientation: tile.orientation!,
                            id: this.actorCounter++
                        });
                        features.push(spring);
                    }
                    return tile;
                }));
        return features;
    }

    private createSprite(point: Point, tile: Tiles): Phaser.GameObjects.Sprite {
        const sprite = this.scene.add.sprite(point.x * configuration.world.tileSize.horizontal + configuration.world.screenAdjustment.horizontal,
            point.y * configuration.world.tileSize.vertical + configuration.world.screenAdjustment.vertical,
            configuration.tiles.spriteSheetKey, tile);
        sprite.scale = this.scale;
        sprite.setOrigin(0.5);
        sprite.setDepth(new TileDepthCalculator().calculate(tile, sprite.y));
        sprite.setPipeline('Light2D');
        return sprite;
    }

    private addFloors(staticActors: GameActor[]) {
        const staticActorsCode = this.addRemainingFloors(staticActors);

        //Every floor in the map
        this.featurelessMap.tiles
            .forEach((line, y) => line
                .forEach((tile: OrientedTile, x: number) => {
                    if (!staticActorsCode.has(tile.code)) {//it was created in the staticActors loop
                        const tilePosition = new Point(x, y);
                        this.createSprite(tilePosition, tile.code);
                    }
                }));
    }

    private addRemainingFloors(staticActors: GameActor[]): Set<Tiles> {
        const staticActorsCode: Set<Tiles> = new Set<Tiles>();
        //(targets and stuff).. those that hide floors behind them
        staticActors
            .forEach(actor => {
                staticActorsCode.add(actor.getTileCode());
                this.createSprite(actor.getTilePosition(), Tiles.floor);
            });
        return staticActorsCode;
    }
}