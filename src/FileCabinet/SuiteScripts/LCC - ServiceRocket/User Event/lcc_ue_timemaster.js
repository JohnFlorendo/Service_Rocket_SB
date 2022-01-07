/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */
define(['../Library/lcc_lib_timemaster.js'], function(libHelper) {
    function afterSubmit(scriptContext) {
       try {
           var recTime = scriptContext.newRecord;
           if(recTime.id) {
               var intMasterId = recTime.id;
               var intTimeId = recTime.getValue(libHelper.TIME_MASTER.TIME);
               if(intMasterId && intTimeId) {
                   libHelper.updateTimeMaster(intMasterId,intTimeId);
               }
           }

       } catch (e) { log.debug('afterSubmit=>e',e); }
    }

    return { afterSubmit: afterSubmit };
    
});
