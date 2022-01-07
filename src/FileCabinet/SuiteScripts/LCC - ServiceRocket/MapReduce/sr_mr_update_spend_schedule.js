/**
 * @NApiVersion 2.x
 * @NScriptType MapReduceScript
 */
define(['N/search', 'N/record', 'N/runtime', 'N/url','../Library/lcc_lib_timemaster.js'], function(search, record, runtime, url,libTimeMaster) {
    var exports = {};
    var scriptObj = runtime.getCurrentScript();

    function getInputData() {
        var arrData = [];
        var stData = scriptObj.getParameter({name: 'custscript_param_arrdata'});
        if(stData){
            arrData = JSON.parse(stData);
        }

        return arrData;
    }

    function map(context) {
        try {
            var objValue = JSON.parse(context.value);

            if(typeof objValue.spend_schedule_id != 'undefined' && typeof objValue.purchaseorder_id != 'undefined') {
                record.submitFields({
                    type: "customrecord_sr_spend_schedule",
                    id: objValue.spend_schedule_id,
                    values: { custrecord_sr_sp_sch_po_trans : objValue.purchaseorder_id }
                });
            }

        } catch (error) { log.error(error.name, error); }
    }


    exports.getInputData = getInputData;
    exports.map = map;
    return exports;
});