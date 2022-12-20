import Phaser from 'phaser';
import {Scenes} from './scenes';
import {Hero} from '../actors/hero';
import {Point} from '../math/point';
import {TileCode} from '../tiles/tile-code';
import {Actions} from '../constants/actions';
import {Directions} from '../constants/directions';
import {SokobanSolver} from '../math/sokoban-solver';
import {getTweenFromDirection} from '../actors/tween';
import {NextLevelSceneInput} from './next-level-scene';
import {configuration} from '../constants/configuration';
import {createIndefiniteProgressBar} from '../ui/htmlElements';
import {MapFeaturesExtractor} from '../tiles/map-features-extractor';
import {MovementCoordinator, MovementCoordinatorOutput} from '../actors/movement-coordinator';

export type GameSceneConfiguration = {
    map: TileCode[][],
    moves: Actions[]
    currentLevel: number,
    bestMoves: number
};

export class GameScene extends Phaser.Scene {
    private readonly mapFeaturesExtractor: MapFeaturesExtractor;

    private mapLayer: Phaser.Tilemaps.TilemapLayer;
    private timeLabel: Phaser.GameObjects.Text;
    private movementCoordinator: MovementCoordinator;

    private hero: Hero;
    private featuresMap: Map<TileCode, Phaser.GameObjects.Sprite[]>;
    private gameSceneConfiguration: GameSceneConfiguration;
    private levelComplete: boolean;
    private solution: Actions[];
    private allowHeroMovement: boolean;
    private playerMovesSoFar: Actions[];
    private elapsedTime: number;

    constructor() {
        super(Scenes[Scenes.GAME]);
        this.mapFeaturesExtractor = new MapFeaturesExtractor();
    }

    public init(gameSceneConfiguration: GameSceneConfiguration) {
        this.levelComplete = false;
        this.gameSceneConfiguration = gameSceneConfiguration;
        this.playerMovesSoFar = [];
        this.elapsedTime = 0;
    }

    public preload() {
        this.load.spritesheet(configuration.spriteSheetKey, configuration.tileSheetAsset, {
            frameWidth: configuration.horizontalTileSize,
            startFrame: 0
        });
    }

    public async create(input: GameSceneConfiguration) {
        //https://medium.com/@michaelwesthadley/modular-game-worlds-in-phaser-3-tilemaps-1-958fc7e6bbd6
        const map = this.make.tilemap({
            data: input.map,
            tileWidth: configuration.horizontalTileSize,
            tileHeight: configuration.verticalTileSize
        });
        const tilesetImage = map.addTilesetImage(configuration.spriteSheetKey);
        this.mapLayer = map.createLayer(0, tilesetImage);

        const mapFeaturesExtractor = new MapFeaturesExtractor();
        this.featuresMap = mapFeaturesExtractor.extractFeatures(this.mapLayer);
        //TODO check if map is valid. number of heroes = 1, number of box = targets, if it's solvable?...
        // console.log(this.featuresMap);

        //TODO move this to its own specific GameActor class
        [...this.featuresMap.get(TileCode.target),
            ...this.featuresMap.get(TileCode.empty),
            ...this.featuresMap.get(TileCode.floor)]
            .forEach(item => item.setDepth(0));

        this.hero = new Hero();
        this.hero.init({
            scene: this,
            sprite: this.featuresMap.get(TileCode.hero)[0]
        });
        this.movementCoordinator = new MovementCoordinator();
        this.timeLabel = this.add.text(540, 10, `Time: ${this.elapsedTime}s`, {
            fontFamily: 'Poppins',
            fontSize: '30px'
        });

        const loading = this.add.dom(configuration.gameWidth * 0.5, configuration.gameHeight * 0.25, createIndefiniteProgressBar())
            .setOrigin(0.5);
        this.solution = input.moves;
        console.log(input.currentLevel)
        // this.solution = await new SokobanSolver().solve(this.createMapState());
        loading.removeElement();
        this.allowHeroMovement = true;
    }

    public async update(time: number, delta: number) {
        if (this.levelComplete) {
            return;
        }
        this.elapsedTime += delta;
        this.timeLabel.text = `Time: ${Math.trunc(this.elapsedTime / 100) / 10}s`;

        if (this.allowHeroMovement) {
            let heroAction: Actions = this.hero.checkAction();
            if (this.solution && this.solution.length > 0) {
                heroAction = this.solution.shift();

            }
            this.playerMovesSoFar.push(heroAction);

            const mapState = this.createMapState();
            const movementCoordinatorOutput = this.movementCoordinator.update({
                heroAction: heroAction,
                mapState: mapState
            });
            if (movementCoordinatorOutput.mapChanged) {
                this.allowHeroMovement = false;
                await this.moveMapFeatures(movementCoordinatorOutput);
            }
        }
    }

    private async moveMapFeatures(movementCoordinatorOutput: MovementCoordinatorOutput) {
        const boxMovements = movementCoordinatorOutput.featuresMovementMap.get(TileCode.box)
            .map(async movedBox => {
                const worldXY = this.mapLayer.tileToWorldXY(movedBox.currentPosition.x, movedBox.currentPosition.y);
                const boxToMove = this.featuresMap
                    .get(TileCode.box)
                    .find(worldBox => worldBox.x === worldXY.x && worldBox.y === worldXY.y);
                await this.moveBox(boxToMove, movedBox.direction);
                this.onBoxesMovementComplete();
            });
        const playerMovement = movementCoordinatorOutput.featuresMovementMap.get(TileCode.hero)
            .map(async heroMovement => {
                await this.hero.move(heroMovement.direction);
                this.allowHeroMovement = true;
            });
        await Promise.all([playerMovement, boxMovements]);
    }

    private createMapState(): Map<TileCode, Point[]> {
        const mapState: Map<TileCode, Point[]> = new Map<TileCode, Point[]>();
        for (let [key, value] of this.featuresMap) {
            mapState.set(key, value
                .map(sprite => this.mapLayer.worldToTileXY(sprite.x, sprite.y)));
        }
        return mapState;
    }

    public async moveBox(box: Phaser.GameObjects.Sprite, direction: Directions): Promise<void> {
        return new Promise<void>(resolve => {
            const tween = {
                ...getTweenFromDirection(direction),
                targets: box,
                onComplete: () => resolve(),
                onCompleteScope: this
            };
            this.addTween(tween);
        });
    }

    private onBoxesMovementComplete(): void {
        this.updateBoxesColor();
        this.checkLevelComplete();
    }

    private updateBoxesColor() {
        this.featuresMap
            .get(TileCode.box)
            .forEach(box => {
                const boxPosition = this.mapLayer.worldToTileXY(box.x, box.y);
                if (this.featuresMap
                    .get(TileCode.target)
                    .some(target => {
                        const targetPosition = this.mapLayer.worldToTileXY(target.x, target.y);
                        return boxPosition.x === targetPosition.x && boxPosition.y === targetPosition.y;
                    })) {
                    box.setFrame(TileCode.boxOnTarget);
                } else {
                    box.setFrame(TileCode.box);
                }
            });
    }

    private checkLevelComplete() {
        if (this.featuresMap.get(TileCode.box)
            .every(box => {
                const boxTilePosition = this.mapLayer.worldToTileXY(box.x, box.y);
                return this.featuresMap.get(TileCode.target)
                    .some(target => {
                        const targetTilePosition = this.mapLayer.worldToTileXY(target.x, target.y);
                        return targetTilePosition.x === boxTilePosition.x &&
                            targetTilePosition.y === boxTilePosition.y;
                    });
            })) {
            this.levelComplete = true;
            console.log('currentLevel complete');
            setTimeout(() => {
                const input: NextLevelSceneInput = {
                    currentLevel: this.gameSceneConfiguration.currentLevel,
                    moves: this.playerMovesSoFar,
                    totalTime: this.elapsedTime
                };
                this.scene.start(Scenes[Scenes.NEXT_LEVEL], input);
            }, 1500);
        }
    }

    public addTween(tween: Phaser.Types.Tweens.TweenBuilderConfig) {
        this.tweens.add(tween);
    }
}
