/**
 * @NApiVersion 2.x
 * @NScriptType MapReduceScript
 * @NModuleScope SameAccount
 */
define(['N/record', 'N/runtime', 'N/search','../Library/sr_lib_invoice_summary.js'],
/**
 * @param{record} record
 * @param{runtime} runtime
 * @param{search} search
 */
function(record, runtime, search,libInvoiceSummary) {
    var currScript = runtime.getCurrentScript();
    function getInputData() {
        var saleOrderId = currScript.getParameter('custscript_sr_param_salesorder');
        var inSearchId = currScript.getParameter('custscript_sr_invoice_summary_ss');
        log.debug('saleOrderId',saleOrderId);
        var arrResults = [];
        if(saleOrderId){
            arrResults.push(saleOrderId);
        }else {
            if(inSearchId){
                arrResults = libInvoiceSummary.getSalesOrders(inSearchId);
            }
        }
        log.debug('arrResults',arrResults);
        return arrResults;
    }

    function map(context) {
        try{
            var salesOrderId  = JSON.parse(context.value);
            if(salesOrderId){
                libInvoiceSummary.updateInvoiceSummaryFields(salesOrderId);
            }
        }catch (e){
            log.debug('map=>e',e);
        }
    }
    function reduce(context) {

    }
    function summarize(summary) {

    }

    return {
        getInputData: getInputData,
        map: map,
        reduce: reduce,
        summarize: summarize
    };
    
});
