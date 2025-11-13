import { ClockPort } from '../../src/shared/ports/ClockPort';

/**
 * Mock implementation of ClockPort for testing
 * Allows controlling time for deterministic tests
 */
export class MockClockPort implements ClockPort {
    private currentTime: Date;

    constructor(initialTime: Date = new Date()) {
        this.currentTime = initialTime;
    }

    now(): Date {
        return new Date(this.currentTime);
    }

    setCurrentTime(time: Date): void {
        this.currentTime = time;
    }

    advanceTime(milliseconds: number): void {
        this.currentTime = new Date(this.currentTime.getTime() + milliseconds);
    }

    advanceTimeBy(options: {
        years?: number;
        months?: number;
        days?: number;
        hours?: number;
        minutes?: number;
        seconds?: number;
        milliseconds?: number;
    }): void {
        const {
            years = 0,
            months = 0,
            days = 0,
            hours = 0,
            minutes = 0,
            seconds = 0,
            milliseconds = 0
        } = options;

        const newTime = new Date(this.currentTime);
        newTime.setFullYear(newTime.getFullYear() + years);
        newTime.setMonth(newTime.getMonth() + months);
        newTime.setDate(newTime.getDate() + days);
        newTime.setHours(newTime.getHours() + hours);
        newTime.setMinutes(newTime.getMinutes() + minutes);
        newTime.setSeconds(newTime.getSeconds() + seconds);
        newTime.setMilliseconds(newTime.getMilliseconds() + milliseconds);

        this.currentTime = newTime;
    }
}
