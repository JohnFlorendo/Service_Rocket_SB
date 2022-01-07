/**
 *@NApiVersion 2.x
 *@NScriptType UserEventScript
 */
define(['N/record', 'N/search', 'N/url', 'N/ui/message', 'N/ui/serverWidget', 'N/task', '../Library/lcc_lib_payroll'],
    function (record, search, url, message, serverWidget, task, libHelper) {
        function afterSubmit(context) {
            log.debug('START');
            var newRecord = context.newRecord;
            var recId = newRecord.id;
            var intJEReversal = newRecord.getValue('custbody_reversed_je_no');

            if (recId && !intJEReversal) {
                var isCreatedFrom = newRecord.getValue('createdfrom');

                if (isCreatedFrom) {
                    var isInvoice = newRecord.getText('createdfrom').indexOf("Invoice #");

                    if (isInvoice != -1) {
                        var intInvoiceId = newRecord.getValue('createdfrom');

                        var invoiceLookupField = search.lookupFields({
                            type: 'invoice',
                            id: intInvoiceId,
                            columns: ['createdfrom', 'currency', 'subsidiary', 'createdfrom.department', 'createdfrom.location', 'createdfrom.class']
                        });

                        log.debug('invoiceLookupField', invoiceLookupField);
                        if (invoiceLookupField.createdfrom[0]) {
                            var arrRevenueElements = getRevenueElements(invoiceLookupField.createdfrom[0].value);
                            log.debug("arrRevenueElements", arrRevenueElements);

                            if (arrRevenueElements.length != 0) {
                                var arrRevenuePlans = getRevenuePlans(arrRevenueElements);
                                log.debug("arrRevenuePlans", arrRevenuePlans);

                                if (arrRevenuePlans.length != 0) {
                                    var flAmountToReversed = getAmountToReversed(newRecord, arrRevenuePlans);
                                    log.debug("flAmountToReversed", flAmountToReversed);
                                    if (flAmountToReversed > 0) {
                                        var recJournalEntry = record.create({
                                            type: "journalentry",
                                            isDynamic: true,
                                            defaultValues: {subsidiary: invoiceLookupField.subsidiary[0].value}
                                        });
                                        var objAccount = getDeferredAccount(newRecord);
                                        recJournalEntry.setValue("trandate", newRecord.getValue('trandate'));
                                        recJournalEntry.setValue("memo", newRecord.getValue('memo'));
                                        recJournalEntry.setValue("custbody_ct_cm_no", newRecord.id);

                                        var currLine = recJournalEntry.selectNewLine({sublistId: 'line'});
                                        currLine.setCurrentSublistValue({
                                            sublistId: 'line',
                                            fieldId: 'account',
                                            value: objAccount.intDefferedAccount
                                        });
                                        currLine.setCurrentSublistValue({
                                            sublistId: 'line',
                                            fieldId: 'debit',
                                            value: flAmountToReversed
                                        });
                                        currLine.setCurrentSublistValue({
                                            sublistId: 'line',
                                            fieldId: 'entity',
                                            value: newRecord.getValue('entity')
                                        });
                                        currLine.setCurrentSublistValue({
                                            sublistId: 'line',
                                            fieldId: 'department',
                                            value: invoiceLookupField["createdfrom.department"][0].value
                                        });
                                        currLine.setCurrentSublistValue({
                                            sublistId: 'line',
                                            fieldId: 'location',
                                            value: invoiceLookupField["createdfrom.location"][0].value
                                        });
                                        currLine.setCurrentSublistValue({
                                            sublistId: 'line',
                                            fieldId: 'class',
                                            value: invoiceLookupField["createdfrom.class"][0].value
                                        });
                                        currLine.commitLine({sublistId: 'line'});
                                        var currLine = recJournalEntry.selectNewLine({sublistId: 'line'});
                                        currLine.setCurrentSublistValue({
                                            sublistId: 'line',
                                            fieldId: 'account',
                                            value: objAccount.intIncomeAccount
                                        });
                                        currLine.setCurrentSublistValue({
                                            sublistId: 'line',
                                            fieldId: 'credit',
                                            value: flAmountToReversed
                                        });
                                        currLine.setCurrentSublistValue({
                                            sublistId: 'line',
                                            fieldId: 'entity',
                                            value: newRecord.getValue('entity')
                                        });
                                        currLine.setCurrentSublistValue({
                                            sublistId: 'line',
                                            fieldId: 'department',
                                            value: invoiceLookupField["createdfrom.department"][0].value
                                        });
                                        currLine.setCurrentSublistValue({
                                            sublistId: 'line',
                                            fieldId: 'location',
                                            value: invoiceLookupField["createdfrom.location"][0].value
                                        });
                                        currLine.setCurrentSublistValue({
                                            sublistId: 'line',
                                            fieldId: 'class',
                                            value: invoiceLookupField["createdfrom.class"][0].value
                                        });
                                        currLine.commitLine({sublistId: 'line'});
                                        var jeid = recJournalEntry.save(true, true);

                                        /** Link JE to CM **/
                                        record.submitFields({
                                            type: "creditmemo",
                                            id: newRecord.id,
                                            values: {custbody_reversed_je_no: jeid}
                                        });
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }

        /**FUNCTION**/

        function getRevenueElements(intSalesOrderId) {
            var arrData = [];

            var revenueelementSearchObj = search.create({
                type: "revenueelement",
                filters: ["sourcetransaction.internalid", "anyof", [intSalesOrderId]],
                columns: [search.createColumn({name: "internalid"})]
            });
            var searchResultCount = revenueelementSearchObj.runPaged().count;
            if (searchResultCount != 0) {
                revenueelementSearchObj.run().each(function (result) {
                    arrData.push(result.getValue('internalid'));
                    return true;
                });
            }
            return arrData;
        }

        function getRevenuePlans(arrRevenueElements) {
            var arrData = [];
            var revenueplanSearchObj = search.create({
                type: "revenueplan",
                filters: [
                    ["createdfrom", "anyof", arrRevenueElements], "AND",
                    ["revenueplantype", "anyof", "ACTUAL"]
                ],
                columns: [
                    search.createColumn({name: "recordnumber"}),
                    search.createColumn({name: "createdfrom"}),
                    search.createColumn({name: "amount"}),
                    search.createColumn({name: "revenueplantype"}),
                    search.createColumn({name: "remainingdeferredbalance"}),
                    search.createColumn({name: "totalrecognized"})
                ]
            });
            var searchResultCount = revenueplanSearchObj.runPaged().count;
            if (searchResultCount != 0) {
                revenueplanSearchObj.run().each(function (result) {
                    arrData.push({
                        recordid: result.id,
                        recordnumber: result.getValue("recordnumber"),
                        createdfrom: result.getValue("createdfrom"),
                        amount: result.getValue("amount"),
                        revenueplantype: result.getValue("revenueplantype"),
                        remainingdeferredbalance: result.getValue("remainingdeferredbalance"),
                        totalrecognized: result.getValue("totalrecognized")
                    });
                    return true;
                });
            }
            return arrData;
        }

        function getAmountToReversed(newRecord, arrRevenuePlans) {
            var flTotalAmount = 0;
            for (var intIndex in arrRevenuePlans) {
                flTotalAmount += parseFloat(arrRevenuePlans[intIndex].totalrecognized);
            }
            return parseFloat(newRecord.getValue('total')) - flTotalAmount;
        }

        function getDeferredAccount(newRecord) {
            var objData = {
                intDefferedAccount: "",
                intIncomeAccount: ""
            };

            for (var intIndex = 0; intIndex < newRecord.getLineCount({sublistId: "item"}); intIndex++) {
                var stDefferedAccount = newRecord.getSublistValue({
                    sublistId: "item",
                    fieldId: "custcol_cm_deferred_acct",
                    line: intIndex
                });
                var stIncomeAccount = newRecord.getSublistValue({
                    sublistId: "item",
                    fieldId: "custcol_ct_income_acct",
                    line: intIndex
                });

                if (stDefferedAccount) {
                    objData.intDefferedAccount = stDefferedAccount;
                }
                if (stIncomeAccount) {
                    objData.intIncomeAccount = stIncomeAccount;
                }
            }
            return objData;
        }

        return {
            afterSubmit: afterSubmit
        };

    });