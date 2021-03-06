const SETTINGS = {
    wrapperSelector : '.main-wrapper',
    text : {
        html : {
            detectErrorMsg : '<div><h2 class="detect-browser-text">System szyfrujący obecnie działa <span class="important">tylko</span> na przeglądarkach:<br>Google Chrome oraz Mozilla Firefox</h2></div>'
        }
    }
};

const detector = {
    detect : function() {
        let isChromium = window.chrome,
            winNav = window.navigator,
            vendorName = winNav.vendor,
            isOpera = winNav.userAgent.indexOf('OPR') > -1,
            isIEedge = winNav.userAgent.indexOf('Edge') > -1,
            isIOSChrome = winNav.userAgent.match('CriOS'),
            isFirefox = navigator.userAgent.toLowerCase().indexOf('firefox') > -1,
            isMobileDevice = function() {
                return (typeof window.orientation !== 'undefined') || (navigator.userAgent.indexOf('IEMobile') !== -1);
            };

        if (isChromium !== null && isChromium !== undefined && vendorName === 'Google Inc.' && isOpera == false && isIEedge == false) {
            
        } else {
            if (navigator.userAgent.toLowerCase().indexOf('firefox') <= -1) {
                detector.displayErrorMsg();
            }
        }        
    },
    displayErrorMsg : function() {
        $(SETTINGS.wrapperSelector).html(SETTINGS.text.html.detectErrorMsg);
    },
    init : function() {
        detector.detect();
    }
};

module.exports = {
    detect : detector.init
}