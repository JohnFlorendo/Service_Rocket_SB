/**
 * @NApiVersion 2.0
 * @NScriptType ClientScript
 * @NModuleScope Public
 */

/*
ID : customscript_lcc_cs_paycycle_validation
Name : LCC CS Pay Cycle Validation
Purpose : This is a standalone client script for Service Rocket
Created On : September 10, 2020
Author : LCC
Script Type : Client Script
Saved Searches : NONE
*/

define(['N/search', 'N/record'],function(search, record) {
    var objTimeOffTypes = {};

    function pageInit(context) {
        objTimeOffTypes = getTimeOffTypes();

        setTimeout(function(){
            document.getElementById('tdbody_newrec700').setAttribute('style','display:none');
            // document.getElementById('recmachcustrecord_sr_pc_time_off_header_existingrecmachcustrecord_sr_pc_time_off_header_fs_lbl_uir_label').parentNode.setAttribute('style','display:none');
            // document.getElementById('tdbody_newrecrecmachcustrecord_sr_pc_time_off_header').setAttribute('style','display:none'); document.getElementById('tdbody_attach').setAttribute('style','display:none');
        }, 3000);

    }

    function fieldChanged(context) {
        var currentRecord = context.currentRecord;

        if(context.sublistId == 'recmachcustrecord_sr_pc_time_off_header' && context.fieldId == 'custrecord_sr_pc_time_off_record') {
            var intTimeOffRequestId = currentRecord.getCurrentSublistValue('recmachcustrecord_sr_pc_time_off_header','custrecord_sr_pc_time_off_record');

            if(intTimeOffRequestId != '') {
                var objTimeOffRequest = getTimeOffRequest(intTimeOffRequestId);
                var objPayCodes = {};
                var stTimeOffTypes = "";
                var stPayCode = "";
                var recPayrollProvider = record.load({type: "customrecord_payroll_provider", id: currentRecord.getValue('custrecord_payroll_provider'), isDynamic: true });
                if(recPayrollProvider.getValue('custrecord_sr_pp_paycode_id') != '') { objPayCodes = JSON.parse(recPayrollProvider.getValue('custrecord_sr_pp_paycode_id')); }

                if(typeof objTimeOffTypes[objTimeOffRequest.timeofftype] != 'undefined') { stTimeOffTypes = objTimeOffTypes[objTimeOffRequest.timeofftype]; }
                if(typeof objPayCodes[objTimeOffRequest.timeofftype] != "undefined") { stPayCode = objPayCodes[objTimeOffRequest.timeofftype]; } else { stPayCode = objTimeOffRequest.timeofftype; }
                currentRecord.setCurrentSublistValue({ sublistId: 'recmachcustrecord_sr_pc_time_off_header', fieldId: 'custrecord_timeofftype', value: stTimeOffTypes });
                currentRecord.setCurrentSublistValue({ sublistId: 'recmachcustrecord_sr_pc_time_off_header', fieldId: 'custrecord_timeofftype_paycode', value: stPayCode });
            }
        }
    }

    function validateLine(context) {
        var currentRecord = context.currentRecord;

        if(context.sublistId == 'recmachcustrecord_sr_pc_time_off_header') {
            var intTimeOffRequestAssociationId = currentRecord.getCurrentSublistValue('recmachcustrecord_sr_pc_time_off_header','id');

            /** CHECK IF TIME-OFF REQUEST IS MANUALLY ADDED AND DOES NOT HAVE ID YET **/
            if(intTimeOffRequestAssociationId == "") {
                var intTimeOffRequestId = currentRecord.getCurrentSublistValue('recmachcustrecord_sr_pc_time_off_header','custrecord_sr_pc_time_off_record');
                if(intTimeOffRequestId != '') {
                    /** VALIDATE IF TIME-OFF REQUEST IS NOT YET PROCESSED **/
                    var stLinkedPayCycleRecord = validateTimeOffRequestAssociation(intTimeOffRequestId);
                    if(stLinkedPayCycleRecord != '') {
                        alert('This Time-off Request Record is already linked to Pay Cycle '+stLinkedPayCycleRecord);
                        return false;
                    }

                    /** VALIDATE IF DUPLICATE ENTRY **/
                    // var isDuplicate = false;
                    // for (var intIndex=0; intIndex<currentRecord.getLineCount('recmachcustrecord_sr_pc_time_off_header'); intIndex++) {
                    //     if(intTimeOffRequestId == currentRecord.getSublistValue({sublistId: 'recmachcustrecord_sr_pc_time_off_header',fieldId: 'custrecord_sr_pc_time_off_record',line: intIndex})) {
                    //         isDuplicate = true;
                    //     }
                    // }
                    //
                    // if(isDuplicate) {
                    //     alert('Duplicate Time-Off Request Entry. ');
                    //     return false;
                    // }
                }
            }

        }

        return true;
    }

    function validateDelete(context) {
        var currentRecord = context.currentRecord;
        if(context.sublistId == "recmachcustrecord_sr_pc_time_off_header") {
            var intTimeOffAssocId = currentRecord.getCurrentSublistValue({sublistId:'recmachcustrecord_sr_pc_time_off_header', fieldId: 'id'});
            var intTimeOffAssocQuantity = parseFloat(currentRecord.getCurrentSublistValue({sublistId:'recmachcustrecord_sr_pc_time_off_header', fieldId: 'custrecord_sr_pc_amount_of_time'}));
            var intCurrentTimeOffAssocEmployeeId = currentRecord.getCurrentSublistValue({sublistId:'recmachcustrecord_sr_pc_time_off_header', fieldId: 'custrecord_sr_pc_time_off_employee'});

            for(var intIndex=0; intIndex<currentRecord.getLineCount('recmachcustrecord_sr_pcl_paycycleheader'); intIndex++) {
                var intEmployeeId = currentRecord.getSublistValue({sublistId: 'recmachcustrecord_sr_pcl_paycycleheader',fieldId: 'custrecord_sr_pcl_employee_id',line: intIndex});
                var blIsParentRow = currentRecord.getSublistValue({sublistId: 'recmachcustrecord_sr_pcl_paycycleheader',fieldId: 'custrecord_sr_pc_is_parent_row',line: intIndex});
                var flQuantity = parseFloat(currentRecord.getSublistValue({sublistId: 'recmachcustrecord_sr_pcl_paycycleheader',fieldId: 'custrecord_sr_pcl_quantity',line: intIndex}));
                if(intEmployeeId == intCurrentTimeOffAssocEmployeeId && blIsParentRow == true) {
                    // currentRecord.setSublistValue({sublistId: 'recmachcustrecord_sr_pcl_paycycleheader',fieldId: 'custrecord_sr_pcl_quantity',line: intIndex, value: parseFloat(flQuantity+intTimeOffAssocQuantity)});
                    var currLine = currentRecord.selectLine({sublistId: 'recmachcustrecord_sr_pcl_paycycleheader', line: intIndex});
                    currLine.setCurrentSublistValue({ sublistId: 'recmachcustrecord_sr_pcl_paycycleheader', fieldId: 'custrecord_sr_pcl_quantity', value: parseFloat(flQuantity+intTimeOffAssocQuantity) });
                    currLine.commitLine({sublistId: 'recmachcustrecord_sr_pcl_paycycleheader'});
                }
            }

            var intPayCycleLineId = currentRecord.findSublistLineWithValue({sublistId: 'recmachcustrecord_sr_pcl_paycycleheader', fieldId: 'custrecord_sr_pcl_timeoff_association', value: intTimeOffAssocId});
            if(intPayCycleLineId != -1) {
                currentRecord.removeLine({ sublistId: 'recmachcustrecord_sr_pcl_paycycleheader', line: intPayCycleLineId, ignoreRecalc: true });
            }

            var stDeletedStorage = currentRecord.getValue('custpage_deleteddatastorage');
            var objData = (stDeletedStorage != "") ? JSON.parse(stDeletedStorage) : {};
            if(objData[intTimeOffAssocId] == null) { objData[intTimeOffAssocId] = {}; }
            objData[intTimeOffAssocId] = {
                custrecord_sr_pc_time_off_record: currentRecord.getCurrentSublistValue({sublistId:'recmachcustrecord_sr_pc_time_off_header', fieldId: 'custrecord_sr_pc_time_off_record'}),
                custrecord_sr_pc_time_off_employee: currentRecord.getCurrentSublistValue({sublistId:'recmachcustrecord_sr_pc_time_off_header', fieldId: 'custrecord_sr_pc_time_off_employee'}),
                custrecord_sr_pc_time_off_header: currentRecord.getCurrentSublistValue({sublistId:'recmachcustrecord_sr_pc_time_off_header', fieldId: 'custrecord_sr_pc_time_off_header'}),
                custrecord_timeofftype_paycode: currentRecord.getCurrentSublistValue({sublistId:'recmachcustrecord_sr_pc_time_off_header', fieldId: 'custrecord_timeofftype_paycode'}),
                custrecord_timeofftype: currentRecord.getCurrentSublistValue({sublistId:'recmachcustrecord_sr_pc_time_off_header', fieldId: 'custrecord_timeofftype'}),
                custrecord_startdate: currentRecord.getCurrentSublistText({sublistId:'recmachcustrecord_sr_pc_time_off_header', fieldId: 'custrecord_startdate'}),
                custrecord_enddate: currentRecord.getCurrentSublistText({sublistId:'recmachcustrecord_sr_pc_time_off_header', fieldId: 'custrecord_enddate'}),
                custrecord_sr_pc_amount_of_time: currentRecord.getCurrentSublistValue({sublistId:'recmachcustrecord_sr_pc_time_off_header', fieldId: 'custrecord_sr_pc_amount_of_time'}),
                custrecord_sr_pc_for_reversal: currentRecord.getCurrentSublistValue({sublistId:'recmachcustrecord_sr_pc_time_off_header', fieldId: 'custrecord_sr_pc_for_reversal'}),
                custrecord_sr_pc_is_cancelled: currentRecord.getCurrentSublistValue({sublistId:'recmachcustrecord_sr_pc_time_off_header', fieldId: 'custrecord_sr_pc_is_cancelled'}),
            };
            currentRecord.setValue('custpage_deleteddatastorage', JSON.stringify(objData))
        }

        return true;
    }

    function lineInit(context) {
        var currentRecord = context.currentRecord;
        if(context.sublistId == 'recmachcustrecord_sr_pc_time_off_header') {
            var intTimeOffRequestAssociationId = currentRecord.getCurrentSublistValue('recmachcustrecord_sr_pc_time_off_header','id');
            if(intTimeOffRequestAssociationId != "") {
                nlapiDisableLineItemField('recmachcustrecord_sr_pc_time_off_header', 'custrecord_sr_pc_time_off_record', true);
                nlapiDisableLineItemField('recmachcustrecord_sr_pc_time_off_header', 'custrecord_sr_pc_time_off_employee', true);
                nlapiDisableLineItemField('recmachcustrecord_sr_pc_time_off_header', 'custrecord_startdate', true);
                nlapiDisableLineItemField('recmachcustrecord_sr_pc_time_off_header', 'custrecord_enddate', true);
                nlapiDisableLineItemField('recmachcustrecord_sr_pc_time_off_header', 'custrecord_timeofftype', true);
                nlapiDisableLineItemField('recmachcustrecord_sr_pc_time_off_header', 'custrecord_timeofftype_paycode', true);
                nlapiDisableLineItemField('recmachcustrecord_sr_pc_time_off_header', 'custrecord_sr_pc_time_off_header', true);
            } else {
                nlapiDisableLineItemField('recmachcustrecord_sr_pc_time_off_header', 'custrecord_sr_pc_time_off_record', false);
                nlapiDisableLineItemField('recmachcustrecord_sr_pc_time_off_header', 'custrecord_sr_pc_time_off_employee', false);
                nlapiDisableLineItemField('recmachcustrecord_sr_pc_time_off_header', 'custrecord_startdate', false);
                nlapiDisableLineItemField('recmachcustrecord_sr_pc_time_off_header', 'custrecord_enddate', false);
                nlapiDisableLineItemField('recmachcustrecord_sr_pc_time_off_header', 'custrecord_timeofftype', false);
                nlapiDisableLineItemField('recmachcustrecord_sr_pc_time_off_header', 'custrecord_timeofftype_paycode', false);
                nlapiDisableLineItemField('recmachcustrecord_sr_pc_time_off_header', 'custrecord_sr_pc_time_off_header', false);
            }

        }

    }

    /** FUNCTIONS **/
    function getTimeOffRequest(intTimeOffRequestId) {
        var objTimeOffRequests = {};
        var timeoffrequestSearchObj = search.create({
            type: "timeoffrequest",
            filters: [["internalid","is", intTimeOffRequestId]],
            columns: [
                search.createColumn({ name: "internalid", summary: "GROUP" }),
                search.createColumn({ name: "startdate", summary: "GROUP" }),
                search.createColumn({ name: "enddate", summary: "GROUP" }),
                search.createColumn({ name: "employee", summary: "GROUP" }),
                search.createColumn({ name: "timeofftype", summary: "GROUP" }),
                search.createColumn({ name: "amountoftime", join: "timeOffRequestDetail", summary: "SUM" })
            ]
        });

        var searchResultCount = timeoffrequestSearchObj.runPaged().count;
        if(searchResultCount != 0) {
            timeoffrequestSearchObj.run().each(function(result){
                objTimeOffRequests = {
                    recordid: result.getValue({ name: "internalid", summary: "GROUP" }),
                    employee: result.getValue({ name: "employee", summary: "GROUP" }),
                    timeofftype: result.getValue({ name: "timeofftype", summary: "GROUP" }),
                    startdate: result.getValue({ name: "startdate", summary: "GROUP" }),
                    enddate: result.getValue({ name: "enddate", summary: "GROUP" }),
                    amountoftime: result.getValue({ name: "amountoftime", join: "timeOffRequestDetail", summary: "SUM" })
                };
                return true;
            });
        }

        return objTimeOffRequests;
    }

    function validateTimeOffRequestAssociation(intTimeOffRequestId) {
        var stPayCycle = "";
        var timeoffrequestAssociationSearchObj = search.create({
            type: "customrecord_sr_pc_time_off_assoc",
            filters: [
                ["custrecord_sr_pc_time_off_header","anyof","@NONE@"], "AND",
                ["custrecord_sr_pc_time_off_record","is", intTimeOffRequestId]
            ],
            columns: [search.createColumn({ name: "custrecord_sr_pc_time_off_header"})]
        });

        var searchResultCount = timeoffrequestAssociationSearchObj.runPaged().count;

        if(searchResultCount == 0) {
            var timeoffrequestAssociationSearchObj = search.create({
                type: "customrecord_sr_pc_time_off_assoc",
                filters: [
                    ["custrecord_sr_pc_time_off_header","noneof","@NONE@"], "AND",
                    ["custrecord_sr_pc_time_off_record","is", intTimeOffRequestId]
                ],
                columns: [search.createColumn({ name: "custrecord_sr_pc_time_off_header"})]
            });
            var searchResultCount1 = timeoffrequestAssociationSearchObj.runPaged().count;
            if(searchResultCount1 != 0) {
                timeoffrequestAssociationSearchObj.run().each(function(result){
                    stPayCycle += result.getText({ name: "custrecord_sr_pc_time_off_header"}) + ' ';
                    return true;
                });
            }

        }

        return stPayCycle;
    }

    function getTimeOffTypes() {
        var objTimeOffTypes = {};
        var timeofftypeSearchObj = search.create({
            type: "timeofftype",
            // filters: [["custrecord_sr_epayroll_code","isnotempty",""]],
            filters: [],
            columns: [
                search.createColumn({name: "custrecord_sr_epayroll_code"}),
                search.createColumn({name: "name"}),
                search.createColumn({name: "displayname"}),
            ]
        });

        var searchResultCount = timeofftypeSearchObj.runPaged().count;
        if(searchResultCount != 0) {
            timeofftypeSearchObj.run().each(function(result){
                if(objTimeOffTypes[result.getValue('name')] == null) {
                    objTimeOffTypes[result.getValue('name')] = result.id;
                }

                return true;
            });
        }

        return objTimeOffTypes;
    }

    return { pageInit: pageInit, fieldChanged: fieldChanged, validateLine: validateLine, lineInit: lineInit, validateDelete: validateDelete };
});