/**
 * @NApiVersion 2.x
 * @NScriptType ScheduledScript
 * @NModuleScope SameAccount
 */
define(['N/record'],
/**
 * @param{record} record
 */
function(record) {
    function execute(scriptContext) {
        try{

            /*var recCharge  = record.load({
                type: 'charge',
                id : 14822,
                isDynamic : true
            });

            recCharge.setValue({
                fieldId : 'timerecord',
                value : ''
            });

            recCharge.save({
                ignoreMandatoryFields : true,
                enableSourcing : true
            });*/

            var recordId = 10523;
            var recTimeEntry = record.load({
                type : record.Type.TIME_BILL,
                id : recordId,
                isDynamic : true
            });

            recTimeEntry.setValue({
                fieldId : 'supervisorapproval',
                value : false
            });

            /*recTimeEntry.setValue({
                fieldId : 'custcol_sr_associated_actual_charge',
                value : 14822
            });*/

            recTimeEntry.save({
                ignoreMandatoryFields : true,
                enableSourcing : true
            });

        }catch (e) {
            log.debug('execute',e);
        }
    }

    return {
        execute: execute
    };
    
});
