/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['N/search', 'N/record'],
    /**
     * @param{search} search
     * @param{currentRecord} currentRecord
     */
    function (search, record) {
        var ServiceRocket_Sdn_Bhd = 10;
        var VAT_MY_UNDEF_MY = 60;

        function pageInit(scriptContext) {
            var currRecord = scriptContext.currentRecord;
            if (currRecord.getValue('entity')) {
                creatingPurchaseOrderFromRequisition(scriptContext);
            }
        }

        function postSourcing(scriptContext) {
            if (scriptContext.fieldId == 'entity') {
                setTimeout(function () {
                    creatingPurchaseOrderFromRequisition(scriptContext);
                }, 500);
            }
        }

        function creatingPurchaseOrderFromRequisition(scriptContext) {
            var currRecord = scriptContext.currentRecord;

            var stTransform = currRecord.getValue({
                fieldId: 'transform'
            });

            if (stTransform) {
                setExpiryDate(currRecord);
                setBudgetCode(currRecord);
                settingLineItem(currRecord);
            }
        }

        function setExpiryDate(currRecord) {
            var dtDate = currRecord.getValue({
                fieldId: 'trandate'
            });

            // dtDate.setMonth(dtDate.getMonth() + 1)
            dtDate.setFullYear(dtDate.getFullYear() + 1)
            currRecord.setValue({
                fieldId: 'custbody_sr_expiry_date',
                value: dtDate
            });
        }

        function setBudgetCode(currRecord) {
            var inRequisitionId = currRecord.getValue({
                fieldId: 'createdfrom'
            });
            var stRequisitionNumber = search.lookupFields({
                type: search.Type.PURCHASE_REQUISITION,
                id: inRequisitionId,
                columns: ['tranid']
            });
            currRecord.setValue({
                fieldId: 'custbody_sr_budget_code',
                value: stRequisitionNumber.tranid
            });
        }

        function settingLineItem(currRecord) {
            var inRequisitionId = currRecord.getValue({
                fieldId: 'createdfrom'
            });

            // var arrData = searchRequisitionLineItems(currRecord, inRequisitionId);
            var arrData = recordRequisitionLineItems(currRecord, inRequisitionId);

            for (var indxArrData = 0; indxArrData < arrData.length; indxArrData++) {
                console.log('JSON.stringify(arrData[indxArrData])): ' + JSON.stringify(arrData[indxArrData]));
                var valueField = arrData[indxArrData];
                var inLine = currRecord.getLineCount({
                    sublistId: 'item'
                });
                for (var indx = 0; indx < inLine; indx++) {
                    if (indx == indxArrData) {
                        setLineItem(currRecord, indx, valueField);
                    }
                }
                // var valueField = arrData[indxArrData];
                // console.log('valueField: ' + JSON.stringify(valueField));
                // var lineNumber = currRecord.findSublistLineWithValue({
                //     sublistId: 'item',
                //     fieldId: 'item',
                //     value: valueField.inItem
                // });
                //
                // console.log('lineNumber: ' + lineNumber);
                // if (lineNumber != -1) {
                //     setLineItem(currRecord, lineNumber, valueField);
                // }
            }
        }

        function setLineItem(currRecord, indx, valueField) {
            currRecord.selectLine({
                sublistId: 'item',
                line: indx
            });
            currRecord.setCurrentSublistValue({
                sublistId: 'item',
                fieldId: 'rate',
                value: valueField.inEstimatedRate,
                // ignoreFieldChange: true
            });
            currRecord.setCurrentSublistValue({
                sublistId: 'item',
                fieldId: 'amount',
                value: valueField.inEstimatedAmount,
                // ignoreFieldChange: true
            });

            var inGSTAmount = currRecord.getCurrentSublistValue({
                sublistId: 'item',
                fieldId: 'custcol_gst_amount'
            });

            var inGrossAmount = valueField.inEstimatedAmount + inGSTAmount;

            currRecord.setCurrentSublistValue({
                sublistId: 'item',
                fieldId: 'grossamt',
                value: inGrossAmount,
                // ignoreFieldChange: true
            });
            // if (valueField.inGSTCode) {
            //     currRecord.setCurrentSublistValue({
            //         sublistId: 'item',
            //         fieldId: 'taxcode',
            //         value: valueField.inGSTCode,
            //         // ignoreFieldChange: true
            //     });
            // } else {
            //     var inSubsidiary = currRecord.getValue({
            //         fieldId: 'subsidiary'
            //     });
            //     if (inSubsidiary == ServiceRocket_Sdn_Bhd) {
            //         currRecord.setCurrentSublistValue({
            //             sublistId: 'item',
            //             fieldId: 'taxcode',
            //             value: VAT_MY_UNDEF_MY,
            //             // ignoreFieldChange: true
            //         });
            //     }
            // }
            currRecord.commitLine({
                sublistId: 'item'
            });
        }

        function recordRequisitionLineItems(currRecord, inRequisitionId) {
            var objData = {};
            var arrData = [];

            var recRequisition = record.load({
                type: record.Type.PURCHASE_REQUISITION,
                id: inRequisitionId,
                isDynamic: true,
            });

            var inLine = recRequisition.getLineCount({
                sublistId: 'item'
            });
            for (var indx = 0; indx < inLine; indx++) {
                objData = {
                    inItem: recRequisition.getSublistValue({
                        sublistId: 'item',
                        fieldId: 'item',
                        line: indx
                    }),
                    inEstimatedRate: recRequisition.getSublistValue({
                        sublistId: 'item',
                        fieldId: 'estimatedrate',
                        line: indx
                    }),
                    inEstimatedAmount: recRequisition.getSublistValue({
                        sublistId: 'item',
                        fieldId: 'estimatedamount',
                        line: indx
                    }),
                    inGSTCode: recRequisition.getSublistValue({
                        sublistId: 'item',
                        fieldId: 'custcol_gst_taxcode',
                        line: indx
                    })
                }
                arrData.push(objData);
            }

            return arrData;
        }


        // function searchRequisitionLineItems(currRecord, inRequisitionId) {
        //     var objData = {};
        //     var arrData = [];
        //
        //     var objSearchRequisitionLineItems = search.load({id: 'customsearch_sr_pr_line_item_fields'});
        //     var filters = objSearchRequisitionLineItems.filters;
        //     filters.push({name: "internalid", operator: "anyof", values: inRequisitionId});
        //     objSearchRequisitionLineItems.filters = [];
        //     objSearchRequisitionLineItems.filters = filters;
        //
        //     var searchResultCount = objSearchRequisitionLineItems.runPaged().count;
        //
        //     if (searchResultCount != 0) {
        //         objSearchRequisitionLineItems.run().each(function (result) {
        //             objData = {
        //                 inItem: result.getValue({name: 'item'}),
        //                 inEstimatedRate: result.getValue({name: 'formulacurrency'}),
        //                 // inEstimatedRate: result.getValue(objSearchRequisitionLineItems.columns[1]),
        //                 inEstimatedAmount: result.getValue({name: 'estimatedamount'}),
        //                 // inEstimatedAmount: result.getValue(objSearchRequisitionLineItems.columns[2]),
        //                 inRate: result.getValue({name: 'rate'}),
        //                 inFXRate: result.getValue({name: 'fxrate'}),
        //                 inGSTCode: result.getValue({name: 'custcol_gst_taxcode'})
        //             };
        //
        //             arrData.push(objData);
        //             return true;
        //         });
        //     }
        //
        //     return arrData;
        // }

        return {
            pageInit: pageInit,
            postSourcing: postSourcing
        };

    });
