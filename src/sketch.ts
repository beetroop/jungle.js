import p5 from 'p5';
import * as Tone from 'tone';
import {valueTracker} from "./valueTracker";
import {chopBoy} from "./chopBoy"

const sketch = (p: p5) => {
    let controlButtons: p5.Element[] = [];
    let bottomRowLevel: number
    let mySound: Tone.Player
    let chops: chopBoy[] = [];
    const divisions: number = 16;
    let lastDiv: number | null = null;
    const segmentButtons: any[] = [];
    let speedSlider: p5.Element
    let padding: number;
    let buttonBaseSize: number
    let currentDivision: number = 0
    let divLength: number;
    let lastPressed: number;
    let rowHeight: number;
    let topBound: number;
    let bottomBound: number;
    let bawlz: ball[] = [];
    let bawlzReserve: ball[] = []
    let sliderLabel: p5.Element;
    let tracker: valueTracker
    let sequence: Tone.Sequence
    const baseSpeed = 165;
    let speedMultiplier = 1;
    let pendingRateChange = false;
    let canvas: p5.Element;
    const actualSpeed = () => Number((baseSpeed * speedMultiplier).toFixed(0))

    const getCanvasDimensions = function (): [number, number] {
        const width = p.min(p.windowWidth, 800);
        const height = 1.5 * width;
        return [width, height]
    }

    p.preload = function () {
        mySound = new Tone.Player("./cw_amen02_165.wav", () => {
            mySound.stop()
            divLength = mySound.buffer.duration / divisions;
            for (let i = 0; i < divisions; i++) {
                chops.push(new chopBoy(i, tracker, divLength));
            }
        })
    }

    p.windowResized = function () {
        p.resizeCanvas(...getCanvasDimensions())
        p.removeElements()
        bawlz.length = 0
        controlButtons.length = 0
        segmentButtons.length = 0
        Tone.getTransport().stop(0)
        sequence.stop(0)
        setValues();
        createButtons()
    }

    const setValues = function () {
        buttonBaseSize = p.width / (divisions / 2);
        rowHeight = p.height / 1.8;
        padding = p.width / 200;
        bottomBound = p.height - rowHeight;
        topBound = buttonBaseSize + padding;
        bottomRowLevel = bottomBound + buttonBaseSize * 2;
    }

    const setButtonSettings = function (buttons: p5.Element[]) {
        buttons.forEach((b) => {
            b.size(buttonBaseSize, buttonBaseSize)
            b.addClass('control-button')
            b.addClass('retro-button')
        })
    }
    const createButtons = function () {
        const hit = p.createButton("GO")
            .position(p.width / 2 - buttonBaseSize / 2, p.lerp(topBound, bottomBound, 0.5) - buttonBaseSize / 2)
            .addClass('retro-button').addClass('control-button').size(buttonBaseSize, buttonBaseSize)
            .mouseClicked(() => {
                if (Tone.getTransport().state != 'started') {
                    Tone.getTransport().start().bpm.value = actualSpeed();
                    sequence.start(0);
                    controlButtons.forEach((button) => button.show())
                    hit.html("STOP")
                } else {
                    hit.html("GO")
                    sequence.stop(0)
                    Tone.getTransport().stop(0)
                    controlButtons.forEach((button) => button.hide())
                    bawlz = []
                }
            })
        const regularBallButton = p.createButton("RTRIG")
            .position(p.width / 2 - buttonBaseSize / 2 - buttonBaseSize * 2 - padding * 2, bottomRowLevel)
            .mouseClicked(() => {
                bawlz.push(new ball("normal"));
            })
        const freezeBallButton = p.createButton("FRZ")
            .position(p.width / 2 - buttonBaseSize / 2 - buttonBaseSize - padding, bottomRowLevel)
            .mouseClicked(() => {
                bawlz.push(new ball("freeze"));
            })
        const gateBallButton = p.createButton("GATE").position(p.width / 2 - buttonBaseSize / 2, bottomRowLevel)
            .mouseClicked(() => {
                bawlz.push(new ball("gate"));
            })
        const reverseBallButton = p.createButton("REV")
            .position(p.width / 2 - buttonBaseSize / 2 + buttonBaseSize + padding, bottomRowLevel)
            .mouseClicked(() => {
                bawlz.push(new ball("reverse"));
            })
        const killBallsButton = p.createButton("CLEAR")
            .position(p.width / 2 - buttonBaseSize / 2 + buttonBaseSize * 2 + padding * 2, bottomRowLevel)
            .mouseClicked(() => {
                bawlz = [];
            })
        controlButtons.push(killBallsButton, reverseBallButton, gateBallButton, freezeBallButton, regularBallButton);
        speedSlider = p.createSlider(0.5, 1.5, speedMultiplier, 0.1).size(p.width * 0.75).addClass('retro-slider')
            .position(
                p.width * 0.125,
                bottomRowLevel + buttonBaseSize * 2 + padding * 10
            )
            // @ts-ignore
            .changed(() => {
                tracker.setValue('pendingRateChange', 0)
                bawlzReserve = Object.assign(bawlz)
                bawlz = []
                speedSlider.addClass('disabled-flashing')
                sliderLabel.addClass('disabled-flashing')
            });
        sliderLabel = p.createDiv("TEMPO: " + actualSpeed() + " BPM").position(
            p.width / 2,
            (speedSlider.position() as { y: number }).y + padding * 8,
        ).addClass('slider-label')
        for (let i = 0; i < divisions; i++) {
            const newButton = p.createButton("0" + i.toString(16).toUpperCase(), i.toString());
            const pos = positionButton(i);
            newButton.parent();
            newButton.position(pos.x, pos.y);
            newButton.size(buttonBaseSize - padding * 2, buttonBaseSize);
            newButton.addClass('retro-button')
            segmentButtons.push(newButton);
        }
        setButtonSettings(controlButtons)
    }

    p.setup = function () {
        canvas = p.createCanvas(...getCanvasDimensions());
        tracker = new valueTracker()
        setValues()
        createButtons()
        sequence = new Tone.Sequence((time, val) => {
                currentDivision = val;
                if (val === 0 && tracker.getValue('pendingRateChange')) alterTempo()
                chops[val].play(time, divLength, divisions, sequence, chops);
            }
            , [0], "8n");

        const alterTempo = function () {
            divLength = mySound.buffer.duration / divisions;
            speedMultiplier = parseFloat(speedSlider.value().toString());
            chops.forEach((chop) => {
                    chop.chop.playbackRate = speedMultiplier;
                    chop.startTime = chop.ordinal * divLength;
                }
            );
            Tone.getTransport().bpm.value = actualSpeed();
            sliderLabel.removeClass('disabled-flashing')
            speedSlider.removeClass('disabled-flashing')
            sliderLabel.html("TEMPO: " + actualSpeed() + " BPM")
            bawlz = Object.assign(bawlzReserve)
        }

        controlButtons.forEach((button) => button.hide())
        lastPressed = p.millis();
    }

    const collided = function (val: number, ball: ball) {
        return () => {
            if (pendingRateChange) return;
            const current = p.millis();
            if ((current - lastPressed) / 1000 < divLength) {
                return;
            }
            lastPressed = current;
            tracker.setNextDivision(val)
            if (ball.action === 'gate') {
                tracker.setValue('gate', 1)
            }
            if (ball.action === 'reverse') {
                tracker.setValue('reverse', 2)
            }
            if (ball.action === 'freeze') {
                tracker.setValue('frozen', 1)
            }
            segmentButtons[val].style("background-color", ball.color);
            setTimeout(() => {
                segmentButtons[val].style('background-color', 'black')
            }, divLength * 1000);
        };
    }

    const positionButton = function (val: number) {
        const pos = p.createVector();
        let x = padding + (val % (divisions / 2)) * buttonBaseSize;
        let y;
        if (val < divisions / 2) {
            y = padding;
        } else {
            y = bottomBound;
        }
        pos.x = x;
        pos.y = y;
        return pos;
    }

    p.draw = function () {
        p.background(9, 30, 4);
        if (Tone.getTransport().state === 'started') {
            const cd = currentDivision;
            if (cd !== lastDiv) {
                lastDiv = cd;
                segmentButtons[cd].addClass('played-highlight')
                setTimeout(() => {
                    segmentButtons[cd].removeClass('played-highlight')
                }, 1000 * divLength)
            }
        }
        bawlz.forEach((myBall) => {
            myBall.draw();
            myBall.move();
            myBall.update();
        });
    }

    const fling = function (ball: ball) {
        ball.positionVector.x = p.random([0, p.width])
        ball.positionVector.y = p.random([topBound + padding * 5, bottomBound - padding * 5])
        ball.velocityVector.x = p.random(5, 10) * p.random([-1, 1])
        ball.velocityVector.y = p.random(5, 10) * p.random([-1, 1])
    }

    class ball {
        r;
        positionVector = p.createVector()
        velocityVector = p.createVector();
        color = p.color(255, 255, 0);
        action: "reverse" | "normal" | "freeze" | "gate" = "normal";

        constructor(action: "reverse" | "normal" | "freeze" | "gate") {
            fling(this)
            this.r = buttonBaseSize / 5
            this.action = action;
            switch (this.action) {
                case 'reverse':
                    this.color = p.color(255, 0, 0)
                    break
                case 'gate':
                    this.color = p.color(0, 255, 0)
                    break
                case 'freeze':
                    this.color = p.color(0, 255, 255)
                    break
            }
        }

        draw() {
            p.push();
            p.fill(this.color);
            p.ellipse(this.positionVector.x, this.positionVector.y, this.r);
            p.pop();
        }

        move() {
            this.positionVector.add(this.velocityVector);
        }

        whichDidIHit(positionVector: p5.Vector) {
            let x = positionVector.x;
            let y = positionVector.y;
            let row = 0;
            if (y > topBound) {
                row = 1;
            }
            let col = Math.floor(x / buttonBaseSize);
            return p.constrain(row * (divisions / 2) + col, 0, divisions - 1);
        }

        update() {
            if (this.positionVector.x > p.width || this.positionVector.x < 0) {
                this.velocityVector.x *= -1;
            }
            if (
                this.positionVector.y > bottomBound ||
                this.positionVector.y < topBound
            ) {
                this.velocityVector.y *= -1;
                collided(this.whichDidIHit(this.positionVector), this)();
            }
        }
    }
}

let myp5 = new p5(sketch);