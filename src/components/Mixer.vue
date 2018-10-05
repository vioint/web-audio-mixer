<template>
  <div>
    <div class="main-container">
      <div class="left-panel">
        <div class="left-channel-display">
          <div class="deck-info-panel">
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
              <div key="PauseButton" v-if="deckStates.left === 'Playing'" class="deck-is-playing">
                PAUSE
              </div>
              <div key="PlayButton" v-else>
                PLAY
              </div>
            </button>
            <button v-on:click="leftDeckResetTrack()" class="deck-control-button">
              <div key="ResetButton">
                RESET
              </div>
            </button>
            <vue-slider snap-to-steps :tooltip="false" :useKeyboard="true"
                        :dotSize="40" :max="10" :min="0.1" :interval="0.005" :piecewise="true"
                        :piecewiseStyle="sliderPieceStyle" :startAnimation="true"
                        v-model="deckSpeedLeft" v-on:input="updateDeckSpeed('left')"
                        class="deck-speed-slider" :show="isTrackLoadedLeft" />
          </div>
        </div>
        <div id="resultViewLeft" ref="resultViewLeft" class="track-info"></div>
      </div>
      <div class="middle-panel">
        <vue-slider snap-to-steps :startAnimation="true" :useKeyboard="true"
                    :dotSize="30" :max="1" :min="-1" :interval="0.01"
                    :piecewise="false" :processStyle="{backgroundColor: 'green'}"
                    :style="{ margin: 'auto', width: '200px', height: '20px' }"
                    v-model="mixLevel" :tooltip="false"
                    @input="updateVolume()"
                     />
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
                  <div key="PauseButton" v-if="deckStates.right === 'Playing'" class="deck-is-playing">
                    PAUSE
                  </div>
                  <div key="PlayButton" v-else>
                    PLAY
                  </div>
                </transition>
              </button>
              <button v-on:click="rightDeckResetTrack()" class="deck-control-button">
                <div key="ResetButton">
                  RESET
                </div>
              </button>
              <vue-slider snap-to-steps :tooltip="false" :useKeyboard="true"
                          :dotSize="40" :max="10" :min="0.1" :interval="0.005" :piecewise="true"
                          :piecewiseStyle="sliderPieceStyle" :startAnimation="true"
                          v-model="deckSpeedRight" v-on:input="updateDeckSpeed('right')"
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

import Vue from 'vue';
import vueSlider from 'vue-slider-component';
import analyzeTempo from '../lib/analyzer';

const Decks = {
  Left: 'left',
  Right: 'right'
};

const DeckState = {
  Stopped:  'Stopped',
  Playing:  'Playing',
  Paused:   'Paused'
};

export default {
  name: "mixer",
  components: {
    vueSlider
  },
  data() {
    return {
      rightDeckTrack: 'audio/John_Frusciante_-_Walls_and_Doors.mp3',
      leftDeckTrack: 'audio/John_Frusciante_-_Genex_44.mp3',
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
                          backgroundColor: '#ccc',
                          visibility: 'visible',
                          width: '4px',
                          height: '12px'
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
      return (this.mixLevel > 0 ? 1-this.mixLevel : 1);
    },
    mixVolumeRight() {
      return this.mixLevel < 0 ? 1-Math.abs(this.mixLevel) : 1;
    }
  },
  mounted() {
    console.log('mounted');
    this.trackLoaded(Decks.Left);
    this.trackLoaded(Decks.Right);
  },
  methods: {
    trackLoaded(deck) {
      if (deck === Decks.Left) {
        analyzeTempo(this.leftDeckTrack, this.$refs.audioSourceLeft, this.$refs.resultViewLeft)
          .then((result) => {
            this.detectedBpmLeft = result.tempo;
            this.isTrackLoadedLeft = true;
          });

        this.$refs.audioSourceLeft.addEventListener("play", this.updateLeftAnimation);
        this.$refs.audioSourceLeft.addEventListener("playing", this.updateLeftAnimation);
        this.$refs.audioSourceLeft.addEventListener("pause",
          () => this.updateDeckState(Decks.Left, DeckState.Paused));
        this.$refs.audioSourceLeft.addEventListener("ended",
          () => this.updateDeckState(Decks.Left, DeckState.Stopped));
      } else {
        analyzeTempo(this.rightDeckTrack, this.$refs.audioSourceRight, this.$refs.resultViewRight)
          .then((result) => {
            this.detectedBpmRight = result.tempo;
            this.isTrackLoadedRight = true;
          });

        this.$refs.audioSourceRight.addEventListener("play", this.updateRightAnimation);
        this.$refs.audioSourceRight.addEventListener("playing", this.updateRightAnimation);
        this.$refs.audioSourceRight.addEventListener("pause",
          () => this.updateDeckState(Decks.Right, DeckState.Paused));
        this.$refs.audioSourceRight.addEventListener("ended",
          () => this.updateDeckState(Decks.Right, DeckState.Stopped));

      }
    },
    spinObject(currentAngle, spinningObject, speed) {
      currentAngle += 60 * (Math.PI / 180) * speed;
      currentAngle = currentAngle.toFixed(0) % 360;   // reset angle
      spinningObject.style.transform = "rotate(" + currentAngle + "deg)";
      return currentAngle;
    },
    updateVolume() {
      this.$refs.audioSourceLeft.volume = this.mixVolumeLeft;
      this.$refs.audioSourceRight.volume = this.mixVolumeRight;
    },
    isLeftPlaying() {
      return !this.$refs.audioSourceLeft.paused && !this.$refs.audioSourceLeft.ended;
    },
    isRightPlaying() {
      return this.$refs.audioSourceRight && !this.$refs.audioSourceRight.paused && !this.$refs.audioSourceRight.ended;
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
        this.updateDeckState(Decks.Left, DeckState.Paused);
      } else {
        this.$refs.audioSourceLeft.play();
        this.deckSpeedLeft = this.$refs.audioSourceLeft.playbackRate;
        this.updateDeckState(Decks.Left, DeckState.Playing);
      }
    },
    rightDeckPlayToggle() {
      if (this.isRightPlaying()) {
        this.$refs.audioSourceRight.pause();
        this.deckSpeedRight = this.$refs.audioSourceRight.playbackRate;
        this.updateDeckState(Decks.Right, DeckState.Paused);
      } else {
        this.$refs.audioSourceRight.play();
        this.deckSpeedRight = this.$refs.audioSourceRight.playbackRate;
        this.updateDeckState(Decks.Right, DeckState.Playing);
      }
    },
    updateDeckSpeed(deck) {
      switch (deck) {
        case 'left':
            this.$refs.audioSourceLeft.playbackRate = Math.clamp(this.deckSpeedLeft, 0.25, 10);
          break;
        case 'right':
            this.$refs.audioSourceRight.playbackRate = Math.clamp(this.deckSpeedRight, 0.25, 10);
          break;
      }
    },
    updateLeftAnimation() {
      if (this.isLeftPlaying()) {
        this.leftDeckCurrentAngle = this.spinObject(this.leftDeckCurrentAngle, this.$refs.deckVisualLeft, this.deckSpeedLeft);
        requestAnimationFrame(this.updateLeftAnimation);
      }
    },
    updateRightAnimation() {
      if (this.isRightPlaying()) {
          this.rightDeckCurrentAngle = this.spinObject(this.rightDeckCurrentAngle, this.$refs.deckVisualRight, this.deckSpeedRight);
          requestAnimationFrame(this.updateRightAnimation);
      }
    }
  }
}
</script>
<style>

@font-face {
  font-family: 'Orbitron';
  font-style: normal;
  font-weight: 400;
  src: local('Orbitron Regular'), local('Orbitron-Regular'), url(assets/fonts/google-orbitron.woff2) format('woff2');
}

.main-container {
  margin: auto auto;
  width: 90%;
  height: 90%;
  /* transform: perspective(100em) rotateX(50deg); */
}

.left-panel {
  float: left;
  width: 40%;
  min-height: 100px;
}

.right-panel {
  float: right;
  width: 40%;
  min-height: 100px;
}

.middle-panel {
  width: 15%;
  display: inline-block;
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
  font-family: 'Orbitron';
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

.deck-is-playing {
  color: greenyellow !important;
}

.track-tempo-display {
  font-family: 'Orbitron';
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
.deck-control-button:active  {
  font-family: 'Orbitron';
  font-weight: bold;
  line-height: 1;
  font-size: 100%;
  width: 30%;
  height: 30px;
  padding: 6px;
  background: #000;
  border-radius: 5px;
  border: 2px ridge #888;
  display: inline-grid;
  color: #eee;
  font-weight: bold;
  outline: none;
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
