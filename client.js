(function () {

  var $ = require('jquery');
  var Vue = require('vue');

  var vm = new Vue({
    el: '#app',
    data: {
      // value: '',
      // flickr: ''
    },
    methods: {
      leftDeckPlayToggle: function (evt) {
        if (isLeftPlaying()) {
          audioSourceLeft.pause();
          deckSpeedSpeedLeft = audioSourceLeft.playbackRate;
        } else {
          audioSourceLeft.play();
          deckSpeedSpeedLeft = audioSourceLeft.playbackRate;
        }
      },
      rightDeckPlayToggle: function (evt) {
        if (isRightPlaying()) {
          audioSourceRight.pause();
          deckSpeedSpeedRight = audioSourceRight.playbackRate;
        } else {
          audioSourceRight.play();
          deckSpeedSpeedRight = audioSourceRight.playbackRate;
        }
      }
    }
  });


  var audioSourceLeft = null,
    audioSourceRight = null;

  var deckSpeedSpeedLeft = 0,
    deckSpeedSpeedRight = 0;

  function isLeftPlaying() {
    return audioSourceLeft.currentTime > 0 && !audioSourceLeft.paused && !audioSourceLeft.ended;
  }

  function isRightPlaying() {
    return audioSourceRight.currentTime > 0 && !audioSourceRight.paused && !audioSourceRight.ended;
  }

  function updateDeckAnimation() {
    var leftDeckAnimation = 'record-spinning-x' + deckSpeedSpeedLeft.toString().replace('.', '_');
    var rightDeckAnimation = 'record-spinning-x' + deckSpeedSpeedRight.toString().replace('.', '_');

    var leftDeck = $('.left-deck');
    var rightDeck = $('.right-deck');

    if (isLeftPlaying()) {
      leftDeck.addClass(leftDeckAnimation);
    } else {
      leftDeck.removeClass(leftDeckAnimation);
    }

    if (isRightPlaying()) {
      rightDeck.addClass(rightDeckAnimation);
    } else {
      rightDeck.removeClass(rightDeckAnimation);
    }
  }

  $().ready(function () {
    audioSourceLeft = $('.audio-source-left')[0];
    audioSourceRight = $('.audio-source-right')[0];
    audioSourceLeft.playbackRate = 0.5;

    $('.play-button-left').click(() => {
      if (isLeftPlaying()) {
        audioSourceLeft.pause();
        deckSpeedSpeedLeft = audioSourceLeft.playbackRate;
      } else {
        audioSourceLeft.play();
        deckSpeedSpeedLeft = audioSourceLeft.playbackRate;
      }
    });

    $('.play-button-right').click(() => {
      if (isRightPlaying()) {
        audioSourceRight.pause();
        deckSpeedSpeedRight = audioSourceRight.playbackRate;
      } else {
        audioSourceRight.play();
        deckSpeedSpeedRight = audioSourceRight.playbackRate;
      }
    });

    setInterval(updateDeckAnimation, 200);
  });

})();