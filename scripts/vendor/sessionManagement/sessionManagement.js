(function($) {
    $.fn.sessionManagement = function(sessionTime, callback) {
        (function() {

            var IDLE_TIMEOUT = sessionTime; //seconds
            var _idleSecondsCounter = 0;
            var previousTime  = localStorage.getItem("previousTime");
            var currentTime = new Date();
            var localStorageTime = Date.parse(previousTime);
            var diff = Math.abs(currentTime.getTime() - localStorageTime); 
            var timeDiffer = diff/1014 ; 

            document.onclick = function() {
                _idleSecondsCounter = 0;
            };
            document.onmousemove = function() {
                 var time = new Date();
                localStorage.setItem("previousTime", time);
                _idleSecondsCounter = 0;
            };
            document.onkeypress = function() {
                var time = new Date();
                localStorage.setItem("previousTime", time);
                _idleSecondsCounter = 0;
            };

            if (true) {
                var sesTimer = window.setInterval(CheckIdleTime, 1000);
            }

            function CheckIdleTime() {
                _idleSecondsCounter++;
                if ((IDLE_TIMEOUT - _idleSecondsCounter == 0 )|| timeDiffer >= IDLE_TIMEOUT ) {
                    callback();
                }
                if (_idleSecondsCounter >= IDLE_TIMEOUT  || timeDiffer >= IDLE_TIMEOUT) {
                    localStorage.setItem("previousTime", null);
                    clearInterval(sesTimer);
                }
            }
        })();
    };
}(jQuery));