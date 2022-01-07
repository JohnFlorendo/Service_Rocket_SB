/**
 * @NApiVersion 2.1
 */
define(['N/record'],

    (record) => {
        var libFieldMapping = {};

        libFieldMapping.transformPurchaseOrder = function (inPurchaseOrderID) {
            var objPurchaseOrder = record.transform({
                fromType: record.Type.PURCHASE_ORDER,
                fromId: inPurchaseOrderID,
                toType: record.Type.ITEM_RECEIPT,
                isDynamic: true
            });

            var inItemReceiptID = objPurchaseOrder.save();
            log.debug('inItemReceiptID', inItemReceiptID);
        }

        return libFieldMapping;

    });
