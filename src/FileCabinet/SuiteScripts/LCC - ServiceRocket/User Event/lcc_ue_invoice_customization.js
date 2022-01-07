/**
 *@NApiVersion 2.x
 *@NScriptType UserEventScript
 */
define(['N/record','N/currency','N/search','N/url', 'N/ui/message', 'N/ui/serverWidget','N/task','../Library/lcc_lib_timemaster'],
    function(record,currency,search,url, message,serverWidget,task, libHelper) {

        function afterSubmit(context) {
            try {
                var USD_ID = 1;
                var newRecord = context.newRecord;
                var oldRecord = context.oldRecord;
                var recId = newRecord.id;
                var arrProjects = [];
                var arrItems = [];
                var objLine = {};
                var exchangerate = "1.00";
                if(newRecord.getValue('currency') != USD_ID) {
                    if(typeof newRecord.getValue('trandate') != 'undefined') {
                        var dtTranDate = new Date(libHelper.getFormattedDate(newRecord.getText('trandate')));
                        exchangerate = currency.exchangeRate({ source: newRecord.getValue('currency'), target: 'USD', date: dtTranDate });
                    }
                }

                log.debug('exchangerate', exchangerate);

                record.submitFields({
                    type: newRecord.type,
                    id: newRecord.id,
                    values: { custbody_exchange_rate_usd : exchangerate }
                });



                /** New Record **/
                for(var intIndex=0; intIndex<newRecord.getLineCount('item'); intIndex++) {
                    var intProject = newRecord.getSublistValue({ sublistId: "item", fieldId: "job", line: intIndex });
                    var intItem = newRecord.getSublistValue({ sublistId: "item", fieldId: "item", line: intIndex });
                    var flRate = newRecord.getSublistValue({ sublistId: "item", fieldId: "rate", line: intIndex });

                    if(objLine[intItem] == null) { objLine[intItem] = {}; }
                    objLine[intItem] = {
                      item: intItem,
                      project: intProject,
                      rate: flRate
                    };

                    if(intProject) { arrProjects.push(intProject); }
                    if(intItem) { arrItems.push(intItem); }

                }

                if(context.type == "create") {
                    var arrTimeMasters = getTimeOfMasters(recId, arrProjects, arrItems);
                    if(arrTimeMasters.length != 0) {
                        var mrTask = task.create({ taskType: task.TaskType.MAP_REDUCE });
                        mrTask.scriptId = 'customscript_sr_mr_time_master_update';
                        mrTask.deploymentId = 'customdeploy_sr_mr_time_master_update';
                        mrTask.params = {'custscript_time_masters_id': JSON.stringify(arrTimeMasters)};
                        var mrTaskId = mrTask.submit();
                        log.debug('mrTaskId',mrTaskId);
                    }
                } else {
                    // if(newRecord.getValue('subtotal') != oldRecord.getValue('subtotal')) {
                    // }
                    var arrTimeMasters = getTimeOfMasterRecord(recId, arrItems);
                    if(arrTimeMasters.length != 0) {
                        var mrTask = task.create({ taskType: task.TaskType.MAP_REDUCE });
                        mrTask.scriptId = 'customscript_sr_mr_time_master_update';
                        mrTask.deploymentId = 'customdeploy_sr_mr_time_master_update';
                        mrTask.params = {'custscript_time_masters_id': JSON.stringify(arrTimeMasters)};
                        var mrTaskId = mrTask.submit();
                        log.debug('mrTaskId',mrTaskId);
                    }
                }

            } catch (e) {
                log.debug('beforeSubmit=>e',e);
            }
        }

        /** FUNCTION **/

        function getTimeOfMasters(intInvoiceID, arrProjects, arrItems) {
            var arrData  = [];
            var filters = [
                [libHelper.TIME_MASTER.PROJECT, "anyof", arrProjects],"AND",
                [libHelper.TIME_MASTER.SERVICE_ITEM, "anyof", arrItems]
            ];

            var columns = [
                search.createColumn({name: libHelper.TIME_MASTER.CUSTOMER_INVOICE}),
                search.createColumn({name: libHelper.TIME_MASTER.PROJECT}),
                search.createColumn({name: libHelper.TIME_MASTER.TIME}),
                search.createColumn({name: libHelper.TIME_MASTER.CHARGE}),
                search.createColumn({name: libHelper.TIME_MASTER.SALES_ORDER}),
                search.createColumn({name: libHelper.TIME_MASTER.SERVICE_ITEM})
            ];

            var timeMasterSearchObj = libHelper.runSearch(libHelper.TIME_MASTER.TYPE,  null, filters, columns);

            if(timeMasterSearchObj.length != 0) {
                for(var intIndex=0; intIndex<timeMasterSearchObj.length; intIndex++) {
                    arrData.push({
                        recordid: timeMasterSearchObj[intIndex].id,
                        invoiceId: intInvoiceID,
                        customer_invoice: timeMasterSearchObj[intIndex].getValue(libHelper.TIME_MASTER.CUSTOMER_INVOICE),
                        charge_invoice: timeMasterSearchObj[intIndex].getValue(libHelper.TIME_MASTER.CHARGE)
                    });
                }
            }
            return arrData;
        }

        function getTimeOfMasterRecord(intInvoiceID, arrItems) {
            var arrData  = [];
            var filters = [
                [libHelper.TIME_MASTER.CUSTOMER_INVOICE, "anyof", [intInvoiceID]],"AND",
                [libHelper.TIME_MASTER.SERVICE_ITEM, "anyof", arrItems]
            ];

            var columns = [
                search.createColumn({name: libHelper.TIME_MASTER.CUSTOMER_INVOICE}),
                search.createColumn({name: libHelper.TIME_MASTER.PROJECT}),
                search.createColumn({name: libHelper.TIME_MASTER.TIME}),
                search.createColumn({name: libHelper.TIME_MASTER.CHARGE}),
                search.createColumn({name: libHelper.TIME_MASTER.SALES_ORDER}),
                search.createColumn({name: libHelper.TIME_MASTER.SERVICE_ITEM})
            ];

            var timeMasterSearchObj = libHelper.runSearch(libHelper.TIME_MASTER.TYPE,  null, filters, columns);

            if(timeMasterSearchObj.length != 0) {
                for(var intIndex=0; intIndex<timeMasterSearchObj.length; intIndex++) {
                    arrData.push({
                        recordid: timeMasterSearchObj[intIndex].id,
                        customer_invoice: timeMasterSearchObj[intIndex].getValue(libHelper.TIME_MASTER.CUSTOMER_INVOICE),
                        charge_invoice: timeMasterSearchObj[intIndex].getValue(libHelper.TIME_MASTER.CHARGE)
                    });
                }
            }
            return arrData;
        }

        return { afterSubmit : afterSubmit };

    });