export class valueTracker {
    values: Record<string, { value: boolean, retentionSteps: number }> = {}
    nextDivision: number | null = null

    setValue(item: string, steps = 0) {
        if (!this.values[item]) this.values[item] = {value: true, retentionSteps: steps}
        else {
            this.values[item].value = true
            this.values[item].retentionSteps = steps
        }
    }

    getValue(item: string) {
        let valueToReturn = false
        if (!this.values[item]) return false
        if (this.values[item].retentionSteps == 0) {
            valueToReturn = this.values[item].value
            this.values[item].value = false
            return valueToReturn
        } else this.values[item].retentionSteps--
        return this.values[item].value
    }

    setNextDivision(value: number) {
        this.nextDivision = value
    }

    getNextDivision() {
        const valueToReturn = this.nextDivision
        this.nextDivision = null
        return valueToReturn
    }

}
