/**
 *@NApiVersion 2.x
 *@NScriptType UserEventScript
 */
define(['N/record', 'N/search', 'N/url', 'N/ui/message', 'N/ui/serverWidget', 'N/runtime', '../Library/lcc_lib_payroll'],
    function (record, search, url, message, serverWidget, runtime, libHelper) {
        var currentScript = runtime.getCurrentScript();
        var currentUser = runtime.getCurrentUser();

        function beforeLoad(context) {
            var newRecord = context.newRecord;
            checkingFieldGroupForFinance(context);

            var searchid = currentScript.getParameter({name: 'custscript_param_editable_tranid_access'});
            var form = context.form;
            var arrRolesWithEditableAccess = getRoles(searchid);
            var hasEditableAccess = arrRolesWithEditableAccess.some(function (val) {
                return val == currentUser.role;
            });
            if (hasEditableAccess) {
                var fieldTranId = form.getField({id: 'tranid'});
                fieldTranId.updateDisplayType({displayType: serverWidget.FieldDisplayType.NORMAL});
            }

            var objSublist = form.getSublist({
                id: 'item'
            });

            // if (context.type === context.UserEventType.CREATE || context.type === context.UserEventType.EDIT) {
            //     var objFieldGSTCode = fieldGSTCode(objSublist);
            //     objFieldGSTCode.updateDisplayType({
            //         displayType: serverWidget.FieldDisplayType.HIDDEN
            //     });
            //     customizeGSTCodeLineField(objSublist, newRecord, form);
            // }
            if (context.type === context.UserEventType.VIEW) {
                var objFieldGSTCode = fieldGSTCode(objSublist);
                objFieldGSTCode.updateDisplayType({
                    displayType: serverWidget.FieldDisplayType.NORMAL
                });
            } else {
                var objFieldGSTCode = fieldGSTCode(objSublist);
                objFieldGSTCode.updateDisplayType({
                    displayType: serverWidget.FieldDisplayType.HIDDEN
                });
                customizeGSTCodeLineField(objSublist, newRecord, form);
            }
        }

        function beforeSubmit(context) {
            var newRecord = context.newRecord;

            var inLine = newRecord.getLineCount({
                sublistId: 'item'
            });

            for (var indx = 0; indx < inLine; indx++) {
                var inCustomGSTCode = newRecord.getSublistValue({
                    sublistId: 'item',
                    fieldId: 'custpage_gst_code',
                    line: indx
                });

                newRecord.setSublistValue({
                    sublistId: 'item',
                    fieldId: 'custcol_gst_taxcode',
                    line: indx,
                    value: inCustomGSTCode
                });
            }
        }

        function afterSubmit(context) {
            var newRecord = context.newRecord;
            if (newRecord.id != null) {
                updateRequisition(newRecord);
            }
        }

        /**FUNCTION**/
        function getRoles(searchid) {
            var arrData = [];
            var searchObj = search.load({id: searchid, type: search.Type.ROLE});
            var searchResultCount = searchObj.runPaged().count;
            if (searchResultCount != 0) {
                searchObj.run().each(function (result) {
                    arrData.push(result.id);
                    return true;
                });
            }
            return arrData;
        }

        function getSpendSchedules(intRequisitionId) {
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
                        spend_schedule_status_id: result.getValue('custrecord_ct_spend_status'),
                        spend_schedule_status_text: result.getText('custrecord_ct_spend_status'),
                        spend_schedule_amount: result.getValue('custrecord_sr_sp_sch_amount')
                    });
                    return true;
                });
            }
            return arrData;
        }

        function updateRequisition(newRecord) {
            var arrSpendSchedules = getSpendSchedules(newRecord.id);
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
                    type: newRecord.type,
                    id: newRecord.id,
                    values: {
                        custbody_ss_total_committed: flTotalCommitted,
                        custbody_ss_total_available: flTotalAvailable,
                        custbody_ss_total_buffer: flTotalBuffered,
                        custbody_ss_grand_total: flGrandTotal
                    }
                });

            }
        }

        function checkingFieldGroupForFinance(context) {
            var newRecord = context.newRecord;
            var isSpendScheduleUpdated = newRecord.getValue({
                fieldId: 'custbody_sr_proc_spend_updated'
            });
            var isDataCheckCompletedAndProceedToPo = newRecord.getValue({
                fieldId: 'custbody_proc_data_completed_proceedpo'
            });
            var inStatus = newRecord.getValue({
                fieldId: 'status'
            });

            var Approved = 2;
            var inApprovalStatus = newRecord.getValue({
                fieldId: 'approvalstatus'
            });

            var stStatus = 'Pending Order (Pending Procurement Review)';

            if (inStatus == 'Pending Order') {
                if (inApprovalStatus == Approved) {
                    if ((!isSpendScheduleUpdated && !isDataCheckCompletedAndProceedToPo) || (isSpendScheduleUpdated && !isDataCheckCompletedAndProceedToPo) || (!isSpendScheduleUpdated && isDataCheckCompletedAndProceedToPo)) {
                        var stTitleLabel = '<script>'
                        stTitleLabel += 'var stStatusLabel = document.getElementsByClassName(\'uir-record-status\');' +
                            'var stLabel = \'' + stStatus + '\';' +
                            'stStatusLabel[0].innerHTML  = stLabel.toString();';
                        stTitleLabel += '</script>'
                        context.form.addField({
                            id: 'custpage_statuslabel',
                            label: 'not shown - hidden',
                            type: serverWidget.FieldType.INLINEHTML
                        }).defaultValue = stTitleLabel;
                    }
                }
            }
        }

        function customizeGSTCodeLineField(objSublist, newRecord, form) {
            var inSubsidiary = newRecord.getValue({
                fieldId: 'subsidiary'
            });
            var arrTaxCodes = searchTaxCodes(inSubsidiary);

            var fldGSTCode = objSublist.addField({
                id: 'custpage_gst_code',
                type: serverWidget.FieldType.SELECT,
                label: 'GST Code'
            });

            // form.insertField({
            //     field: fldGSTCode,
            //     nextfield: 'estimatedamount'
            // });

            var objField = objSublist.getField({
                id: 'custpage_gst_code'
            });

            objField.addSelectOption({
                value: '',
                text: ''
            });
            for (var indx = 0; indx < arrTaxCodes.length; indx++) {
                var objTaxCodes = arrTaxCodes[indx];

                if (objTaxCodes) {
                    objField.addSelectOption({
                        value: objTaxCodes.inInternalId,
                        text: objTaxCodes.stName
                    });
                }
            }
        }

        function fieldGSTCode(objSublist) {
            var objFieldGSTCode = objSublist.getField({
                id: 'custcol_gst_taxcode'
            });

            return objFieldGSTCode;
        }

        function searchTaxCodes(inSubsidiary) {
            var objTaxCodes = {};
            var arrTaxCodes = [];

            var objSearchTaxCodes = search.create({
                type: "salestaxitem",
                filters:
                    [
                        ["isinactive", "is", "F"],
                        "AND",
                        ["subsidiary", "anyof", inSubsidiary]
                    ],
                columns:
                    [
                        search.createColumn({
                            name: "internalid",
                            sort: search.Sort.ASC,
                            label: "Internal ID"
                        }),
                        search.createColumn({name: "name", label: "Name"})
                    ]
            });
            objSearchTaxCodes.run().each(function (result) {
                var inInternalId = result.getValue({
                    name: 'internalid'
                });
                var stName = result.getValue({
                    name: 'name'
                });

                objTaxCodes = {
                    inInternalId: inInternalId,
                    stName: stName
                }

                arrTaxCodes.push(objTaxCodes);

                return true;
            });

            return arrTaxCodes;
        }

        return {
            beforeLoad: beforeLoad,
            // beforeSubmit: beforeSubmit,
            afterSubmit: afterSubmit
        };

    });