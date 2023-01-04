import {Point} from '@/game/math/point';
import {Tiles} from '@/game/tiles/tiles';
import type {Directions} from '@/game/constants/directions';
import type {ActData, FeatureMovementHandler} from '@/game/engine/feature-movement-handler';
import type {Movement, MovementOrchestrator, OrientedPoint} from '@/game/engine/movement-orchestrator';
import {Actions, mapActionToDirection} from '@/game/constants/actions';

export class HeroMovementHandler implements FeatureMovementHandler {
    private readonly coordinator: MovementOrchestrator;
    private position: Point;

    constructor(config: { coordinator: MovementOrchestrator }) {
        this.coordinator = config.coordinator;
        this.position = new Point(0, 0);
    }

    public allowEnteringMovement(direction: Directions): boolean {
        return false;
    }

    public allowLeavingMovement(direction: Directions): boolean {
        return true;
    }

    public getTile(): Tiles {
        return Tiles.hero;
    }

    public getPosition(): Point {
        return this.position;
    }

    public act(actData: ActData): boolean {
        this.position = actData.hero.position;
        let mapChanged = false;

        if (actData.hero.action !== Actions.STAND) {
            const aimedDirection = mapActionToDirection(actData.hero.action)!;
            if (!this.coordinator.canFeatureLeavePosition({point: this.position, orientation: aimedDirection})) {
                return false;
            }
            const aimedPosition = actData.hero.position.calculateOffset(aimedDirection);
            const aimedMovement = {point: aimedPosition, orientation: aimedDirection};
            if (this.featureAheadAllowsMovement(aimedMovement, actData.boxes)) {
                mapChanged = true;
                this.coordinator.moveHero(aimedDirection);
                const movedBox = actData.boxes
                    .find((box: Movement) => box.nextPosition.isEqualTo(aimedPosition));
                if (movedBox) {
                    this.coordinator.moveFeature(movedBox, aimedDirection);
                }
            }
        }

        return mapChanged;
    }

    private featureAheadAllowsMovement(aimedMovement: OrientedPoint, boxes: Movement[]): boolean {
        if (!this.coordinator.canFeatureEnterPosition(aimedMovement)) { //it can be a box, check the next one too
            if (boxes
                .some(box => box.nextPosition.isEqualTo(aimedMovement.point))) { //there's a box
                //check if the box is in a position that allows moves
                if (!this.coordinator.canFeatureLeavePosition(aimedMovement)) {
                    return false;
                }
                //check the tile after the box
                const afterNextTilePosition = aimedMovement.point.calculateOffset(aimedMovement.orientation);
                return this.coordinator.canFeatureEnterPosition({point: afterNextTilePosition, orientation: aimedMovement.orientation});
            }
            return false;
        }
        return true;
    }

}