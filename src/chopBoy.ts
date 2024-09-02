import * as Tone from "tone";
import {valueTracker} from "./valueTracker";

export class chopBoy {
    constructor(ordinal: number, valueTracker: valueTracker, divLength: number) {
        this.ordinal = ordinal;
        this.tracker = valueTracker;
        this.chop = new Tone.Player("./cw_amen02_165.wav", () => {
            this.chop.stop();
        }).toDestination();
        this.startTime = ordinal * divLength;
    }

    public play(time: Tone.Unit.Time, divLength: number, divisions: number, sequence: Tone.Sequence, chops: chopBoy[]) {
        this.chop.reverse = this.tracker.getValue('reverse');
        const thisDivLength = this.tracker.getValue('gate') ? divLength / 2 : divLength;
        this.chop.start(time, this.startTime, thisDivLength);
        if (this.tracker.getValue('frozen')) {
            return
        } else sequence.events.push(this.tracker.getNextDivision() || this.getNext(divisions, chops).ordinal);
        sequence.events.shift()
    }

    private getNext(divisions: number, chops: chopBoy[]) {
        return chops[(this.ordinal + 1) % divisions];
    }

    chop: Tone.Player;
    ordinal: number
    startTime: number
    tracker: valueTracker
}
