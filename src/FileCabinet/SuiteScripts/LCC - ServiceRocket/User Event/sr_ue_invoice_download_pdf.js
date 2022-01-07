/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */
define(['N/search', 'N/redirect', 'N/runtime','N/render', '../Library/sr_lib_invoice_template'],

function(search, redirect,runtime, render, libHelper) {
    var originalFolderId = 3878;

    function beforeLoad(scriptContext) {

    }

    function beforeSubmit(scriptContext) {

    }
    /**
     * Function definition to be triggered before record is loaded.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.newRecord - New record
     * @param {Record} scriptContext.oldRecord - Old record
     * @param {string} scriptContext.type - Trigger type
     * @Since 2015.2
     */
    function afterSubmit(scriptContext) {
         var newRecord = scriptContext.newRecord;
         var oldRecord = scriptContext.oldRecord;
         var currScript = runtime.getCurrentScript();
        if(scriptContext.type == 'create'){
            var invStatus = newRecord.getValue({fieldId: 'custbody_leacc_invoice_status'}); // 1- Draft ;2- ready to invoice
            if((invStatus == 1 || invStatus == 2)){
                var paramFolderId = currScript.getParameter('custscript_sr_ue_yp_param_folder');

                var folderId = (paramFolderId) ? paramFolderId : originalFolderId;
                if(newRecord.id){
                    libHelper.generatePDF(newRecord.id,folderId);
                }
            }
        }
        else if(scriptContext.type == 'edit' || scriptContext.type == 'xedit'){
            var invStatus = newRecord.getValue({fieldId: 'custbody_leacc_invoice_status'}); // 1- Draft ;2- ready to invoice
            var oldAmt= oldRecord.getValue({fieldId: 'amount'});
            var oldEntity= oldRecord.getValue({fieldId: 'entity'});
            var oldTrandate= oldRecord.getValue({fieldId: 'trandate'});
            var oldDuedate= oldRecord.getValue({fieldId: 'duedate'});
            var oldPostP= oldRecord.getValue({fieldId: 'postingperiod'});
            var oldTerms= oldRecord.getValue({fieldId: 'terms'});
            var oldBillAddress= oldRecord.getValue({fieldId: 'billaddress'});

            if((invStatus == 1 || invStatus == 2) && (oldAmt != newRecord.getValue({fieldId: 'amount'}) || oldDuedate != newRecord.getValue({fieldId: 'duedate'}) || oldTrandate != newRecord.getValue({fieldId: 'trandate'}) || oldBillAddress != newRecord.getValue({fieldId: 'billaddress'}) || oldTerms != newRecord.getValue({fieldId: 'terms'}) || oldPostP != newRecord.getValue({fieldId: 'postingperiod'}) || oldEntity != newRecord.getValue({fieldId: 'entity'}) )){

                var paramFolderId = currScript.getParameter('custscript_sr_ue_yp_param_folder');

                var folderId = (paramFolderId) ? paramFolderId : originalFolderId;
                /*log.debug('interbal id ',newRecord.id);
                log.debug('folderId',folderId)*/
                if(newRecord.id){
                    libHelper.generatePDF(newRecord.id,folderId);
                }
                
            }
        }
    }

    return {
        beforeLoad: beforeLoad,
        afterSubmit: afterSubmit,
        beforeSubmit: beforeSubmit
    };
    
});