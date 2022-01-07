/**
 * @NApiVersion 2.x
 * @NScriptType workflowactionscript
 */
define(['../Library/sr_lib_set_time_entry_fields'],

function(lib) {
   
    /**
     * Definition of the Suitelet script trigger point.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.newRecord - New record
     * @param {Record} scriptContext.oldRecord - Old record
     * @Since 2016.1
     */
    function onAction(scriptContext) {
        lib.timeEntryPMO(scriptContext.newRecord);
    }

    return {
        onAction : onAction
    };
    
});
