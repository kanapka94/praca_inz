import popup from './alert-box';

var CRYPTO_ENGINE = {
    passCrypto: null,
    privateKeyLoaded: false,
    aesKey: null,
    generatedIV: null,
    config: {
        setPrivateKey: function () {
            var file = document.querySelector('.decrypt-files__private-key').files[0];
            if (file) {
                var reader = new FileReader();
                reader.readAsText(file, 'UTF-8');
                reader.onload = function (evt) {
                    CRYPTO_ENGINE.passCrypto.setPrivateKey(evt.target.result);
                    CRYPTO_ENGINE.privateKeyLoaded = true;
                    APP.loadedFiles++;
                    APP.checkLoadedFilesCount();
                    popup.showAlert('success', 'Sukces:', 'Wczytano klucz prywatny!');
                }
                reader.onerror = function (evt) {
                    popup.showAlert('error', 'Błąd: ', 'Nie można wczytać klucza prywatnego!');
                }
            }
        },
        importAESKey: function(data, encryptedFileInBase64, fileName, fileType) {
            window.crypto.subtle.importKey(
                "jwk",
                {
                    kty: data.kty,
                    k: data.k,
                    alg: data.alg,
                    ext: true,
                },
                {
                    name: "AES-GCM",
                },
                false,
                ["encrypt", "decrypt"]
            ).then(function(key){
                console.log('Klucz zaimportowany');
                CRYPTO_ENGINE.aesKey = key;
                var encryptedBytes = base64js.toByteArray(encryptedFileInBase64);
                var fileData = new Uint8Array(encryptedBytes);
                APP.loadIVFile(fileData, fileName, fileType);
            }).catch(function(err){
                popup.showAlert('error', 'Błąd:', 'Zły plik "file_key" !');
            });
        },
    },
    init: function() {
        CRYPTO_ENGINE.passCrypto = new JSEncrypt();
        CRYPTO_ENGINE.config.setPrivateKey();
    },
    decryptRSA: function(data) {
        return CRYPTO_ENGINE.passCrypto.decrypt(data);
    },
    decryptAES: function(data, fileName, fileType) {
        window.crypto.subtle.decrypt(
            {
                name: "AES-GCM",
                iv: CRYPTO_ENGINE.generatedIV,
            },
            CRYPTO_ENGINE.aesKey,
            data
        ).then(function(decrypted){
            APP.saveFile(new Uint8Array(decrypted), fileName, fileType);
            popup.showAlert('success', 'Sukces:', 'Odszyfrowano plik!');
        }).catch(function(err){
            popup.showAlert('error', 'Błąd:', 'Zły plik "file_key" !');
        });
    }
};

var APP = {
    loadedFiles: 0,
    config: {
        setupAjaxHeader : function() {
            $.ajaxSetup({
                headers: {
                    'X-CSRF-TOKEN': $('meta[name="csrf-token"]').attr('content')
                }
            });
        },
        bindDecryptFileEvent: function () {
            var $field = $('.decrypt-btn');
            $field.click(function() {
                if($field.hasClass('blocked')) {
                    return;
                }
                var file = APP.getDownloadedFile();
                APP.decryptAndDownload(file);
            });
        },
        bindLoadFilesEvents: function () {
            $('.decrypt-files__private-key').change(function () {
                CRYPTO_ENGINE.config.setPrivateKey();
            });
            $('.decrypt-files__main-file').change(function () {
                APP.loadedFiles++;
                APP.checkLoadedFilesCount();
            });
            $('.additional-files-wrapper__file-key').change(function () {
                APP.loadedFiles++;
                APP.checkLoadedFilesCount();
            });
            $('.additional-files-wrapper__file-iv').change(function () {
                APP.loadedFiles++;
                APP.checkLoadedFilesCount();
            });

        },
        bindDecryptFileNameEvent: function() {
            $('.decrypt-files__main-file').change(function () {
                if ($(this).val() !== '') {
                    var uploadedFile = document.querySelector('.decrypt-files__main-file').files[0];
                    var fileName = uploadedFile.name;
                    var tmpFileName = fileName.substr(0,fileName.length-8);
                    var finalFileName = tmpFileName.substr(0, tmpFileName.length);
                    $.ajax({
                        url: 'decryptFileName',
                        type: 'POST',
                        dataType: 'json',
                        data: { 
                            encryptedFileName: finalFileName,
                            '_token' : $('meta[name="csrf-token"]').attr('content')
                        },
                    })
                    .done(function(response) {
                        $('.decrypt-files__label').addClass('label--blue');
                        if (response.originalFileName) {
                            $('.decrypt-files__main-file-original-name').html(response.originalFileName);
                            $('.decrypt-files__hint').addClass('active');
                        } else {
                            $('.decrypt-files__main-file-original-name').html('Nie zmieniona');
                        }
                    })
                    .fail(function(response) {
                        console.log('error');
                    })
                    .always(function() {
                        console.log("complete");
                    });

                } else {
                    $('.decrypt-files__label').removeClass('label--blue');
                    $('.decrypt-files__hint').removeClass('active');
                    $('.decrypt-files__main-file-original-name').html('nie dostępna');
                }
            });
        }
    },
    checkLoadedFilesCount: function () {
        if(APP.loadedFiles >= 4) {
            $('.decrypt-btn').removeClass('blocked');
        }
    },
    getDownloadedFile: function() {
        return document.querySelector('.decrypt-files__main-file').files[0];
    },
    loadIVFile: function (fileData, fileName, fileType) {
        var encryptedFile = document.querySelector('.additional-files-wrapper__file-iv').files[0];
        var reader = new FileReader();
        reader.readAsText(encryptedFile, 'utf-8');
        reader.onload = function() {
            var encryptedFile = reader.result;
            var base64String = CRYPTO_ENGINE.decryptRSA(encryptedFile);
            var ivKey = base64js.toByteArray(base64String);
            CRYPTO_ENGINE.generatedIV = ivKey;
            CRYPTO_ENGINE.decryptAES(fileData, fileName, fileType);
        };
        reader.onerror = function (error) {
            popup.showAlert('error', 'Błąd:', 'Zły plik "file_iv" !');
        };
        reader.onprogress = function(data) {
            if (data.lengthComputable) {
                var progress = parseInt( ((data.loaded / data.total) * 100), 10 );
                console.log(progress);
            }
        };
    },
    loadKeyFile: function (fileData, fileName, fileType) {
        var encryptedFile = document.querySelector('.additional-files-wrapper__file-key').files[0];
        var reader = new FileReader();
        reader.readAsText(encryptedFile, 'utf-8');
        reader.onload = function() {
            var jsonEncrypted = reader.result;
            var decryptedFile = CRYPTO_ENGINE.decryptRSA(jsonEncrypted);
            var fileKey = JSON.parse(decryptedFile);
            CRYPTO_ENGINE.config.importAESKey(fileKey, fileData, fileName, fileType);
        };
        reader.onerror = function (error) {
            popup.showAlert('error', 'Błąd:', 'Zły plik "file_key" !');
        };
        reader.onprogress = function(data) {
            if (data.lengthComputable) {
                var progress = parseInt( ((data.loaded / data.total) * 100), 10 );
                console.log(progress);
            }
        };
    },
    getBlob: function() {
        return Blob;
    },
    saveFile: function(byteData, fileName, fileType) {
        var BB = APP.getBlob();
        saveAs(
            new BB([byteData], { type : fileType }),
            fileName
        );
    },
    decryptAndDownload: function(base64File) {
        var reader = new FileReader();
        reader.onload = function() {
            var fileType = $('.decrypt-files__main-file-type').val();
            var base64String = reader.result;
            let fileName = $('.decrypt-files__main-file-original-name').text();
            APP.loadKeyFile(base64String, fileName, fileType);
        };
        reader.onerror = function (error) {
            console.log('Error: ', error);
        };
        reader.onprogress = function(data) {
            if (data.lengthComputable) {
                var progress = parseInt( ((data.loaded / data.total) * 100), 10 );
                console.log(progress);
            }
        };
        reader.readAsText(base64File, 'utf-8');
    },
    init : function() {
        CRYPTO_ENGINE.init();
        APP.config.setupAjaxHeader();
        APP.config.bindLoadFilesEvents();
        APP.config.bindDecryptFileEvent();
        APP.config.bindDecryptFileNameEvent();
    }
};

module.exports = {
    bindUIActions : APP.init
};
