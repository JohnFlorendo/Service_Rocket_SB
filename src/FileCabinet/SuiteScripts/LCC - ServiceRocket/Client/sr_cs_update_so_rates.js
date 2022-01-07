/*
ID              :
Name            :
Purpose         :   To update the SO Project Rate Fields
Created On      :   April 28, 2021
Author          :   Ceana Technology
Saved Searches  :   none
*/

/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['N/url', 'N/currentRecord','N/https' ,'N/ui/message'],

function(url, currentRecord, https, message) {
    
    /**
     * Function to be executed after page is initialized.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.mode - The mode in which the record is being accessed (create, copy, or edit)
     *
     * @since 2015.2
     */
    function pageInit(scriptContext) {

    }

    function callSuiteletScript() {
        var record = currentRecord.get();
        var inTimeBillID = record.getValue({
            fieldId : 'custrecord_sr_time_entry'
        });

        if (inTimeBillID) {
            var relativePath = url.resolveScript({
                scriptId: 'customscript_sr_sl_update_so_rates',
                deploymentId: 'customdeploy_sr_sl_update_so_rates',
                returnExternalUrl: true
            });

            var params = '&recordId=' + inTimeBillID;

            var slUrl = relativePath + params;
            https.get({
                url: slUrl
            }).body;

            var myMsg = message.create({
                title: 'Refresh',
                message: 'Please wait 1 - 2 minutes to refresh this page.',
                type: message.Type.INFORMATION
            });
            myMsg.show();

            window.location.reload();
        } else {
            alert('Time Master has no related Time Entry Record. Please check this record.');
        }
    }

    return {
        pageInit : pageInit,
        callSuiteletScript : callSuiteletScript
    };
    
});
