import browserDetector from './lib/browser-detect';
import cryptoEngine from './lib/upload-page';

document.addEventListener("DOMContentLoaded", function() {
    browserDetector.detect();
    
    if ($('.encrypt-form').length) {
        cryptoEngine.initEngine();
    }
});