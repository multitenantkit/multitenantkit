export class DeterministicUuid {
    private counter = 0;

    public generate(): string {
        this.counter++;
        const paddedCounter = this.counter.toString().padStart(8, '0');
        return `${paddedCounter}-0000-4000-8000-${paddedCounter}0000`;
    }

    public reset(): void {
        this.counter = 0;
    }
}
