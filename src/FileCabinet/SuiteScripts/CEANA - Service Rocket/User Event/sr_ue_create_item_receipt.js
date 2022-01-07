/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['N/record', 'N/search', '../Library/cnt_lib_create_item_receipt'],
    /**
     * @param{record} record
     * * @param{search} search
     */
    (record, search, libFieldMapping) => {

        const afterSubmit = (scriptContext) => {
            if (scriptContext.type == scriptContext.UserEventType.CREATE) {
                log.debug('Start After Submit');
                var newRecord = scriptContext.newRecord;
                var inLineIndx = null;

                var inLine = newRecord.getLineCount({
                    sublistId: 'apply'
                });

                for (var indx = 0; indx < inLine; indx++) {
                    var isApply = newRecord.getSublistValue({
                        sublistId: 'apply',
                        fieldId: 'apply',
                        line: indx
                    });
                    log.debug('isApply', isApply + ' : ' + indx);
                    if (isApply) {
                        inLineIndx = indx;
                    }
                }
                log.debug('inLineIndx', inLineIndx);
                var inVendorBillID = newRecord.getSublistValue({
                    sublistId: 'apply',
                    fieldId: 'internalid',
                    line: inLineIndx
                });

                log.debug('inVendorBillID', inVendorBillID);

                var obj = relatedRecord(inVendorBillID);
                log.debug('inPurchaseOrderID', obj.inPurchaseOrderID);

                if (obj.inPurchaseOrderID) {
                    var objRecordPurchaseOrder = search.lookupFields({
                        type: record.Type.PURCHASE_ORDER,
                        id: obj.inPurchaseOrderID,
                        columns: ['status']
                    });

                    var stStatusPurchaseOrder = objRecordPurchaseOrder.status[0].value;
                    log.debug('stStatusPurchaseOrder', stStatusPurchaseOrder);
                    if (stStatusPurchaseOrder == 'pendingReceipt') {
                        libFieldMapping.transformPurchaseOrder(obj.inPurchaseOrderID);
                    }
                }
            }
        }

        function relatedRecord(inVendorBillID) {
            var obj = {};
            var searchVendorBill = search.create({
                type: "vendorbill",
                filters:
                    [
                        ["type", "anyof", "VendBill"],
                        "AND",
                        ["appliedtotransaction", "noneof", "@NONE@"],
                        "AND",
                        ["internalid", "anyof", inVendorBillID]
                    ],
                columns:
                    [
                        search.createColumn({
                            name: "appliedtotransaction",
                            summary: "GROUP",
                            label: "Applied To Transaction"
                        })
                    ]
            });
            searchVendorBill.run().each(function (result) {
                var inPurchaseOrderID = result.getValue({
                    name: 'appliedtotransaction',
                    summary: 'GROUP'
                });

                obj.inPurchaseOrderID = inPurchaseOrderID
                return true;
            });

            return obj;
        }

        return {afterSubmit}

    });
