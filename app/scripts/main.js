import browserDetector from './lib/browser-detect';
import cryptoEngine from './lib/upload-page';
import panelPage from './lib/panel-page';
import decryptPage from './lib/decrypt-page';

document.addEventListener("DOMContentLoaded", function() {
    browserDetector.detect();
    
    if ($('.encrypt-form').length) {
        cryptoEngine.initEngine();
    }

    if($('.file-list-wrapper').length) {
        panelPage.bindUIActions();
    }

    if($('.decrypt-files').length) {
        decryptPage.bindUIActions();
    }
});