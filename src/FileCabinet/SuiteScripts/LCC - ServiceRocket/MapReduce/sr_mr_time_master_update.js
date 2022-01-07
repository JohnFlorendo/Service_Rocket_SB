/**
 * @NApiVersion 2.x
 * @NScriptType MapReduceScript
 */
define(['N/search', 'N/record', 'N/runtime', 'N/url','../Library/lcc_lib_timemaster.js'], function(search, record, runtime, url,libTimeMaster) {
    var exports = {};
    var scriptObj = runtime.getCurrentScript();

    function getInputData() {
        var arrTimeOfMasters = scriptObj.getParameter({name: 'custscript_time_masters_id'});
        var arrResults = [];

        if(arrTimeOfMasters) {
            arrResults = JSON.parse(arrTimeOfMasters);
        } else {
            var searchID = scriptObj.getParameter({name: 'custscript_savesearch_id'});
            var searchResults = search.load({ id: searchID }); // /** SCRIPT USED **/ Custom Time Master Search
            var columns = searchResults.columns
            var myPagedData = searchResults.runPaged({ pageSize: 1000 });
            myPagedData.pageRanges.forEach(function(pageRange) {
                var myPage = myPagedData.fetch({ index: pageRange.index });
                myPage.data.forEach(function(result) {
                    var objData = {};
                    for(var intIndex in columns) {
                        objData[columns[intIndex].name] = result.getValue(columns[intIndex])
                    }
                    objData["recordid"] = result.id;
                    arrResults.push(objData);
                });
            });
        }

        return arrResults;
    }

    function map(context) {
        try {
            var searchResult = JSON.parse(context.value);
            var timeMasterId = searchResult.recordid;
            if(timeMasterId) {
                var recTimeMasterRecord = record.load({
                    type: libTimeMaster.TIME_MASTER.TYPE,
                    id : timeMasterId,
                    isDynamic: true
                });

                var timeBillId = recTimeMasterRecord.getValue(libTimeMaster.TIME_MASTER.TIME);
                var objTimeEntryFields = libTimeMaster.getTimeEntryDetails(timeBillId);
                var inChargeId = libTimeMaster.getChargeByTimeId(timeBillId);
                var objTransactionByCharge = libTimeMaster.getTransactionByCharge(inChargeId);
                var stProjectFields = libTimeMaster.getProjectFields(objTimeEntryFields.inProject);
                var objSalesOrderProjectRates = libTimeMaster.calculateSumAndDivideByTimeBasedLine(objTransactionByCharge.salesOrder, objTimeEntryFields.inItem);
                libTimeMaster.setTimeEntry(recTimeMasterRecord,timeBillId);
                libTimeMaster.setSalesOrder(recTimeMasterRecord,objTransactionByCharge.salesOrder);
                libTimeMaster.setProject(recTimeMasterRecord,objTimeEntryFields.inProject);
                libTimeMaster.setChargeLink(recTimeMasterRecord,inChargeId);
                libTimeMaster.setDuration(recTimeMasterRecord,objTimeEntryFields.stDuration);
                libTimeMaster.setBillable(recTimeMasterRecord,objTimeEntryFields.isBillable);
                libTimeMaster.setIsFixPrice(recTimeMasterRecord,stProjectFields.billingSchedule);
                libTimeMaster.setIsInvoice(recTimeMasterRecord,objTransactionByCharge.invoice);
                libTimeMaster.setIsLearning(recTimeMasterRecord,stProjectFields.name);
                libTimeMaster.setIsPaid(recTimeMasterRecord,objTransactionByCharge.invoice);
                libTimeMaster.setIsPMO(recTimeMasterRecord,stProjectFields.projectType);
                libTimeMaster.setIsPrePaid(recTimeMasterRecord,stProjectFields.billingSchedule);
                libTimeMaster.setIsTimeOff(recTimeMasterRecord,objTimeEntryFields.stTimeOffType);
                libTimeMaster.setIsWriteOff(recTimeMasterRecord,objTimeEntryFields.isUtilized,objTimeEntryFields.inApprovalStatus,objTimeEntryFields.isBillable);
                libTimeMaster.setTimeEmployee(recTimeMasterRecord,objTimeEntryFields.inEmployee);
                libTimeMaster.setName(recTimeMasterRecord,timeBillId,objTimeEntryFields.stEmployee);
                libTimeMaster.setRatePerHourOrig(recTimeMasterRecord, objSalesOrderProjectRates);
                libTimeMaster.setServiceItem(recTimeMasterRecord, objSalesOrderProjectRates);
                libTimeMaster.setUSDRatePerHour(recTimeMasterRecord, objSalesOrderProjectRates);
                libTimeMaster.setOrigCurrency(recTimeMasterRecord, objSalesOrderProjectRates);

                if(!recTimeMasterRecord.getValue(libTimeMaster.TIME_MASTER.CUSTOMER_INVOICE)) {
                    if(typeof searchResult.invoiceId != "undefined") {
                        recTimeMasterRecord.setValue(libTimeMaster.TIME_MASTER.INVOICE, searchResult.invoiceId);
                        recTimeMasterRecord.setValue(libTimeMaster.TIME_MASTER.CUSTOMER_INVOICE, searchResult.invoiceId);
                    }
                }

                libTimeMaster.checkDummyInvoice(recTimeMasterRecord,stProjectFields);
                log.debug("Update Time Master", recTimeMasterRecord.save());
            }
        } catch (error) { log.error(error.name, error); }
    }


    exports.getInputData = getInputData;
    exports.map = map;
    return exports;
});