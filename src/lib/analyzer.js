/* global document */
/*
  The code for finding out the BPM / tempo is taken from this post:
  http://tech.beatport.com/2014/web-audio/beat-detection-using-web-audio/
 */
(function () {
  "use strict";

  const OfflineContext = window.OfflineAudioContext || window.webkitOfflineAudioContext;

  function analyzeTempo(analyzedFilePath, audioPreviewTag, resultView) {
    return fetchAndProcess(analyzedFilePath).then((res) => {
      if (resultView) {
        resetResultView(resultView);
        plotPeaks(resultView, res.peaks, res.renderedBufferLength);
        updateText(resultView, analyzedFilePath, res.top);
        setupResultView(resultView, audioPreviewTag);
      }
      return new Promise((resolve, reject) => {
        if (top.length > 0) {
          resolve({
            tempo: Math.round(res.top[0].tempo)
          });
        } else {
          reject({
            error: 'Could not determine tempo',
            tempo: 0
          });
        }
      });
    });
  }

  function resetResultView(resultView) {
    resultView.innerHTML = '';
  }

  function fetchAndProcess(analyzedFilePath) {
    return fetch(analyzedFilePath).then(response =>
      response.arrayBuffer().then(resultData => {
        var offlineContext = new OfflineContext(2, 30 * 44100, 44100);
        return offlineContext.decodeAudioData(resultData)
          .then((decodedBuffer) =>
            processDecodedBuffer(decodedBuffer, offlineContext));
      })
    );
  }

  function processDecodedBuffer(decodedBuffer, offlineContext) {
    // Create buffer source
    var source = offlineContext.createBufferSource();
    source.buffer = decodedBuffer;

    // Beats, or kicks, generally occur around the 100 to 150 hz range.
    // Below this is often the bassline.  So let's focus just on that.

    // First a lowpass to remove most of the song.
    var lowpass = offlineContext.createBiquadFilter();
    lowpass.type = "lowpass";
    lowpass.frequency.value = 150;
    lowpass.Q.value = 1;

    // Run the output of the source through the low pass.
    source.connect(lowpass);

    // Now a highpass to remove the bassline.
    var highpass = offlineContext.createBiquadFilter();
    highpass.type = "highpass";
    highpass.frequency.value = 100;
    highpass.Q.value = 1;

    // Run the output of the lowpass through the highpass.
    lowpass.connect(highpass);

    // Run the output of the highpass through our offline context.
    highpass.connect(offlineContext.destination);

    // Start the source, and render the output into the offline conext.
    source.start(0);
    return offlineContext.startRendering()
      .then((buffer) => onAudioDecodingComplete(buffer));
  }

  function onAudioDecodingComplete(buffer) {
    var peaks = getPeaks([
      buffer.getChannelData(0),
      buffer.getChannelData(1)
    ]);
    var groups = getIntervals(peaks);

    var top = groups
      .sort(function (intA, intB) {
        return intB.count - intA.count;
      })
      .splice(0, 5);

    return new Promise((resolve, reject) => {
      resolve({
        top: top,
        peaks: peaks,
        renderedBufferLength: buffer.length
      });
    });
  }

  function plotPeaks(resultView, peaks, bufferLength) {
    var svg = document.createElement("svg");
    svg.setAttributeNS(null, "id", "svg_" + resultView.id);
    svg.setAttributeNS(null, "class", 'track-progress-display');
    svg.setAttributeNS(null, "width", "100%");
    svg.setAttributeNS(null, "height", "40");
    // svg.innerHTML = "";
    var svgNS = "http://www.w3.org/2000/svg";
    var rect;
    peaks.forEach(function (peak) {
      rect = document.createElementNS(svgNS, "rect");
      rect.setAttributeNS(null, "x", (100 * peak.position) / bufferLength + "%");
      rect.setAttributeNS(null, "y", 0);
      rect.setAttributeNS(null, "class", 'track-progress-peak');
      rect.setAttributeNS(null, "width", 1);
      rect.setAttributeNS(null, "height", "100%");
      svg.appendChild(rect);
    });
    rect = document.createElementNS(svgNS, "rect");
    rect.setAttributeNS(null, "id", 'progress_' + resultView.id);
    rect.setAttributeNS(null, "class", 'track-progress-indicator');
    rect.setAttributeNS(null, "y", 0);
    rect.setAttributeNS(null, "width", 1);
    rect.setAttributeNS(null, "height", "100%");
    svg.appendChild(rect);
    resultView.appendChild(svg);
    svg.innerHTML = svg.innerHTML; // force repaint in some browsers
  }

  function updateText(resultView, analyzedFilePath, top) {
    var text = document.createElement("div");
    text.id = "text_" + resultView.id;
    resultView.appendChild(text);

    text.innerHTML =
      '<div id="guess">Guess for track <strong>' +
      analyzedFilePath +
      "</strong> " +
      " is <strong>" +
      Math.round(top[0].tempo) +
      " BPM</strong>" +
      " with " +
      top[0].count +
      " samples.</div>";
    text.innerHTML +=
      '<div class="small">Other options are ' +
      top
      .slice(1)
      .map(function (group) {
        return group.tempo + " BPM (" + group.count + ")";
      })
      .join(", ") +
      "</div>";
    resultView.style.display = "block";
  }

  function setupResultView(resultView, audioPreviewTag) {
    // resultView.innerHTML = "";
    var progressIndicator = document.querySelector('#progress_' + resultView.id);

    function updateProgressState() {
      if (audioPreviewTag.paused) {
        return;
      }
      if (progressIndicator && audioPreviewTag.duration) {
        progressIndicator.setAttribute("x", (audioPreviewTag.currentTime * 100) / audioPreviewTag.duration + "%");
      }
      requestAnimationFrame(updateProgressState);
    }
    audioPreviewTag.addEventListener("play", updateProgressState);
    audioPreviewTag.addEventListener("playing", updateProgressState);

    // function updatePlayLabel() {
    //   playButton.innerHTML = audioPreviewTag.paused ? 'Play track' : 'Pause track';
    // }
    // audioPreviewTag.addEventListener("play", updatePlayLabel);
    // audioPreviewTag.addEventListener("playing", updatePlayLabel);
    // audioPreviewTag.addEventListener("pause", updatePlayLabel);
    // audioPreviewTag.addEventListener("ended", updatePlayLabel);
    // playButton.addEventListener('click', function () {
    //   if (audioPreviewTag.paused) {
    //     audioPreviewTag.play();
    //   } else {
    //     audioPreviewTag.pause();
    //   }
    // });
    // resultView.style.display = "none";
  }

  function getPeaks(data) {
    // What we're going to do here, is to divide up our audio into parts.

    // We will then identify, for each part, what the loudest sample is in that
    // part.

    // It's implied that that sample would represent the most likely 'beat'
    // within that part.

    // Each part is 0.5 seconds long - or 22,050 samples.

    // This will give us 60 'beats' - we will only take the loudest half of
    // those.

    // This will allow us to ignore breaks, and allow us to address tracks with
    // a BPM below 120.

    var partSize = 22050,
      parts = data[0].length / partSize,
      peaks = [];

    for (var i = 0; i < parts; i++) {
      var max = 0;
      for (var j = i * partSize; j < (i + 1) * partSize; j++) {
        var volume = Math.max(Math.abs(data[0][j]), Math.abs(data[1][j]));
        if (!max || volume > max.volume) {
          max = {
            position: j,
            volume: volume
          };
        }
      }
      peaks.push(max);
    }

    // We then sort the peaks according to volume...

    peaks.sort(function (a, b) {
      return b.volume - a.volume;
    });

    // ...take the loundest half of those...

    peaks = peaks.splice(0, peaks.length * 0.5);

    // ...and re-sort it back based on position.

    peaks.sort(function (a, b) {
      return a.position - b.position;
    });

    return peaks;
  }

  function getIntervals(peaks) {
    // What we now do is get all of our peaks, and then measure the distance to
    // other peaks, to create intervals.  Then based on the distance between
    // those peaks (the distance of the intervals) we can calculate the BPM of
    // that particular interval.

    // The interval that is seen the most should have the BPM that corresponds
    // to the track itself.

    var groups = [];

    peaks.forEach(function (peak, index) {
      for (var i = 1; index + i < peaks.length && i < 10; i++) {
        var group = {
          tempo: (60 * 44100) / (peaks[index + i].position - peak.position),
          count: 1
        };

        // de-root
        while (group.tempo < 90) {
          group.tempo *= 2;
        }

        // de-square
        while (group.tempo > 180) {
          group.tempo /= 2;
        }

        // rounding improve grouping
        group.tempo = Math.round(group.tempo);

        if (!groups.some(interval => interval.tempo === group.tempo ? interval.count++ : 0)) {
          groups.push(group);
        }
      }
    });
    return groups;
  }


  module.exports = analyzeTempo;
}());