import {Tiles} from '@/game/tiles/tiles';
import type {Point} from '@/game/math/point';
import {Directions} from '@/game/constants/directions';
import {DeadLockDetector} from '@/game/solver/dead-lock-detector';
import type {Movement, MovementOrchestratorOutput} from '@/game/engine/movement-orchestrator';

type SegmentAnalysis = { differentBoxes: number; empties: number; targets: number };

export class BoxGluedToWallDetector extends DeadLockDetector {
    public deadLocked(movement: MovementOrchestratorOutput): boolean {
        return movement.boxes
            .filter(box => box.currentPosition.isDifferentOf(box.nextPosition))
            .some(movedBox => this.boxIsDeadLocked(movedBox, movement.boxes));
    }

    private boxIsDeadLocked(movedBox: Movement, moves: Movement[]) {
        const direction = movedBox.direction!;
        const nextTilePosition = movedBox.nextPosition.calculateOffset(direction);
        if (this.staticMap.strippedFeatureLayeredMatrix[nextTilePosition.y][nextTilePosition.x]
            .some(tile => tile.code === Tiles.wall)) {
            if (this.wallAheadCheck(direction, movedBox, nextTilePosition, moves)) {
                return true;
            }
        }
        return false;
    }

    private wallAheadCheck(moveDirection: Directions, movedBox: Movement, nextTilePosition: Point, boxes: Movement[]) {
        let segment: SegmentAnalysis;
        if (moveDirection === Directions.DOWN || moveDirection === Directions.UP) {
            segment = this.verticalLineSegment(movedBox.nextPosition, nextTilePosition, boxes);
        } else {
            segment = this.horizontalLineSegment(movedBox.nextPosition, nextTilePosition, boxes);
        }
        if (segment.differentBoxes > segment.targets && segment.empties < 2) {
            // console.log('segment.differentBoxes > segment.targets && segment.empties < 2');
            // console.log(segment.differentBoxes, segment.targets, segment.empties);
            // console.log('deadlocked: no way to get it back and no available targets');
            return true;
        }
        return false;
    }

    private verticalLineSegment(tilePosition: Point, nextTilePosition: Point, boxes: Movement[]): SegmentAnalysis {
        //        player pushed down (or up)
        //  #     @     #
        //  #     $     #
        //  #############

        let empties = 0;
        let targets = 0;
        for (let x = 0; x < this.staticMap.width; ++x) {
            const currentLineTiles = this.staticMap.strippedFeatureLayeredMatrix[tilePosition.y][x];
            if (currentLineTiles
                .some(tile => tile.code === Tiles.target)) {
                ++targets;
            }
            const nextLineTiles = this.staticMap.strippedFeatureLayeredMatrix[nextTilePosition.y][x];
            if (nextLineTiles
                .some(tile => tile.code !== Tiles.wall && tile.code !== Tiles.empty)) {
                ++empties;
            }
        }
        const differentBoxes = boxes
            .filter(box => box.nextPosition.y === tilePosition.y)
            .reduce((acc, _) => acc + 1, 0);
        return {empties, targets, differentBoxes};
    }

    private horizontalLineSegment(tilePosition: Point, nextTilePosition: Point, boxes: Movement[]): SegmentAnalysis {
        //  ###      player pushed left (or right)
        //  #
        //  #$@
        //  #
        //  # ##
        let empties = 0;
        let targets = 0;
        for (let y = 0; y < this.staticMap.height; ++y) {
            const currentColumnTiles = this.staticMap.strippedFeatureLayeredMatrix[y][tilePosition.x];
            if (currentColumnTiles
                .some(tile => tile.code === Tiles.target)) {
                ++targets;
            }

            const nextColumnTiles = this.staticMap.strippedFeatureLayeredMatrix[y][nextTilePosition.x];
            if (nextColumnTiles
                .some(tile => tile.code !== Tiles.wall && tile.code !== Tiles.empty)
            ) {
                ++empties;
            }
        }

        const differentBoxes = boxes
            .filter(box => box.nextPosition.x === tilePosition.x)
            .reduce((acc, _) => acc + 1, 0);
        return {empties, targets, differentBoxes};
    }
}