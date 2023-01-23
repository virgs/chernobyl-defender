import Phaser from 'phaser';
import type {SceneConfig} from '@/game/game';
import {sounds} from '@/game/constants/sounds';
import type {GameStage} from '@/game/engine/game-stage';
import {InputManager} from '@/game/input/input-manager';
import {configuration} from '../constants/configuration';
import {GameStageCreator} from '../actors/game-stage-creator';
import {ScreenPropertiesCalculator} from '@/game/math/screen-properties-calculator';
import {SessionStore} from '@/store/session-store';

export class GameScene extends Phaser.Scene {
    private allowUpdates?: boolean;
    private gameStage?: GameStage;
    private initialTime?: number;
    private router: any;
    private sceneConfig?: SceneConfig;

    constructor() {
        super('game');
    }

    public init() {
    }

    public preload() {
        this.load.image(configuration.floorTextureKey, configuration.floorTexture);
//        this.load.json('characters', './assets/images/characters.json');

        //on actor
        //        Object.keys(this.map.animations)
        //              .forEach((animation: string) => this.sprite.anims.load('mole-' + animation));
        //        this.map = scene.cache.json.get('characters');
        //        this.sprite.anims.play(`${this.characterConfig.name}-hit`)
        //             .once('animationcomplete', () => {
        //                 this.hole.setAvailable();
        //                 this.destroy();
        //             });
        //     }

        //        this.sprite.anims.play(`${this.characterConfig.name}-raise`)
        //             .once('animationcomplete', () => {
        //                 this.sprite.anims.play(`${this.characterConfig.name}-alive`);
        //             })

        //           this.sprite.anims.play(`${this.characterConfig.name}-hit`)
        //                     .once('animationcomplete', () => {
        //                         this.hole.setAvailable();
        //                         this.destroy();
        //                     });

        //anim config
        //{name: 'mole', events: {hit: Events.MOLE_HIT, miss: Events.MOLE_MISS}}
        //{name: 'rabbit', events: {hit: Events.RABBIT_HIT, miss: Events.RABBIT_MISS}}
        //{name: 'star', events: {hit: Events.STAR_HIT, miss: Events.STAR_MISS}}

        this.load.spritesheet({
            key: configuration.tiles.spriteSheetKey,
            url: configuration.tiles.sheetAsset,
            normalMap: configuration.tiles.sheetAssetNormal,
            frameConfig: {
                frameWidth: configuration.tiles.horizontalSize,
                frameHeight: configuration.tiles.verticalSize
            }
        });
        Object.keys(sounds)
            .forEach(item => {
                const sound = sounds[item];
                this.load.audio(sound.key, sound.resource);
            });
        this.allowUpdates = true;
    }

    public async create(data: { router: any, config: SceneConfig }) {
        this.sceneConfig = data.config;
        this.router = data.router;

        const screenPropertiesCalculator = new ScreenPropertiesCalculator(data.config.strippedLayeredTileMatrix!);
        const scale = screenPropertiesCalculator
            .getScale();
        configuration.world.tileSize.horizontal = Math.trunc(configuration.tiles.horizontalSize * scale);
        configuration.world.tileSize.vertical = Math.trunc(Math.trunc(configuration.tiles.verticalSize * configuration.tiles.verticalPerspective) * scale);
        configuration.world.scale = scale;

        this.lights.enable()
            .setAmbientColor(Phaser.Display.Color.HexStringToColor(configuration.colors.ambientColor).color);

        const gameStageCreator = new GameStageCreator({
            screenPropertiesCalculator: screenPropertiesCalculator,
            scene: this,
            dynamicFeatures: data.config.dynamicFeatures,
            strippedTileMatrix: data.config.strippedLayeredTileMatrix!,
        });
        this.gameStage = gameStageCreator.createGameStage();

        if (this.sceneConfig.playable) {
            new InputManager().init(this);
            this.gameStage.setInitialPlayerActions(data.config.playerInitialActions);
            this.initialTime = new Date().getTime();
        } else {
            this.input.keyboard.clearCaptures();
        }

        this.game.renderer.snapshot(image => {
            const MIME_TYPE = "image/png";
            // @ts-ignore
            const imgURL = image.src;
            const a = document.createElement("a");
            a.href = imgURL;
            a.download = data.config.level.title.toLowerCase().replace(/ /g, '-').concat('.png');
            console.log('snapshot of level: ' + a.download);
            a.dataset.downloadurl = [MIME_TYPE, a.download, a.href].join(':');
            // a.click();
            document.body.appendChild(a);
            setTimeout(function () {
                document.body.removeChild(a);
                window.URL.revokeObjectURL(imgURL);
            }, 0);
        });
    }

    public async update(time: number, delta: number): Promise<void> {
        if (this.sceneConfig?.playable) {
            if (this.allowUpdates) {
                await this.gameStage!.update();
                if (this.gameStage!.isLevelComplete()) {
                    this.sound.play(sounds.victory.key, {volume: 0.5});
                    this.allowUpdates = false;
                    setTimeout(async () => {
                        this.changeScene();
                    }, 1500);
                }
            }
        }
    }

    private changeScene() {
        this.lights.destroy();
        SessionStore.setNextLevelViewConfig({
            movesCode: this.gameStage!.getPlayerMoves(),
            isCustomLevel: this.sceneConfig!.isCustomLevel,
            level: this.sceneConfig?.level!,
            display: this.sceneConfig?.displayNumber!,
            totalTime: new Date().getTime() - this.initialTime!
        });
        console.log('level complete');
        this.router.push('/next-level');
    }

}
