/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 */

/*
Purpose             : To
Created On          :
Author              : Ceana Technology
Saved Searches      : customsearch_sr_invoice_identifier
*/

define(['N/runtime', 'N/search', 'N/record'],
    /**
     * @param{runtime} runtime
     * @param{search} search
     * @param{record} record
     */
    (runtime, search, record) => {
        var currScript = runtime.getCurrentScript();

        const getInputData = () => {
            var paramSearchId = currScript.getParameter('custscript_sr_invoice_identifier');
            var arrJournal = searchAllJournal(paramSearchId);

            return arrJournal;
        }

        function searchAllJournal(paramSearchId) {
            try {
                var arrJournal = [];

                var journalSearchObj = search.load({
                    id: paramSearchId
                });

                var myPagedData = journalSearchObj.runPaged({
                    pageSize: 1000
                });

                try {
                    myPagedData.pageRanges.forEach(function (pageRange) {
                        var myPage = myPagedData.fetch({
                            index: pageRange.index
                        });
                        myPage.data.forEach(function (result) {
                            var inInternalID = result.getValue({
                                name: 'internalid',
                                summary: "GROUP"
                            });
                            var inAppliedToTransaction = result.getValue({
                                name: 'appliedtotransaction',
                                summary: "GROUP"
                            });
                            arrJournal.push({
                                inInternalID: inInternalID,
                                inAppliedToTransaction: inAppliedToTransaction
                            });
                        });
                    });
                } catch (e) {
                    log.debug('second try', e);
                }
            } catch (e) {
                log.debug('first try', e);
            }

            return arrJournal;
        }

        const map = (mapContext) => {
            try {
                var objJournal = JSON.parse(mapContext.value);

                var inInternalID = objJournal.inInternalID;
                var inAppliedToTransaction = objJournal.inAppliedToTransaction;
                log.debug('objJournal', 'inAppliedToTransaction: ' + inAppliedToTransaction + ' - inInternalID: ' + inInternalID);

                var arrRevRecPlan = searchRevenueRecognitionPlan(inInternalID);
                log.debug('arrRevRecPlan', arrRevRecPlan);
                settingRevenueElement(inInternalID, arrRevRecPlan);

                var arrRevArrangement = revenueArrangementRecord(inAppliedToTransaction);
                log.debug('arrRevArrangement', arrRevArrangement);

                journalEntryRecord(inInternalID, arrRevArrangement);
            } catch (e) {
                log.debug('map -> error', e);
            }
        }

        function fieldMapping() {
            var objFields = {};

            objFields.revenueElement = [
                {
                    sublistID: 'revenueelement',
                    fieldID: 'revenueelement_display'
                },
                {
                    sublistID: 'revenueelement',
                    fieldID: 'referenceid'
                },
                {
                    sublistID: 'revenueelement',
                    fieldID: 'customer'
                }
            ]

            objFields.lineFieldID = {
                stRevenueElement: 'revenueelement_display',
                stSource: 'referenceid',
                stCustomer: 'customer'
            }

            return objFields;
        }

        function recordJournalEntry(inJournalEntryID) {
            var recJournalEntry = record.load({
                type: record.Type.JOURNAL_ENTRY,
                id: inJournalEntryID,
                isDynamic: true,
            });

            return recJournalEntry;
        }

        function searchRevenueRecognitionPlan(arrJournalID) {
            try {
                var objRevRecPlan = {};
                var arrRevRecPlan = [];
                var searchObjRevenuePlan = search.create({
                    type: "revenueplan",
                    filters:
                        [
                            ["journal", "anyof", arrJournalID]
                        ],
                    columns:
                        [
                            search.createColumn({name: "recordnumber", label: "Number"}),
                            search.createColumn({name: "createdfrom", label: "Created From"}),
                            search.createColumn({name: "internalid", label: "Internal ID"}),
                            search.createColumn({
                                name: "internalid",
                                join: "revenueElement",
                                label: "Internal ID"
                            })
                        ]
                });
                searchObjRevenuePlan.run().each(function (result) {
                    var inNumber = result.getValue({
                        name: 'recordnumber'
                    });
                    var inCreatedFrom = result.getValue({
                        name: 'createdfrom'
                    });
                    var inInternalId = result.getValue({
                        name: 'internalid'
                    });
                    var inRevElementInternalId = result.getValue({
                        name: 'internalid',
                        join: 'revenueElement'
                    });

                    objRevRecPlan = {
                        inNumber: inNumber,
                        inCreatedFrom: inCreatedFrom,
                        inInternalId: inInternalId,
                        inRevElementInternalId: inRevElementInternalId
                    }

                    arrRevRecPlan.push(objRevRecPlan);
                    return true;
                });

                return arrRevRecPlan;
            } catch (e) {
                log.debug('searchRevenueRecognitionPlan -> error', e);
            }
        }

        function settingRevenueElement(inJournalEntryID, arrRevRecPlan) {
            var recJournalEntry = recordJournalEntry(inJournalEntryID);

            var inLine = recJournalEntry.getLineCount({
                sublistId: 'line'
            });
            for (var indx = 0; indx < inLine; indx++) {
                var inSourceRevenuePlanID = recJournalEntry.getSublistValue({
                    sublistId: 'line',
                    fieldId: 'sourcerevenueplan',
                    line: indx
                });
                for (var arrIndx = 0; arrIndx < arrRevRecPlan.length; arrIndx++) {
                    var inNumber = arrRevRecPlan[arrIndx].inNumber;
                    if (inSourceRevenuePlanID == inNumber) {
                        recJournalEntry.selectLine({
                            sublistId: 'line',
                            line: indx
                        });
                        recJournalEntry.setCurrentSublistValue({
                            sublistId: 'line',
                            fieldId: 'custcol_sr_revenue_element_text',
                            value: arrRevRecPlan[arrIndx].inCreatedFrom,
                            ignoreFieldChange: true
                        });
                        recJournalEntry.setCurrentSublistValue({
                            sublistId: 'line',
                            fieldId: 'custcol_sr_revenue_element',
                            value: arrRevRecPlan[arrIndx].inRevElementInternalId,
                            ignoreFieldChange: true
                        });
                        recJournalEntry.setCurrentSublistValue({
                            sublistId: 'line',
                            fieldId: 'custcol_sr_rev_rec_plan',
                            value: arrRevRecPlan[arrIndx].inInternalId,
                            ignoreFieldChange: true
                        });
                        recJournalEntry.commitLine({
                            sublistId: 'line'
                        });
                    }
                }
            }

            var inID = recJournalEntry.save();
            log.debug('settingRevenueElement Journal Entry ID', inID);
        }

        function revenueArrangementRecord(inRevenueArrangementID) {
            try {
                var objRevArrangement = {};
                var arrRevArrangement = [];

                var recRevenueArrangement = record.load({
                    type: record.Type.REVENUE_ARRANGEMENT,
                    id: inRevenueArrangementID,
                    isDynamic: true,
                });

                var objFields = fieldMapping();
                var inLine = recRevenueArrangement.getLineCount({
                    sublistId: 'revenueelement'
                });

                for (var indx = 0; indx < inLine; indx++) {
                    for (var field in objFields.revenueElement) {
                        var fields = objFields.revenueElement[field];
                        var objLineFields = recRevenueArrangement.getSublistValue({
                            sublistId: fields.sublistID,
                            fieldId: fields.fieldID,
                            line: indx
                        });
                        if (fields.fieldID == objFields.lineFieldID.stRevenueElement) {
                            var inRevenueElement = objLineFields;
                        } else if (fields.fieldID == objFields.lineFieldID.stSource) {
                            var stSource = objLineFields;
                        } else if (fields.fieldID == objFields.lineFieldID.stCustomer) {
                            var inCustomer = objLineFields;
                        }

                        objRevArrangement = {
                            inRevenueElement: inRevenueElement,
                            stSource: stSource,
                            inCustomer: inCustomer
                        }
                    }

                    arrRevArrangement.push(objRevArrangement);
                }

                return arrRevArrangement;
            } catch (e) {
                log.debug('revenueArrangementRecord -> error', e);
            }
        }

        function journalEntryRecord(inJournalEntryID, arrRevArrangement) {
            var stRelatedRecord = '';
            var recJournalEntry = recordJournalEntry(inJournalEntryID);

            var inLine = recJournalEntry.getLineCount({
                sublistId: 'line'
            });
            for (var indx = 0; indx < inLine; indx++) {
                var inRevElementID = recJournalEntry.getSublistText({
                    sublistId: 'line',
                    fieldId: 'custcol_sr_revenue_element',
                    line: indx
                });
                for (var arrIndx = 0; arrIndx < arrRevArrangement.length; arrIndx++) {
                    if (inRevElementID == arrRevArrangement[arrIndx].inRevenueElement) {
                        var stSourceType = arrRevArrangement[arrIndx].stSource.split('_')[0];
                        var inSourceID = arrRevArrangement[arrIndx].stSource.split('_')[1];
                        var inCustomer = arrRevArrangement[arrIndx].inCustomer;

                        if (stSourceType == 'SalesOrd') {
                            var objInvoice = searchInvoiceRecord(inSourceID);
                            stRelatedRecord = objInvoice.inInternalID;
                        } else if (stSourceType == 'CustInvc') {
                            stRelatedRecord = inSourceID;
                        } else if (stSourceType == 'RtnAuth') {
                            stRelatedRecord = inSourceID;
                        } else if (stSourceType == 'CustCred') {
                            stRelatedRecord = inSourceID;
                        } else {
                            var objProject = searchProjectRecord(inCustomer);
                            log.debug('objProject.inApplyingTransaction', objProject.inApplyingTransaction);
                            var objInvoice = invoiceRecord(objProject.inApplyingTransaction);
                            stRelatedRecord = objInvoice.inInternalID;
                        }

                        recJournalEntry.selectLine({
                            sublistId: 'line',
                            line: indx
                        });
                        recJournalEntry.setCurrentSublistValue({
                            sublistId: 'line',
                            fieldId: 'custcol_sr_related_records',
                            value: stRelatedRecord,
                            ignoreFieldChange: true
                        });
                        recJournalEntry.commitLine({
                            sublistId: 'line'
                        });
                    }
                }
            }

            var inID = recJournalEntry.save();
            log.debug('journalEntryRecord Journal Entry ID', inID);
        }

        function searchInvoiceRecord(inSourceID) {
            try {
                var objInvoice = {};

                var searchObjInvoice = search.create({
                    type: "invoice",
                    filters:
                        [
                            ["type", "anyof", "CustInvc"],
                            "AND",
                            ["createdfrom", "anyof", inSourceID]
                        ],
                    columns:
                        [
                            search.createColumn({name: "createdfrom", label: "Created From", summary: "GROUP"}),
                            search.createColumn({name: "tranid", label: "Document Number", summary: "GROUP"}),
                            search.createColumn({name: "internalid", label: "Internal ID", summary: "GROUP"})
                        ]
                });
                searchObjInvoice.run().each(function (result) {
                    var inTranID = result.getValue({
                        name: 'tranid',
                        summary: 'GROUP'
                    });

                    var inInternalID = result.getValue({
                        name: 'internalid',
                        summary: 'GROUP'
                    });

                    objInvoice.inTranID = inTranID;
                    objInvoice.inInternalID = inInternalID;
                    return true;
                });

                return objInvoice;
            } catch (e) {
                log.debug('searchInvoiceRecord -> error', e);
            }
        }

        function searchProjectRecord(inProjectID) {
            try {
                var objProject = {};

                var searchObjProject = search.create({
                    type: "job",
                    filters:
                        [
                            ["internalid", "anyof", inProjectID],
                            "AND",
                            ["transaction.type", "anyof", "SalesOrd"],
                            "AND",
                            ["transaction.applyingtransaction", "noneof", "@NONE@"]
                        ],
                    columns:
                        [
                            search.createColumn({
                                name: "internalid",
                                summary: "GROUP",
                                label: "Internal ID"
                            }),
                            search.createColumn({
                                name: "applyingtransaction",
                                join: "transaction",
                                summary: "GROUP",
                                sort: search.Sort.ASC,
                                label: "Applying Transaction"
                            }),
                            search.createColumn({
                                name: "type",
                                join: "transaction",
                                summary: "GROUP",
                                label: "Type"
                            })
                        ]
                });
                searchObjProject.run().each(function (result) {
                    var inApplyingTransaction = result.getValue({
                        name: "applyingtransaction",
                        join: "transaction",
                        summary: "GROUP",
                    });
                    var stApplyingTransaction = result.getText({
                        name: "applyingtransaction",
                        join: "transaction",
                        summary: "GROUP",
                    });
                    log.debug('inApplyingTransaction', inApplyingTransaction + ' : ' + stApplyingTransaction);

                    objProject.inApplyingTransaction = inApplyingTransaction;
                    return true;
                });

                return objProject;
            } catch (e) {
                log.debug('searchProjectRecord -> error', e);
            }
        }

        function invoiceRecord(inInvoiceID) {
            if (inInvoiceID) {
                var recInvoice = record.load({
                    type: record.Type.INVOICE,
                    id: inInvoiceID,
                    isDynamic: true,
                });

                var inInternalID = recInvoice.getValue({
                    fieldId: 'id'
                });

                return {
                    inInternalID: inInternalID
                };
            }
        }

        const reduce = (reduceContext) => {

        }

        const summarize = (summaryContext) => {

        }

        return {getInputData, map, reduce, summarize}

    });
