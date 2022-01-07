/**
 *@NApiVersion 2.x
 *@NScriptType UserEventScript
 */
define(['N/format', 'N/task', 'N/search', 'N/record', 'N/url', 'N/ui/message', 'N/ui/serverWidget', '../Library/lcc_lib_payroll', '../Library/sr_lib_update_spend_schedule'],
    function (format, task, search, record, url, message, serverWidget, libHelper, libFieldMapping) {
        var Purchase_Order = 'purchaseorder';
        var Spend_Schedule = 'customrecord_sr_spend_schedule';

        function beforeLoad(context) {
            var newRecord = context.newRecord;

            if (newRecord.type == Spend_Schedule) {
                var inTransId = newRecord.getValue('custrecord_sr_sp_sch_po_pr_trans');
                if (!inTransId) {
                    inTransId = newRecord.getValue('custrecord_sr_sp_sch_po_trans');
                }

                var arrResult = libFieldMapping.searchLineDescriptionRequisition(inTransId);
                var objField = context.form.addField({
                    id: libFieldMapping.fieldIds.Custpage_Line_Description,
                    type: serverWidget.FieldType.SELECT,
                    label: 'Line Description',
                    // container: 'main'
                });
                objField.isMandatory = true;
                context.form.insertField({
                    field : objField,
                    nextfield : 'custrecord_sr_sp_sch_amount'
                });

                objField.addSelectOption({
                    value: '',
                    text: ''
                });

                for (var indx = 0; indx < arrResult.length; indx++) {
                    var objPerTransactionRecord = arrResult[indx];
                    for (var stField in objPerTransactionRecord) {
                        var valueField = objPerTransactionRecord[stField];
                        if (valueField) {
                            objField.addSelectOption({
                                value: valueField.trim().replace(/\r?\n|\r/g, " "),
                                text: valueField
                            });
                        }
                    }
                }

                var stLineDescription = newRecord.getValue({
                    fieldId: libFieldMapping.fieldIds.Custrecord_Line_Description
                });
                log.debug('load stLineDescription', stLineDescription);
                newRecord.setValue({
                    fieldId: libFieldMapping.fieldIds.Custpage_Line_Description,
                    value: stLineDescription
                });
            }
        }

        function beforeSubmit(context) {
            var newRecord = context.newRecord;

            if (newRecord.type == Spend_Schedule) {
                var stLineDescription = newRecord.getValue({
                    fieldId: libFieldMapping.fieldIds.Custpage_Line_Description
                });
                log.debug('submit stLineDescription', stLineDescription);
                newRecord.setValue({
                    fieldId: libFieldMapping.fieldIds.Custrecord_Line_Description,
                    value: stLineDescription
                });
            }
        }

        function afterSubmit(context) {
            var newRecord = context.newRecord;

            if (newRecord.id != null) {
                if (newRecord.type == Purchase_Order) {
                    var intRequisitionId = libFieldMapping.getRequisitionId(newRecord.id);
                    if (intRequisitionId) {
                        var intPurchaseOrderId = newRecord.id;
                        var arrSpendSchedules = libFieldMapping.getSpendSchedules(intRequisitionId, intPurchaseOrderId);
                        if (arrSpendSchedules.length != 0) {
                            var mrTask = task.create({taskType: task.TaskType.MAP_REDUCE});
                            mrTask.scriptId = 'customscript_sr_mr_update_spend_schedule';
                            mrTask.deploymentId = 'customdeploy_sr_mr_update_spend_schedule';
                            mrTask.params = {'custscript_param_arrdata': JSON.stringify(arrSpendSchedules)};
                            var mrTaskId = mrTask.submit();
                            log.debug('mrTaskId', mrTaskId);
                        }
                    }
                } else {
                    var intPurchaseOrderId = newRecord.getValue('custrecord_sr_sp_sch_po_trans');
                    if (!intPurchaseOrderId) {
                        var intRequisitionId = newRecord.getValue('custrecord_sr_sp_sch_po_pr_trans');
                        if (intRequisitionId) {
                            intPurchaseOrderId = libFieldMapping.getPurchaseOrderId(intRequisitionId);
                            if (intPurchaseOrderId) {
                                record.submitFields({
                                    type: "customrecord_sr_spend_schedule",
                                    id: newRecord.id,
                                    values: {custrecord_sr_sp_sch_po_trans: intPurchaseOrderId}
                                });
                            }
                        }
                    }

                    /** Update Requisition Totals **/
                    libFieldMapping.updateRequisition(newRecord);
                }
            }
        }

        return {beforeLoad: beforeLoad, beforeSubmit: beforeSubmit, afterSubmit: afterSubmit};

    });