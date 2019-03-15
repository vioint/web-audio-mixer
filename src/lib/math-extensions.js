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
  