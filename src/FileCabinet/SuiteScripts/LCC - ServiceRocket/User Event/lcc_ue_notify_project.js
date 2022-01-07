/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */
define(['N/record', 'N/runtime','../Library/lcc_lib_project.js'],
/**
 * @param{record} record
 * @param{runtime} runtime
 */
function(record, runtime,libHelper) {
    function beforeLoad(scriptContext) {

    }
    function beforeSubmit(scriptContext) {

    }
    function afterSubmit(scriptContext) {
       var objRecord = scriptContext.newRecord;
       var statusResult = libHelper.validateProjectStatus(objRecord);
       log.debug('statusResult',statusResult);
       if(statusResult.status){
            libHelper.sendNotification(-5,103847,'Project Notification',statusResult.message);
       }
    }



    return {
        beforeLoad: beforeLoad,
        beforeSubmit: beforeSubmit,
        afterSubmit: afterSubmit
    };
    
});
