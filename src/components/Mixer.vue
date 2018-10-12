<template>
  <div>
    <div class="main-container">
      <div class="left-panel">
        <div class="left-channel-display">
          <div class="deck-info-panel">
            <div class="deck-control-button" key="resetLeftBpmButton" @click="resetBpm(Decks.Left)">
              RESET BPM
            </div>
            <div class="track-tempo-display">
              {{ bpmLeft }} BPM
            </div>
            <div class="deck-volume-display">
              {{(mixVolumeLeft * 100).toFixed(0) + '%'}}
            </div>
          </div>
          <div class="vinyl-record-wrapper">
            <object ref="deckVisualLeft" class="vinyl-record left-deck" data="assets/vinyl_record.svg" type="image/svg+xml">
              <img src="assets/vinyl_record.png" />
            </object>
          </div>
          <audio ref="audioSourceLeft" class="audio-source-left"
                 v-bind:src="leftDeckTrack"
                 v-bind:playbackRate="deckSpeedLeft"
                 v-bind:volume="mixVolumeLeft"></audio>
          <div class="deck-controls">
            <button v-on:click="leftDeckPlayToggle()" class="deck-control-button play-button-left">
              <div key="PauseButton" v-if="deckStates.left === DeckState.Playing" class="deck-is-playing">
                PAUSE
              </div>
              <div key="PlayButton" v-else>
                PLAY
              </div>
            </button>
            <button v-on:click="leftDeckResetTrack()" class="deck-control-button">
              <div key="ResetButton">
                STOP
              </div>
            </button>
            <vue-slider snap-to-steps :tooltip="always" :useKeyboard="true"
                        :dotSize="40" :max="10" :min="0.1" :interval="0.005" :piecewise="true"
                        :piecewiseStyle="sliderPieceStyle" :startAnimation="true"
                        v-model.number="deckSpeedLeft" v-on:input="updateDeckSpeed(Decks.Left)"
                        class="deck-speed-slider" :show="isTrackLoadedLeft" />
          </div>
        </div>
        <div id="resultViewLeft" ref="resultViewLeft" class="track-info"></div>
      </div>
      <div class="middle-panel">
        <div class="deck-transition-panel">
          <vue-slider snap-to-steps :startAnimation="true" :useKeyboard="true"
                      :dotSize="30" :max="1" :min="-1" :interval="0.01"
                      :piecewise="false" :processStyle="{backgroundColor: 'green'}"
                      :style="{ margin: 'auto', width: '200px', height: '20px' }"
                      v-model.number="mixLevel" :tooltip="false"
                      @input="updateVolume()"
                      />
          <div class="deck-automatic-controls">
            <div class="deck-control-button auto-match-tempo-button" @click="transitionBpm">
              MATCH BPM
            </div>
            <div class="deck-control-button auto-match-tempo-button" @click="autoMix">
              MIX
            </div>
            <div class="transition-volume-panel">
              <div class="deck-control-button transition-to-left-button" @click="transitionVolume(Decks.Left)">
                &lt; LEFT
              </div>
              <div class="deck-control-button transition-to-right-button" @click="transitionVolume(Decks.Right)">
                RIGHT &gt;
              </div>
            </div>
          </div>
          <div>
            <label for="transitionTimeInput" class="deck-control-label" >Transition Time</label>
            <input name="transitionTimeInput" class="deck-control-input transition-time-input" v-model.number="deckTransitionTime" />
          </div>
        </div>
      </div>
      <div class="right-panel">
        <div class="right-channel-display">
          <div class="deck-info-panel">
            <div class="deck-volume-display">
              {{(mixVolumeRight * 100).toFixed(0) + '%'}}
            </div>
            <div class="track-tempo-display">
              {{ bpmRight }} BPM
            </div>
            <div class="deck-control-button" key="resetLeftBpmButton" @click="resetBpm(Decks.Right)">
              RESET BPM
            </div>
          </div>
          <div class="vinyl-record-wrapper">
            <object ref="deckVisualRight" class="vinyl-record right-deck" data="assets/vinyl_record.svg" type="image/svg+xml">
              <img src="assets/vinyl_record.png" />
            </object>
          </div>
          <audio ref="audioSourceRight" class="audio-source-right"
                 v-bind:playbackRate="deckSpeedRight"
                 v-bind:src="rightDeckTrack"
                 v-bind:volume="mixVolumeRight"></audio>
          <div class="deck-controls">
              <button v-on:click="rightDeckPlayToggle()" class="deck-control-button play-button-right">
                <transition name="fade" mode="out-in" :duration="100">
                  <div key="PauseButton" v-if="deckStates.right === DeckState.Playing" class="deck-is-playing">
                    PAUSE
                  </div>
                  <div key="PlayButton" v-else>
                    PLAY
                  </div>
                </transition>
              </button>
              <button v-on:click="rightDeckResetTrack()" class="deck-control-button">
                <div key="ResetButton">
                  STOP
                </div>
              </button>
              <vue-slider snap-to-steps :tooltip="always" :useKeyboard="true"
                          :dotSize="40" :max="10" :min="0.1" :interval="0.005" :piecewise="true"
                          :piecewiseStyle="sliderPieceStyle" :startAnimation="true"
                          v-model.number="deckSpeedRight" v-on:input="updateDeckSpeed(Decks.Right)"
                          class="deck-speed-slider" :show="isTrackLoadedRight" />
          </div>
          <div id="resultViewRight" ref="resultViewRight" class="track-info"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
Math.clamp = function(val, min, max) {
  return Math.min(Math.max(val, min), max);
};

Math.lerp = function(start, stop, amt) {
  return start + (stop - start) * amt;
};

Math.lerpOverTime = function(
  start,
  stop,
  totalTime,
  callback,
  updateInterval = 100
) {
  var startTime = new Date();
  var endTime = new Date(startTime.getTime() + totalTime);
  var stepCount = totalTime / updateInterval;
  var totalChange = start < stop ? stop - start : -(start - stop);
  var step = totalChange / stepCount;
  var lastStep = step;
  var val = start;
  var handle = setInterval(function() {
    lastStep += step;
    // lower precision to avoid javascript rounding issues
    val = Math.lerp(start, stop, lastStep / totalChange);
    if (Date.now() >= endTime) {
      val = stop;
      clearInterval(handle);
    }
    callback(val);
  }, updateInterval);
};

// test
// Math.lerpOverTime(0, 100, 3000, function(val) {
//   console.log("Lerpin: " + val);
// });

import Vue from "vue";
import vueSlider from "vue-slider-component";
import analyzeTempo from "../lib/analyzer";

const Decks = {
  Left: "left",
  Right: "right"
};

const DeckState = {
  Stopped: "Stopped",
  Playing: "Playing",
  Paused: "Paused"
};

export default {
  name: "mixer",
  props: {
    deckTransitionTime: {
      type: Number,
      default: 2000
    }
  },
  components: {
    vueSlider
  },
  data() {
    return {
      // model constants
      Decks: Object.assign({}, Decks),
      DeckState: Object.assign({}, DeckState),
      // vars
      rightDeckTrack: "audio/John_Frusciante_-_Walls_and_Doors.mp3",
      leftDeckTrack: "audio/John_Frusciante_-_Genex_44.mp3",
      deckStates: {
        left: DeckState.Stopped,
        right: DeckState.Stopped
      },
      mixLevel: 0,
      deckSpeedLeft: 1,
      deckSpeedRight: 1,
      detectedBpmLeft: 0,
      detectedBpmRight: 0,
      sliderPieceStyle: {
        backgroundColor: "#ccc",
        visibility: "visible",
        width: "4px",
        height: "12px"
      },
      leftDeckCurrentAngle: 0,
      rightDeckCurrentAngle: 0,
      isTrackLoadedLeft: false,
      isTrackLoadedRight: false
    };
  },
  computed: {
    bpmLeft() {
      return (this.detectedBpmLeft * this.deckSpeedLeft).toFixed(1);
    },
    bpmRight() {
      return (this.detectedBpmRight * this.deckSpeedRight).toFixed(1);
    },
    mixVolumeLeft() {
      return this.mixLevel > 0 ? 1 - this.mixLevel : 1;
    },
    mixVolumeRight() {
      return this.mixLevel < 0 ? 1 - Math.abs(this.mixLevel) : 1;
    }
  },
  mounted() {
    console.log("mounted");
    this.trackLoaded(Decks.Left);
    this.trackLoaded(Decks.Right);
  },
  methods: {
    transitionVolume(deck) {
      var targetMixLevel = deck === Decks.Left ? -1 : 1;
      Math.lerpOverTime(this.mixLevel, targetMixLevel, this.deckTransitionTime, function(newVol) {
        this.mixLevel = newVol;
      }.bind(this));
    },
    getTargetMatchingSpeed() {
      var targetBpm = (Number.parseFloat(this.bpmLeft) + Number.parseFloat(this.bpmRight)) / 2;
      var targetSpeed = {
        Left: (targetBpm / this.bpmLeft).toFixed(2),
        Right: (targetBpm / this.bpmRight).toFixed(2)
      };
      return targetSpeed;
    },
    resetBpm(deck) {
      if (deck === this.Decks.Left) {
        // avoid a transition for a very small difference
        if (Math.abs(1 - this.deckSpeedLeft) <= 0.01) {
          this.deckSpeedLeft = 1;
        } else {
          console.log(`dsl: ${this.deckSpeedLeft}`);
          Math.lerpOverTime(this.deckSpeedLeft, 1, this.deckTransitionTime,
            function(newSpeed) {
              console.log(newSpeed);
              this.deckSpeedLeft = newSpeed;
            }.bind(this)
          );
        }
      } else {
        // avoid a transition for a very small difference
        if (Math.abs(1 - this.deckSpeedRight) <= 0.01) {
          this.deckSpeedRight = 1;
        } else {
          Math.lerpOverTime(this.deckSpeedRight, 1, this.deckTransitionTime,
            function(newSpeed) {
              this.deckSpeedRight = newSpeed;
            }.bind(this)
          );
        }
      }
    },
    transitionBpm() {
      var targetSpeed = this.getTargetMatchingSpeed();
      // avoid a transition for a very small difference
      if (Math.abs(1 - targetSpeed.Left) >= 0.01) {
        Math.lerpOverTime(
          this.deckSpeedLeft,
          targetSpeed.Left,
          this.deckTransitionTime,
          function(newSpeed) {
            this.deckSpeedLeft = newSpeed;
          }.bind(this)
        );
      }

      // avoid a transition for a very small difference
      if (Math.abs(1 - targetSpeed.Right) >= 0.01) {
        Math.lerpOverTime(
          this.deckSpeedRight,
          targetSpeed.Right,
          this.deckTransitionTime,
          function(newSpeed) {
            this.deckSpeedRight = newSpeed;
          }.bind(this)
        );
      }
    },
    autoMix() {
      var nextDeck = this.mixLevel <= 0 ? this.Decks.Right : this.Decks.Left;
      this.transitionBpm();
      this.transitionVolume(nextDeck);
    },
    trackLoaded(deck) {
      if (deck === Decks.Left) {
        analyzeTempo(
          this.leftDeckTrack,
          this.$refs.audioSourceLeft,
          this.$refs.resultViewLeft
        ).then(result => {
          this.detectedBpmLeft = result.tempo;
          this.isTrackLoadedLeft = true;
        });

        this.$refs.audioSourceLeft.addEventListener(
          "play",
          this.updateLeftAnimation
        );
        this.$refs.audioSourceLeft.addEventListener(
          "playing",
          this.updateLeftAnimation
        );
        this.$refs.audioSourceLeft.addEventListener("pause", () =>
          this.updateDeckState(this.Decks.Left, this.DeckState.Paused)
        );
        this.$refs.audioSourceLeft.addEventListener("ended", () =>
          this.updateDeckState(this.Decks.Left, this.DeckState.Stopped)
        );
      } else {
        analyzeTempo(
          this.rightDeckTrack,
          this.$refs.audioSourceRight,
          this.$refs.resultViewRight
        ).then(result => {
          this.detectedBpmRight = result.tempo;
          this.isTrackLoadedRight = true;
        });

        this.$refs.audioSourceRight.addEventListener(
          "play",
          this.updateRightAnimation
        );
        this.$refs.audioSourceRight.addEventListener(
          "playing",
          this.updateRightAnimation
        );
        this.$refs.audioSourceRight.addEventListener("pause", () =>
          this.updateDeckState(this.Decks.Right, this.DeckState.Paused)
        );
        this.$refs.audioSourceRight.addEventListener("ended", () =>
          this.updateDeckState(this.Decks.Right, this.DeckState.Stopped)
        );
      }
    },
    spinObject(currentAngle, spinningObject, speed) {
      currentAngle += 60 * (Math.PI / 180) * speed;
      currentAngle = currentAngle.toFixed(0) % 360; // reset angle
      spinningObject.style.transform = "rotate(" + currentAngle + "deg)";
      return currentAngle;
    },
    updateVolume() {
      this.$refs.audioSourceLeft.volume = this.mixVolumeLeft;
      this.$refs.audioSourceRight.volume = this.mixVolumeRight;
    },
    isLeftPlaying() {
      return (
        !this.$refs.audioSourceLeft.paused && !this.$refs.audioSourceLeft.ended
      );
    },
    isRightPlaying() {
      return (
        this.$refs.audioSourceRight &&
        !this.$refs.audioSourceRight.paused &&
        !this.$refs.audioSourceRight.ended
      );
    },
    leftDeckResetTrack() {
      this.$refs.audioSourceLeft.currentTime = 0;
    },
    rightDeckResetTrack() {
      this.$refs.audioSourceRight.currentTime = 0;
    },
    updateDeckState(deck, state) {
      this.deckStates[deck] = state;
    },
    leftDeckPlayToggle() {
      if (this.isLeftPlaying()) {
        this.$refs.audioSourceLeft.pause();
        this.deckSpeedLeft = this.$refs.audioSourceLeft.playbackRate;
        this.updateDeckState(this.Decks.Left, this.DeckState.Paused);
      } else {
        this.$refs.audioSourceLeft.play();
        this.deckSpeedLeft = this.$refs.audioSourceLeft.playbackRate;
        this.updateDeckState(this.Decks.Left, this.DeckState.Playing);
      }
    },
    rightDeckPlayToggle() {
      if (this.isRightPlaying()) {
        this.$refs.audioSourceRight.pause();
        this.deckSpeedRight = this.$refs.audioSourceRight.playbackRate;
        this.updateDeckState(this.Decks.Right, this.DeckState.Paused);
      } else {
        this.$refs.audioSourceRight.play();
        this.deckSpeedRight = this.$refs.audioSourceRight.playbackRate;
        this.updateDeckState(this.Decks.Right, this.DeckState.Playing);
      }
    },
    updateDeckSpeed(deck) {
      switch (deck) {
        case "left":
          this.$refs.audioSourceLeft.playbackRate = Math.clamp(
            this.deckSpeedLeft,
            0.25,
            10
          );
          break;
        case "right":
          this.$refs.audioSourceRight.playbackRate = Math.clamp(
            this.deckSpeedRight,
            0.25,
            10
          );
          break;
      }
    },
    updateLeftAnimation() {
      if (this.isLeftPlaying()) {
        this.leftDeckCurrentAngle = this.spinObject(
          this.leftDeckCurrentAngle,
          this.$refs.deckVisualLeft,
          this.deckSpeedLeft
        );
        requestAnimationFrame(this.updateLeftAnimation);
      }
    },
    updateRightAnimation() {
      if (this.isRightPlaying()) {
        this.rightDeckCurrentAngle = this.spinObject(
          this.rightDeckCurrentAngle,
          this.$refs.deckVisualRight,
          this.deckSpeedRight
        );
        requestAnimationFrame(this.updateRightAnimation);
      }
    }
  }
};
</script>
<style>
@font-face {
  font-family: "Orbitron";
  font-style: normal;
  font-weight: 400;
  src: local("Orbitron Regular"), local("Orbitron-Regular"),
    url(assets/fonts/google-orbitron.woff2) format("woff2");
}

.main-container {
  margin: auto auto;
  width: 90%;
  height: 90%;
  display: flex;
  flex-direction: row;
  flex-basis: 90%;
  /* transform: perspective(100em) rotateX(50deg); */
}

.left-panel {
  display: flex;
  flex-direction: column;
  flex-basis: 40%;
  max-width: 40%;

  /* float: left;
  width: 40%; */
  min-height: 100px;
}

.right-panel {
  display: flex;
  flex-direction: column;
  flex-basis: 40%;
  max-width: 40%;
  /* float: right;
  width: 40%; */
  min-height: 100px;
}

.middle-panel {
  /* width: 20%; */
  display: flex;
  flex-direction: column;
  flex-basis: 20%;
  max-width: 20%;
}

.left-channel-display {
  margin: auto;
}

.right-channel-display {
  margin: auto;
}

.vinyl-record-wrapper {
  display: block;
  margin: auto;
  padding: 2px;
  max-height: 418px;
  max-width: 418px;
  border-width: 4px;
  border-color: #aaa;
  border-style: dashed;
  border-radius: 50%;
}

.deck-info-panel {
  text-align: center;
  margin: 10px auto;
}

.deck-volume-display {
  font-family: "Orbitron";
  font-weight: bold;
  font-style: italic;
  line-height: 1;
  padding: 6px;
  width: 30%;
  height: 30px;
  color: #eee;
  background: #000;
  border-radius: 5px;
  border: 2px ridge #888;
  display: inline-grid;
}

.vinyl-record {
  display: block;
  margin: auto;
  border-width: 4px;
  border-color: #888;
  border-style: double;
  border-radius: 50%;
}

.deck-controls {
  text-align: center;
  margin: 10px auto;
}

.deck-transition-panel {
  text-align: center;
  margin: 10px auto;
}

.deck-transition-panel .deck-control-button  {
  margin: 3% auto;
}

.transition-volume-panel {
  display: flex;
}

.transition-volume-panel > .deck-control-button {
  display: flex;
  flex-basis: 40%;
  min-height: 3rem;
  line-height: 2rem;
  text-align: center;
  vertical-align: middle;
}

.deck-is-playing {
  color: greenyellow !important;
}

.transition-time-input {
  margin: auto;
  max-width: 60%;
  text-align: center;
}

.deck-control-label {
  font-family: "Orbitron";
  font-weight: bold;
  line-height: 1;
  font-size: 100%;
  min-height: 30px;
  padding: 6px;
  display: inline-flex;
  color: #eee;
  font-weight: bold;
  text-align: center;
  vertical-align: middle;
}

.deck-control-input {
  font-family: "Orbitron";
  font-weight: bold;
  line-height: 1;
  font-size: 100%;
  height: 30px;
  padding: 6px;
  background: #555;
  border-radius: 5px;
  border: 2px ridge #888;
  display: flex;
  color: #eee;
  font-weight: bold;
  outline: none;
  cursor: pointer;
}

.track-tempo-display {
  font-family: "Orbitron";
  font-weight: bold;
  font-style: italic;
  line-height: 1;
  padding: 6px;
  width: 30%;
  height: 30px;
  color: red;
  background: #000;
  border-radius: 5px;
  border: 2px ridge #888;
  display: inline-grid;
}


.deck-control-button,
.deck-control-button:focus,
.deck-control-button:active {
  font-family: "Orbitron";
  font-weight: bold;
  line-height: 1;
  font-size: 100%;
  /* width: 30%; */
  height: 30px;
  padding: 6px;
  background: #000;
  border-radius: 5px;
  border: 2px ridge #888;
  display: inline-grid;
  color: #eee;
  font-weight: bold;
  outline: none;
  cursor: pointer;
}

.deck-speed-slider {
  width: 80%;
  display: block;
  padding: 5%;
}

.analysis-results-container {
  display: block;
}

.track-info {
  display: none;
}

.track-progress-display {
  border: 1px solid #eee;
  display: block;
  width: 100%;
  min-height: 40px;
}

.track-progress-peak {
  fill: gray;
}

.track-progress-indicator {
  fill: red;
}

/*
.record-spinning-x0_25 {
  -webkit-animation: rotation 8s linear infinite;
  -moz-animation: rotation 8s linear infinite;
  -ms-animation: rotation 8s linear infinite;
  animation: rotation 8s linear infinite;
}

.record-spinning-x0_5 {
  -webkit-animation: rotation 4s linear infinite;
  -moz-animation: rotation 4s linear infinite;
  -ms-animation: rotation 4s linear infinite;
  animation: rotation 4s linear infinite;
}

.record-spinning-x1 {
  -webkit-animation: rotation 2s linear infinite;
  -moz-animation: rotation 2s linear infinite;
  -ms-animation: rotation 2s linear infinite;
  animation: rotation 2s linear infinite;
}

.record-spinning-x2 {
  -webkit-animation: rotation 1s linear infinite;
  -moz-animation: rotation 1s linear infinite;
  -ms-animation: rotation 1s linear infinite;
  animation: rotation 1s linear infinite;
}

.record-spinning-x4 {
  -webkit-animation: rotation .5s linear infinite;
  -moz-animation: rotation .5s linear infinite;
  -ms-animation: rotation .5s linear infinite;
  animation: rotation .5s linear infinite;
}

@-webkit-keyframes rotation {
  0%   { -webkit-transform: rotate(0deg); }
  100% { -webkit-transform: rotate(360deg); }
}
@-moz-keyframes rotation {
  0%   { -moz-transform: rotate(0deg); }
  100% { -moz-transform: rotate(360deg); }
}
@-ms-keyframes rotation {
  0%   { -ms-transform: rotate(0deg); }
  100% { -ms-transform: rotate(360deg); }
}
@keyframes rotation {
  0%   { -ms-transform: rotate(0deg); }
  100% { -ms-transform: rotate(360deg); }
}

.record-spinning {
  -webkit-animation: rotation .5s linear infinite;
  -moz-animation: rotation .5s linear infinite;
  -ms-animation: rotation .5s linear infinite;
  animation: rotation .5s linear infinite;
}

*/
</style>
