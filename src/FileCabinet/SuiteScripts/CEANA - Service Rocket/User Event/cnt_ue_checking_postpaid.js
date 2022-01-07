/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['N/record', 'N/search'],
    /**
 * @param{record} record
 * @param{search} search
 */
    (record, search) => {
        var Sales_Order = 'Sales Order';

        /**
         * Defines the function definition that is executed before record is submitted.
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {Record} scriptContext.oldRecord - Old record
         * @param {string} scriptContext.type - Trigger type; use values from the context.UserEventType enum
         * @since 2015.2
         */
        const beforeSubmit = (scriptContext) => {
            var newRec = scriptContext.newRecord;
            var stType = '';

            log.debug('Start');
            var inLine = newRec.getLineCount({
                sublistId: 'revenueelement'
            });
            for (var indx = 0; indx < inLine; indx++) {
                var inSource = newRec.getSublistValue({
                    sublistId: 'revenueelement',
                    fieldId: 'source',
                    line: indx
                });
            }

            stType = inSource.split(' #')[0];
            if (stType == Sales_Order) {
                inSource = inSource.split('-')[1];
                log.debug('inSource split', inSource);
                var arrSalesOrder = salesOrderSearch(inSource);
                log.debug('arrSalesOrder', arrSalesOrder);

                for (var indx = 0; indx < arrSalesOrder.length; indx++) {
                    var objSalesOrder = arrSalesOrder[indx];
                    newRec.setSublistValue({
                        sublistId: 'revenueelement',
                        fieldId: 'custcol_ct_arm_postpaid',
                        value: objSalesOrder.isPostPaid,
                        line: indx
                    });
                }
            }

            log.debug('End');
        }

        function salesOrderSearch(inSource) {
            var objSalesOrder = {};
            var arrSalesOrder = [];

            var objSearchSalesOrder = search.create({
                type: "salesorder",
                filters:
                    [
                        ["type","anyof","SalesOrd"],
                        "AND",
                        ["taxline","is","F"],
                        "AND",
                        ["mainline","is","F"],
                        "AND",
                        ["number","equalto",inSource]
                    ],
                columns:
                    [
                        // search.createColumn({name: "item", label: "Item"}),
                        search.createColumn({name: "custcol_ct_arm_postpaid", label: "Postpaid"})
                    ]
            });
            objSearchSalesOrder.run().each(function(result){
                objSalesOrder = {
                    // inItem : result.getValue({name: 'item'}),
                    isPostPaid : result.getValue({name: 'custcol_ct_arm_postpaid'})
                }
                arrSalesOrder.push(objSalesOrder);

                return true;
            });

            return arrSalesOrder;
        }

        return {beforeSubmit}

    });
