import type {Point} from '@/game/math/point';
import type {MovementOrchestratorOutput} from '@/game/engine/movement-orchestrator';
import type {MultiLayeredMap, OrientedTile} from '@/game/tiles/standard-sokoban-annotation-translator';

export abstract class DeadLockDetector {
    protected staticMap: MultiLayeredMap;

    constructor(config: { strippedStaticMapMap: MultiLayeredMap }) {
        this.staticMap = config.strippedStaticMapMap;
    }

    abstract deadLocked(movement: MovementOrchestratorOutput): boolean;

    protected getStaticFeaturesAtPosition(position: Point): OrientedTile[] {
        if (position.x < this.staticMap.width && position.y < this.staticMap.height
            && position.x >= 0 && position.y >= 0) {
            return this.staticMap.strippedFeatureLayeredMatrix[position.y][position.x];
        }
        return [];
    }

}