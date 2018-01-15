import popup from './alert-box';

const SETTINGS = {
    text : {
        html : {
            fileNameNotChanged : 'Nie zmieniona',
            fileNameNotAvailable : 'nie dostępna'
        },
        popup : {
            loadPrivateKey : 'Wczytano klucz prywatny!',
            errorLoadPrivateKey : 'Nie można wczytać klucza prywatnego!',
            wrongFileKey : 'Zły plik "file_key" !',
            wrongIVFile : 'Zły plik "file_iv" !',
            fileEncrypted : 'Odszyfrowano plik!',
        }
    }
};

const CRYPTO_ENGINE = {
    passCrypto: null,
    privateKeyLoaded: false,
    aesKey: null,
    generatedIV: null,
    config: {
        setPrivateKey: function () {
            let file = document.querySelector('.decrypt-files__private-key').files[0];
            if (file) {
                let reader = new FileReader();
                reader.readAsText(file, 'UTF-8');
                reader.onload = function (evt) {
                    CRYPTO_ENGINE.passCrypto.setPrivateKey(evt.target.result);
                    CRYPTO_ENGINE.privateKeyLoaded = true;
                    APP.loadedFiles++;
                    APP.checkLoadedFilesCount();
                    popup.showAlert('success', 'Sukces:', SETTINGS.text.popup.loadPrivateKey);
                }
                reader.onerror = function (evt) {
                    popup.showAlert('error', 'Błąd: ', SETTINGS.text.popup.errorLoadPrivateKey);
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
                CRYPTO_ENGINE.aesKey = key;
                let encryptedBytes = base64js.toByteArray(encryptedFileInBase64);
                let fileData = new Uint8Array(encryptedBytes);
                APP.loadIVFile(fileData, fileName, fileType);
            }).catch(function(err){
                popup.showAlert('error', 'Błąd:', SETTINGS.text.popup.wrongFileKey);
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
            $('.loader').remove();
            APP.saveFile(new Uint8Array(decrypted), fileName, fileType);
            popup.showAlert('success', 'Sukces:', SETTINGS.text.popup.fileEncrypted);
        }).catch(function(err){
            popup.showAlert('error', 'Błąd:', SETTINGS.text.popup.wrongFileKey);
        });
    }
};

const APP = {
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
            const $field = $('.decrypt-btn');
            $field.click(function() {
                if($field.hasClass('blocked')) {
                    return;
                }
                $('.loader').css('display', 'block');
                let file = APP.getDownloadedFile();
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
                    let uploadedFile = document.querySelector('.decrypt-files__main-file').files[0];
                    let fileName = uploadedFile.name;
                    let tmpFileName = fileName.substr(0,fileName.length-8);
                    let finalFileName = tmpFileName.substr(0, tmpFileName.length);
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
                            $('.decrypt-files__main-file-original-name').html(SETTINGS.text.html.fileNameNotChanged);
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
                    $('.decrypt-files__main-file-original-name').html(SETTINGS.text.html.fileNameNotAvailable);
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
        let encryptedFile = document.querySelector('.additional-files-wrapper__file-iv').files[0];
        let reader = new FileReader();
        reader.readAsText(encryptedFile, 'utf-8');
        reader.onload = function() {
            let encryptedFile = reader.result;
            let base64String = CRYPTO_ENGINE.decryptRSA(encryptedFile);
            let ivKey = base64js.toByteArray(base64String);
            CRYPTO_ENGINE.generatedIV = ivKey;
            CRYPTO_ENGINE.decryptAES(fileData, fileName, fileType);
        };
        reader.onerror = function (error) {
            popup.showAlert('error', 'Błąd:', SETTINGS.text.popup.wrongIVFile);
        };
        reader.onprogress = function(data) {
            if (data.lengthComputable) {
                let progress = parseInt( ((data.loaded / data.total) * 100), 10 );
                console.log(progress);
            }
        };
    },
    loadKeyFile: function (fileData, fileName, fileType) {
        let encryptedFile = document.querySelector('.additional-files-wrapper__file-key').files[0];
        let reader = new FileReader();
        reader.readAsText(encryptedFile, 'utf-8');
        reader.onload = function() {
            let jsonEncrypted = reader.result;
            let decryptedFile = CRYPTO_ENGINE.decryptRSA(jsonEncrypted);
            let fileKey = JSON.parse(decryptedFile);
            CRYPTO_ENGINE.config.importAESKey(fileKey, fileData, fileName, fileType);
        };
        reader.onerror = function (error) {
            popup.showAlert('error', 'Błąd:', SETTINGS.text.popup.wrongFileKey);
        };
        reader.onprogress = function(data) {
            if (data.lengthComputable) {
                let progress = parseInt( ((data.loaded / data.total) * 100), 10 );
                console.log(progress);
            }
        };
    },
    getBlob: function() {
        return Blob;
    },
    saveFile: function(byteData, fileName, fileType) {
        let BB = APP.getBlob();
        saveAs(
            new BB([byteData], { type : fileType }),
            fileName
        );
    },
    decryptAndDownload: function(base64File) {
        let reader = new FileReader();
        reader.onload = function() {
            let fileType = $('.decrypt-files__main-file-type').val();
            let base64String = reader.result;
            let fileName = $('.decrypt-files__main-file-original-name').text();
            APP.loadKeyFile(base64String, fileName, fileType);
        };
        reader.onerror = function (error) {
            console.log('Error: ', error);
        };
        reader.onprogress = function(data) {
            if (data.lengthComputable) {
                let progress = parseInt( ((data.loaded / data.total) * 100), 10 );
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
