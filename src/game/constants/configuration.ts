import tilesheet0 from '@/game/assets/levels/level-0.json';
import tilesheet1 from '@/game/assets/levels/level-0.json';
import tileSheetAsset from '@/game/assets/tiles/sokoban_tilesheet.png';
import tileSheetAssetNormal from '@/game/assets/tiles/sokoban_tilessheet_normal.png';

const verticalPerspective = .8;
const tileHeight = 40;
const tileWidth = 40;
export const configuration = {
    frameRate: 10,
    updateCycleInMs: 200,
    tiles: { //in tile sheet
        verticalPerspective: verticalPerspective,
        verticalSize: tileHeight,
        horizontalSize: tileWidth,
        spriteSheetKey: 'tiles',
        tilesheets: [tilesheet0, tilesheet1],
        sheetAsset: tileSheetAsset,
        sheetAssetNormal: tileSheetAssetNormal,
        tilemapKey: 'tilemap',
        layerName: 'Level',
        tilesetName: 'sokoban',
    },
    world: {
        tileSize: { //after rescaling...
            vertical: Math.trunc(tileHeight * verticalPerspective),
            horizontal: tileWidth
        },
    },
    screenRatio: .75,
    gameWidth: 800,
    gameHeight: 600,
    colors: {
        foregroundColor: '#d6d6d6',
        highlight: '#d4fa00',
        background: '#dddddd'
    },
    html: {
        gameScene: {
        }
    }

};