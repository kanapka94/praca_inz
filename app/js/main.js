(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

var detector = {
    config: {
        wrapperSelector: '.main-wrapper',
        htmlErrorMsg: '<div><h2 class="detect-browser-text">System szyfrujący obecnie działa <span class="important">tylko</span> na przeglądarkach:<br>Google Chrome oraz Mozilla Firefox</h2></div>'
    },
    detect: function detect() {
        var isChromium = window.chrome,
            winNav = window.navigator,
            vendorName = winNav.vendor,
            isOpera = winNav.userAgent.indexOf('OPR') > -1,
            isIEedge = winNav.userAgent.indexOf('Edge') > -1,
            isIOSChrome = winNav.userAgent.match('CriOS'),
            isFirefox = navigator.userAgent.toLowerCase().indexOf('firefox') > -1,
            isMobileDevice = function isMobileDevice() {
            return typeof window.orientation !== 'undefined' || navigator.userAgent.indexOf('IEMobile') !== -1;
        };

        if (isChromium !== null && isChromium !== undefined && vendorName === 'Google Inc.' && isOpera == false && isIEedge == false) {} else {
            if (navigator.userAgent.toLowerCase().indexOf('firefox') <= -1) {
                detector.displayErrorMsg();
            }
        }
    },
    displayErrorMsg: function displayErrorMsg() {
        $(detector.config.wrapperSelector).html(detector.config.htmlErrorMsg);
    }
};

module.exports = {
    detect: detector.detect
};

},{}],2:[function(require,module,exports){
"use strict";

var _browserDetect = require("./lib/browserDetect");

var _browserDetect2 = _interopRequireDefault(_browserDetect);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

document.addEventListener("DOMContentLoaded", function () {
    _browserDetect2.default.detect();
});

},{"./lib/browserDetect":1}]},{},[2])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJhcHAvc2NyaXB0cy9saWIvYnJvd3NlckRldGVjdC5qcyIsImFwcC9zY3JpcHRzL21haW4uanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztBQ0FBLElBQUksV0FBVztBQUNYLFlBQVM7QUFDTCx5QkFBa0IsZUFEYjtBQUVMLHNCQUFlO0FBRlYsS0FERTtBQUtYLFlBQVMsa0JBQVc7QUFDaEIsWUFBSSxhQUFhLE9BQU8sTUFBeEI7QUFBQSxZQUNBLFNBQVMsT0FBTyxTQURoQjtBQUFBLFlBRUEsYUFBYSxPQUFPLE1BRnBCO0FBQUEsWUFHQSxVQUFVLE9BQU8sU0FBUCxDQUFpQixPQUFqQixDQUF5QixLQUF6QixJQUFrQyxDQUFDLENBSDdDO0FBQUEsWUFJQSxXQUFXLE9BQU8sU0FBUCxDQUFpQixPQUFqQixDQUF5QixNQUF6QixJQUFtQyxDQUFDLENBSi9DO0FBQUEsWUFLQSxjQUFjLE9BQU8sU0FBUCxDQUFpQixLQUFqQixDQUF1QixPQUF2QixDQUxkO0FBQUEsWUFNQSxZQUFZLFVBQVUsU0FBVixDQUFvQixXQUFwQixHQUFrQyxPQUFsQyxDQUEwQyxTQUExQyxJQUF1RCxDQUFDLENBTnBFO0FBQUEsWUFPQSxpQkFBaUIsU0FBakIsY0FBaUIsR0FBVztBQUN4QixtQkFBUSxPQUFPLE9BQU8sV0FBZCxLQUE4QixXQUEvQixJQUFnRCxVQUFVLFNBQVYsQ0FBb0IsT0FBcEIsQ0FBNEIsVUFBNUIsTUFBNEMsQ0FBQyxDQUFwRztBQUNILFNBVEQ7O0FBV0EsWUFBSSxlQUFlLElBQWYsSUFBdUIsZUFBZSxTQUF0QyxJQUFtRCxlQUFlLGFBQWxFLElBQW1GLFdBQVcsS0FBOUYsSUFBdUcsWUFBWSxLQUF2SCxFQUE4SCxDQUU3SCxDQUZELE1BRU87QUFDSCxnQkFBSSxVQUFVLFNBQVYsQ0FBb0IsV0FBcEIsR0FBa0MsT0FBbEMsQ0FBMEMsU0FBMUMsS0FBd0QsQ0FBQyxDQUE3RCxFQUFnRTtBQUM1RCx5QkFBUyxlQUFUO0FBQ0g7QUFDSjtBQUNKLEtBeEJVO0FBeUJYLHFCQUFrQiwyQkFBVztBQUN6QixVQUFFLFNBQVMsTUFBVCxDQUFnQixlQUFsQixFQUFtQyxJQUFuQyxDQUF3QyxTQUFTLE1BQVQsQ0FBZ0IsWUFBeEQ7QUFDSDtBQTNCVSxDQUFmOztBQThCQSxPQUFPLE9BQVAsR0FBaUI7QUFDYixZQUFTLFNBQVM7QUFETCxDQUFqQjs7Ozs7QUM5QkE7Ozs7OztBQUVBLFNBQVMsZ0JBQVQsQ0FBMEIsa0JBQTFCLEVBQThDLFlBQVc7QUFDckQsNEJBQWdCLE1BQWhCO0FBQ0gsQ0FGRCIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJ2YXIgZGV0ZWN0b3IgPSB7XG4gICAgY29uZmlnIDoge1xuICAgICAgICB3cmFwcGVyU2VsZWN0b3IgOiAnLm1haW4td3JhcHBlcicsXG4gICAgICAgIGh0bWxFcnJvck1zZyA6ICc8ZGl2PjxoMiBjbGFzcz1cImRldGVjdC1icm93c2VyLXRleHRcIj5TeXN0ZW0gc3p5ZnJ1asSFY3kgb2JlY25pZSBkemlhxYJhIDxzcGFuIGNsYXNzPVwiaW1wb3J0YW50XCI+dHlsa288L3NwYW4+IG5hIHByemVnbMSFZGFya2FjaDo8YnI+R29vZ2xlIENocm9tZSBvcmF6IE1vemlsbGEgRmlyZWZveDwvaDI+PC9kaXY+J1xuICAgIH0sXG4gICAgZGV0ZWN0IDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBpc0Nocm9taXVtID0gd2luZG93LmNocm9tZSxcbiAgICAgICAgd2luTmF2ID0gd2luZG93Lm5hdmlnYXRvcixcbiAgICAgICAgdmVuZG9yTmFtZSA9IHdpbk5hdi52ZW5kb3IsXG4gICAgICAgIGlzT3BlcmEgPSB3aW5OYXYudXNlckFnZW50LmluZGV4T2YoJ09QUicpID4gLTEsXG4gICAgICAgIGlzSUVlZGdlID0gd2luTmF2LnVzZXJBZ2VudC5pbmRleE9mKCdFZGdlJykgPiAtMSxcbiAgICAgICAgaXNJT1NDaHJvbWUgPSB3aW5OYXYudXNlckFnZW50Lm1hdGNoKCdDcmlPUycpLFxuICAgICAgICBpc0ZpcmVmb3ggPSBuYXZpZ2F0b3IudXNlckFnZW50LnRvTG93ZXJDYXNlKCkuaW5kZXhPZignZmlyZWZveCcpID4gLTEsXG4gICAgICAgIGlzTW9iaWxlRGV2aWNlID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICByZXR1cm4gKHR5cGVvZiB3aW5kb3cub3JpZW50YXRpb24gIT09ICd1bmRlZmluZWQnKSB8fCAobmF2aWdhdG9yLnVzZXJBZ2VudC5pbmRleE9mKCdJRU1vYmlsZScpICE9PSAtMSk7XG4gICAgICAgIH07XG5cbiAgICAgICAgaWYgKGlzQ2hyb21pdW0gIT09IG51bGwgJiYgaXNDaHJvbWl1bSAhPT0gdW5kZWZpbmVkICYmIHZlbmRvck5hbWUgPT09ICdHb29nbGUgSW5jLicgJiYgaXNPcGVyYSA9PSBmYWxzZSAmJiBpc0lFZWRnZSA9PSBmYWxzZSkge1xuICAgICAgICAgICAgXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBpZiAobmF2aWdhdG9yLnVzZXJBZ2VudC50b0xvd2VyQ2FzZSgpLmluZGV4T2YoJ2ZpcmVmb3gnKSA8PSAtMSkge1xuICAgICAgICAgICAgICAgIGRldGVjdG9yLmRpc3BsYXlFcnJvck1zZygpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9ICAgICAgICBcbiAgICB9LFxuICAgIGRpc3BsYXlFcnJvck1zZyA6IGZ1bmN0aW9uKCkge1xuICAgICAgICAkKGRldGVjdG9yLmNvbmZpZy53cmFwcGVyU2VsZWN0b3IpLmh0bWwoZGV0ZWN0b3IuY29uZmlnLmh0bWxFcnJvck1zZyk7XG4gICAgfVxufTtcblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgZGV0ZWN0IDogZGV0ZWN0b3IuZGV0ZWN0XG59IiwiaW1wb3J0IGJyb3dzZXJEZXRlY3RvciBmcm9tICcuL2xpYi9icm93c2VyRGV0ZWN0JztcblxuZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihcIkRPTUNvbnRlbnRMb2FkZWRcIiwgZnVuY3Rpb24oKSB7XG4gICAgYnJvd3NlckRldGVjdG9yLmRldGVjdCgpO1xufSk7Il19
