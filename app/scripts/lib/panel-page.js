import popup from './alert-box';

const APP = {
    setupAjaxHeader : function() {
        $.ajaxSetup({
            headers: {
                'X-CSRF-TOKEN': $('meta[name="csrf-token"]').attr('content')
            }
        });
    },
    deleteFile: function(_fileId, parentNode) {
        $.ajax({
            type: 'POST',
            url: 'delete',
            data: { 
                'fileId' : _fileId,
                '_token' : $('meta[name="csrf-token"]').attr('content')
            },
            dataType: 'json',
            success: function (response) {
                popup.showAlert(response.type, response.title, response.text);
                if(response.type === 'success') {
                    parentNode.remove();
                }
            },
            error: function (response) {
                popup.showAlert('error', 'Błąd:', response.responseText);
                console.log('Błąd:', response.responseText);
            }
        });
    },
    showDeleteFilePrompt: function (fileName, fileId, parentNode) {
        let answer = confirm('Usuwanie: '+ fileName +'\n\nCzy na pewno chcesz usunąć plik?');
        if(answer) {
            APP.deleteFile(fileId, parentNode);
        }
    },
    config: {
        bindDeleteFileEvent: function() {
            const $field = $('.fa-trash');
            $field.click(function (event) {
                event.preventDefault();
                let fileName = $(this).parents('.top-section').find('.top-section__name').text();
                let fileId = $(this).parents('.file-wrapper').find('.file-id').text();
                APP.showDeleteFilePrompt(fileName,fileId, $(this).parents('.file-wrapper'));
            })
        }
    },
    init : function() {
        APP.setupAjaxHeader();
        APP.config.bindDeleteFileEvent();
    }
};

module.exports = {
    bindUIActions : APP.init
};
