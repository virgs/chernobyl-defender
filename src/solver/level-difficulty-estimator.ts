import type {SolutionOutput} from '../solver/sokoban-solver';
import Phaser from 'phaser';
import {Actions} from '../constants/actions';
import {configuration} from '../constants/configuration';

type DifficultFactor = {
    value: number,
    weight: number, //0 to 1
}

export class LevelDifficultyEstimator {
    private readonly factors: ((solution: SolutionOutput) => DifficultFactor)[];

    constructor() {

        this.factors = [
            (solution: SolutionOutput) => ({
                value: this.getDifficulty(solution.actions!
                    .filter(action => action !== Actions.STAND)
                    .length, 200), weight: .15
            }),
            (solution: SolutionOutput) => ({value: this.getDifficulty(solution.boxesLine, 80), weight: .75}),
            (solution: SolutionOutput) => ({value: this.getDifficulty(solution.totalTime, 60000), weight: .25}),
            (solution: SolutionOutput) => ({value: this.getDifficulty(solution.iterations, 750000), weight: .35}),
        ];
    }

    //0 -> easy piece
    //100 -> nightmare
    //undefined -> impossible. literally
    public estimate(solution: SolutionOutput): number | undefined {
        // console.log(solution);
        if (!solution.actions) {
            return undefined;
        }
        const sums = this.factors.reduce((acc, factor) => {
            const difficultFactor = factor(solution);
            if (configuration.solver.debug.estimator) {
                console.log(difficultFactor);
            }
            return {
                value: acc.value + (difficultFactor.value * difficultFactor.weight),
                weight: acc.weight + difficultFactor.weight
            };
        }, {
            value: 0,
            weight: 0
        });
        const number = sums.value / sums.weight;
        return Phaser.Math.Clamp(number * 100, 0, 100);
    }

    private getDifficulty(value: number, max: number) {
        return Math.min(value / max, 1.25);
    }
}