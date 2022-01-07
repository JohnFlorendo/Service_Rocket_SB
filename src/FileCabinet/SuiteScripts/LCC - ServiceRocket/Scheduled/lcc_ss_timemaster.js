/**
 * @NApiVersion 2.x
 * @NScriptType ScheduledScript
 * @NModuleScope SameAccount
 */

define(['N/runtime','../Library/lcc_lib_timemaster.js'],
function(runtime,libHelper) {
    var currScript = runtime.getCurrentScript();
    function execute(scriptContext) {
        try{
            var stTimeId = currScript.getParameter('custscript_param_timerecord_id');
            log.debug('stTimeId',stTimeId);
            if(stTimeId){
                var stMasterId = libHelper.searchTimeMaster(stTimeId);
                var stChargeId = libHelper.getChargeByTimeId(stTimeId);
                log.debug('stMasterId',stMasterId);
                log.debug('stChargeId',stChargeId);
                if(stMasterId){
                    if(stChargeId){
                        log.debug('UPDATE TIME MASTER');
                        var chargeTransactions = libHelper.getTransactionByCharge(stChargeId)
                        libHelper.attachCharge(stMasterId,stChargeId,chargeTransactions);
                    }else{
                        log.debug('NOT UPDATE TIME MASTER');
                    }
                }else{
                    log.debug('CREATE TIME MASTER');
                    libHelper.createTimeMaster(stTimeId,stChargeId);
                }
            }
        }catch (e) {
            log.debug('execute=>error',e);
        }
    }

    return {
        execute: execute
    };
    
});
