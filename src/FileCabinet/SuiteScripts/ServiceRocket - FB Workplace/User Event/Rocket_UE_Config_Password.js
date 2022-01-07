/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */
define(['N/ui/serverWidget'],

function(serverWidget) {
    function beforeLoad(scriptContext) {
        if (scriptContext.type !== scriptContext.UserEventType.VIEW)
            return;
        var objRecord = scriptContext.form;
        objRecord.getField({
            id: 'custrecord_input_token'
        }).updateDisplayType({
            displayType : serverWidget.FieldDisplayType.HIDDEN
        });
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
