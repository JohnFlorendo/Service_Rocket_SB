define(['N/search', 'N/record'],

    function (search, record) {
        var libFieldMapping = {};

        libFieldMapping.fieldIds = {
            Custpage_Line_Description: 'custpage_sr_line_description',
            Custrecord_Line_Description: 'custrecord_spend_line_description',
        }

        libFieldMapping.searchLineDescriptionRequisition = function (inRequisitionId) {
            var objResult = {};
            var arrResult = [];
            var searchRequisition = search.create({
                type: "purchaserequisition",
                filters:
                    [
                        ["type", "anyof", "PurchReq"],
                        "AND",
                        ["internalid", "anyof", inRequisitionId],
                        "AND",
                        ["mainline", "is", "F"]
                    ],
                columns:
                    [
                        search.createColumn({name: "memo", label: "Memo"})
                    ]
            });
            var searchResultCount = searchRequisition.runPaged().count;

            if (searchResultCount != 0) {
                searchRequisition.run().each(function (result) {
                    objResult = {
                        stDescription: result.getValue({name: 'memo'})
                    }

                    arrResult.push(objResult);
                    return true;
                });
            }
            return arrResult;
        }

        libFieldMapping.getSpendSchedules = function (intRequisitionId, intPurchaseOrderId) {
            var arrData = [];
            var searchObj = search.create({
                type: "customrecord_sr_spend_schedule",
                filters: [["custrecord_sr_sp_sch_po_pr_trans", "anyof", intRequisitionId]],
                columns: [
                    search.createColumn({name: "custrecord_sr_sp_sch_po_pr_trans"}),
                    search.createColumn({name: "custrecord_sr_sp_sch_date"}),
                    search.createColumn({name: "custrecord_sr_sp_sch_po_trans"}),
                    search.createColumn({name: "custrecord_ct_spend_status"}),
                    search.createColumn({name: "custrecord_sr_sp_sch_amount"})
                ]
            });
            var searchResultCount = searchObj.runPaged().count;

            if (searchResultCount != 0) {
                searchObj.run().each(function (result) {
                    arrData.push({
                        spend_schedule_id: result.id,
                        purchaseorder_id: intPurchaseOrderId,
                        spend_schedule_status_id: result.getValue('custrecord_ct_spend_status'),
                        spend_schedule_status_text: result.getText('custrecord_ct_spend_status'),
                        spend_schedule_amount: result.getValue('custrecord_sr_sp_sch_amount')
                    });
                    return true;
                });
            }
            return arrData;
        }

        libFieldMapping.getPurchaseOrderId = function (intRequisitionId) {
            var intPurchaseOrderId = "";
            var purchaserequisitionSearchObj = search.create({
                type: "purchaserequisition",
                filters: [
                    ["type", "anyof", "PurchReq"], "AND",
                    ["internalid", "anyof", intRequisitionId]
                ],
                columns: [search.createColumn({name: "internalid", join: "applyingTransaction"})]
            });
            var searchResultCount = purchaserequisitionSearchObj.runPaged().count;
            if (searchResultCount != 0) {
                purchaserequisitionSearchObj.run().each(function (result) {
                    if (result.getValue({name: "internalid", join: "applyingtransaction"})) {
                        intPurchaseOrderId = result.getValue({name: "internalid", join: "applyingTransaction"});
                    }
                    return true;
                });
            }

            return intPurchaseOrderId;

        }

        libFieldMapping.getRequisitionId = function (intPurchaseOrderId) {
            var intRequisitionId = "";
            var purchaserequisitionSearchObj = search.create({
                type: "purchaserequisition",
                filters: [
                    ["type", "anyof", "PurchReq"], "AND",
                    ["applyingtransaction.internalid", "anyof", intPurchaseOrderId]
                ],
                columns: [
                    search.createColumn({name: "trandate", label: "Date"}),
                    search.createColumn({name: "type", label: "Type"}),
                    search.createColumn({name: "tranid", label: "Document Number"}),
                    search.createColumn({name: "entity", label: "Name"}),
                    search.createColumn({name: "amount", label: "Amount"})
                ]
            });
            var searchResultCount = purchaserequisitionSearchObj.runPaged().count;

            if (searchResultCount != 0) {
                purchaserequisitionSearchObj.run().each(function (result) {
                    intRequisitionId = result.id;
                    return true;
                });
            }

            return intRequisitionId;

        }

        libFieldMapping.updateRequisition = function (newRecord) {
            var intPurchaseOrderId = newRecord.getValue('custrecord_sr_sp_sch_po_trans');
            var intRequisitionId = newRecord.getValue('custrecord_sr_sp_sch_po_pr_trans');
            if (intRequisitionId) {
                var arrSpendSchedules = libFieldMapping.getSpendSchedules(intRequisitionId, intPurchaseOrderId);
                if (arrSpendSchedules.length != 0) {
                    var flTotalAvailable = 0;
                    var flTotalCommitted = 0;
                    var flTotalBuffered = 0;
                    var flGrandTotal = 0;
                    for (var intIndex in arrSpendSchedules) {
                        if (arrSpendSchedules[intIndex].spend_schedule_status_text == "Available") {
                            flTotalAvailable += parseFloat(arrSpendSchedules[intIndex].spend_schedule_amount);
                        } else if (arrSpendSchedules[intIndex].spend_schedule_status_text == "Committed") {
                            flTotalCommitted += parseFloat(arrSpendSchedules[intIndex].spend_schedule_amount);
                        } else {
                            flTotalBuffered += parseFloat(arrSpendSchedules[intIndex].spend_schedule_amount);
                        }
                        flGrandTotal += parseFloat(arrSpendSchedules[intIndex].spend_schedule_amount);
                    }

                    record.submitFields({
                        type: "purchaserequisition",
                        id: intRequisitionId,
                        values: {
                            custbody_ss_total_committed: flTotalCommitted,
                            custbody_ss_total_available: flTotalAvailable,
                            custbody_ss_total_buffer: flTotalBuffered,
                            custbody_ss_grand_total: flGrandTotal
                        }
                    });
                }
            }

        }

        return libFieldMapping;

    });
