/*
ID              :   customscript_sr_ue_update_so_rates
Name            :   SR - UE Update SO Rates
Purpose         :   To update the SO Project Rate Fields
Created On      :   April 28, 2021
Author          :   Ceana Technology
Saved Searches  :   none
*/
/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */
define([],

function() {
   
    /**
     * Function definition to be triggered before record is loaded.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.newRecord - New record
     * @param {string} scriptContext.type - Trigger type
     * @param {Form} scriptContext.form - Current form
     * @Since 2015.2
     */
    function beforeLoad(scriptContext) {
        if (scriptContext.type === scriptContext.UserEventType.VIEW) {
            var currentForm = scriptContext.form;

            currentForm.addButton({
                id: 'custpage_update_rate',
                label: 'Refresh',
                functionName: 'callSuiteletScript'
            });

            currentForm.clientScriptModulePath = '../Client/sr_cs_update_so_rates.js'
        }
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

    }

    return {
        beforeLoad: beforeLoad,
        // beforeSubmit: beforeSubmit,
        // afterSubmit: afterSubmit
    };
    
});
