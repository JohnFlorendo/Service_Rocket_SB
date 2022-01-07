/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */
define(['N/file','N/runtime','N/ui/serverWidget','../Library/lcc_lib_box'],
function(file,runtime, serverWidget,libBox) {


    function onRequest(context) {
         if(context.request.method == 'GET'){
             buildUI(context);
         }else{
             try{
                 sendFile(context);
             }catch (e) {
                 log.debug('error',e);
             }

         }
    }
    
    function  buildUI(context) {
        var form = serverWidget.createForm('Upload to BOX');
        var filegroup = form.addFieldGroup({
            id: 'custpage_group',
            label : 'Folder'
        });

        var fldFILE = form.addField({
            id : 'custpage_file',
            type : serverWidget.FieldType.FILE,
            label : 'File'
        });

        var fldFolderName = form.addField({
            id : 'custpage_foldername',
            type : serverWidget.FieldType.TEXT,
            label : 'Folder Name',
            container : 'custpage_group'
        });

        var fldFolderParent = form.addField({
            id : 'custpage_folderparent',
            type : serverWidget.FieldType.SELECT,
            label : 'Parent Folder',
            container : 'custpage_group'
        });

        filegroup.isSingleColumn = true;

        var arrFolders = libBox.getAllFolders();

        fldFolderParent.addSelectOption({
            value : '',
            text : ''
        });
        for(var f in arrFolders){

            fldFolderParent.addSelectOption({
                value : arrFolders[f].id,
                text : arrFolders[f].name
            });
        }


        form.addSubmitButton('Submit');
        context.response.writePage(form);

    }

    function  sendFile(context) {
        var form = serverWidget.createForm(' ');
        var stHTML = '';
        try{

            var stFolder = context.request.parameters['custpage_foldername'];
            var stParentFolder = context.request.parameters['custpage_folderparent'];

            log.debug('stFolder',stFolder);
            var folderId = (libBox.getFolderInBOX(stFolder,stParentFolder)) ? libBox.getFolderInBOX(stFolder,stParentFolder) : libBox.createFolderInBOX(stFolder,stParentFolder);
            log.debug('folderId',folderId);
            if(folderId){
                var objFile = context.request.files['custpage_file'];
                log.debug('objFile',objFile);
                var objResult = libBox.uploadFile(objFile,folderId);
                log.debug('objResult',objResult);
                if(objResult.isSuccess){
                    stHTML += '<div id="div__alert"><div class="uir-alert-box confirmation session_confirmation_alert" width="100%" role="status" style="">';
                    stHTML +=  '<div class="icon confirmation"><img src="/images/icons/messagebox/icon_msgbox_confirmation.png" alt=""></div>';
                    stHTML +=  '<div class="content"><div class="title">Confirmation</div><div class="descr">Successfully created in BOX drive</a> </div></div></div></div>';
                }else{
                    stHTML += '<div id="div__alert"><div class="uir-alert-box error session_error_alert" width="100%" role="status" style="">';
                    stHTML +=  '<div class="icon error"><img src="/images/icons/messagebox/icon_msgbox_error.png" alt=""></div>';
                    stHTML +=  '<div class="content"><div class="title">Error</div><div class="descr">'+ objResult.message +'</div></div></div></div>';
                }
                /*for(var indx = 0;  indx < arrFiles.length; indx++){
                    uploadFile(file.load(arrFiles[indx].fileid),folderId);
                }*/
            }

        }catch (e) {
            log.debug('sendFile-error',e);
            stHTML += '<div id="div__alert"><div class="uir-alert-box error session_error_alert" width="100%" role="status" style="">';
            stHTML +=  '<div class="icon error"><img src="/images/icons/messagebox/icon_msgbox_error.png" alt=""></div>';
            stHTML +=  '<div class="content"><div class="title">Error</div><div class="descr">'+ e.message +'</div></div></div></div>';
        }

        form.addField({
            id : 'custpage_message',
            type : serverWidget.FieldType.INLINEHTML,
            label : 'HTML'
        }).defaultValue = stHTML;

        context.response.writePage(form);
    }
    return {
        onRequest: onRequest
    };
    
});
