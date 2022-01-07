/*
ID              :   customscript_sr_sl_update_so_rates
Name            :   SR - SL Update SO Rates
Purpose         :   To update the SO Project Rate Fields
Created On      :   April 28, 2021
Author          :   Ceana Technology
Saved Searches  :   none
*/
/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */
define(['../Library/lcc_lib_timemaster', 'N/record'],

function(libTime, record) {
   
    /**
     * Definition of the Suitelet script trigger point.
     *
     * @param {Object} context
     * @param {ServerRequest} context.request - Encapsulation of the incoming request
     * @param {ServerResponse} context.response - Encapsulation of the Suitelet response
     * @Since 2015.2
     */
    function onRequest(context) {
        try {
            var inTimeBillID = context.request.parameters.recordId;
            log.debug('inTimeBillID', inTimeBillID);

            if(inTimeBillID) {
                var inTimeMasterID = libTime.searchTimeMaster(inTimeBillID);
                log.debug('inTimeMasterID', inTimeMasterID);

                if (inTimeMasterID) {
                    var recTimeMaster = record.load({
                        type: 'customrecord_sr_time_master',
                        id: inTimeMasterID,
                        isDynamic: true
                    });

                    var objTimeEntryFields = libTime.getTimeEntryDetails(inTimeBillID);
                    var inChargeId = libTime.getChargeByTimeId(inTimeBillID);
                    var objTransactionByCharge = libTime.getTransactionByCharge(inChargeId);
                    var objSalesOrderProjectRates = libTime.calculateSumAndDivideByTimeBasedLine(objTransactionByCharge.salesOrder, objTimeEntryFields.inItem);

                    libTime.setRatePerHourOrig(recTimeMaster, objSalesOrderProjectRates);
                    libTime.setServiceItem(recTimeMaster, objSalesOrderProjectRates);
                    libTime.setUSDRatePerHour(recTimeMaster, objSalesOrderProjectRates);
                    libTime.setOrigCurrency(recTimeMaster, objSalesOrderProjectRates);

                    var id = recTimeMaster.save();

                    log.debug('Success Update SO Project Rates', id);
                }
            }
        } catch (e) {
            log.debug('onRequest ->',e);
        }
    }

    return {
        onRequest: onRequest
    };
    
});
