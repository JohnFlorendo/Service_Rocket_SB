/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */
define(['N/ui/serverWidget','N/file'],

function(serverWidget,file) {
    function onRequest(context) {
        if(context.request.method == 'GET'){
            var fileId = context.request.parameters.fileid;
            if(fileId){
                var fileObj = file.load({id: fileId});
                var pdfContent = fileObj.getContents();
                context.response.writeFile(fileObj);
            }

        }
    }

    return {
        onRequest: onRequest
    };
    
});
