/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */
define(['../Library/lcc_lib_timemaster.js'],

function(libHelper) {
    function beforeLoad(scriptContext) {
        try{
            var recInvoice = scriptContext.newRecord;
            if (scriptContext.type !== scriptContext.UserEventType.VIEW)
                return;
            var form = scriptContext.form;
            var urlLink =  libHelper.getURL('customscript_lcc_sl_delete_timemaster','customdeploy_lcc_sl_delete_timemaster');
            urlLink += '&timemasterid='+recInvoice.id;
            var stOnCall = "deleteTimeMaster('" + urlLink+ "')" ;
            form.addButton({
                id : 'custpage_deletetimemaster',
                label : 'Delete Time Master',
                functionName : stOnCall
            });

            form.clientScriptModulePath = '../Client/lcc_cs_delete_timemaster.js'
        }catch (e) {
            log.debug('beforeLoad',e);
        }
    }
    function beforeSubmit(scriptContext) {

    }
    function afterSubmit(scriptContext) {

    }

    return {
        beforeLoad: beforeLoad,
        beforeSubmit: beforeSubmit,
        afterSubmit: afterSubmit
    };
    
});
