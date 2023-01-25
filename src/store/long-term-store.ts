import type {Level} from '@/game/levels/levels';
import type {Actions} from '@/game/constants/actions';
import {configuration} from '@/game/constants/configuration';

type LevelCompleteData = {
    index: number,
    title: string,
    map: string,
    movesCode: Actions[],
    totalTime: number,
    timestamp: number
};

export class LongTermStore {
    public static getLevelCompleteData(): LevelCompleteData[] {
        const item = localStorage.getItem(configuration.store.resolvedLevelsKey);
        if (item) {
            return JSON.parse(item);
        }

        return [];
    }

    public static setLevelCompleteData(data: LevelCompleteData[]): void {
        localStorage.setItem(configuration.store.resolvedLevelsKey, JSON.stringify(data));
    }

    public static getCustomLevel(): Level | undefined {
        const item = localStorage.getItem(configuration.store.customLevelKey);
        if (item) {
            return JSON.parse(item);
        }
    }

    public static setCustomLevel(newCustom: Level): void {
        localStorage.setItem(configuration.store.customLevelKey, JSON.stringify(newCustom));
    }

    public static getCurrentSelectedIndex(): number {
        return Number(localStorage.getItem(configuration.store.currentSelectedIndexKey) || 0);
    }

    public static setCurrentSelectedIndex(currentIndex: number) {
        localStorage.setItem(configuration.store.currentSelectedIndexKey, currentIndex + '');
    }

    public static getNumberOfEnabledLevels(): number {
        const numberOfEnabledLevels = localStorage.getItem(configuration.store.numberOfEnabledLevelsKey);
        if (numberOfEnabledLevels === null) {
            LongTermStore.setNumberOfEnabledLevels(1);
            return 1;
        }
        return Number(numberOfEnabledLevels);
    }

    public static setNumberOfEnabledLevels(value: number) {
        localStorage.setItem(configuration.store.numberOfEnabledLevelsKey, value + '');
    }

}