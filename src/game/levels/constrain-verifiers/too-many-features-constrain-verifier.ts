import {Tiles} from '@/game/levels/tiles';
import {configuration} from '@/game/constants/configuration';
import type {ProcessedMap} from '@/game/levels/sokoban-map-stripper';
import type {OrientedTile} from '@/game/levels/standard-sokoban-annotation-tokennizer';
import type {MapConstrainVerifier} from '@/game/levels/constrain-verifiers/map-constrain-verifier';

export class TooManyFeaturesConstrainVerifier implements MapConstrainVerifier {
    public verify(output: ProcessedMap): void {
        let numberOfCoolFeatures = 0;
        output.raw.strippedFeatureLayeredMatrix
            .forEach((line) => line
                .forEach((tiles: OrientedTile[]) => {
                    if (tiles
                        .some(tile => tile.code !== Tiles.target &&
                            tile.code !== Tiles.floor &&
                            tile.code !== Tiles.wall &&
                            tile.code !== Tiles.empty)) {
                        ++numberOfCoolFeatures;
                    }
                }));
        const featuresLimit = configuration.world.mapLimits.features;
        if (numberOfCoolFeatures > featuresLimit) {
            throw Error(`For performance concerns, try to keep the number cool feature less than ${featuresLimit}.
                        Right now you have ${numberOfCoolFeatures}, I don't think your browser can handle it.`);
        }
    }
}